// GET /api/favicon?domain=example.com  -> { favicon: "https://example.com/favicon.ico" }

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 30) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\.0\.0\.0$/,
  /^\[?::1\]?$/, /^\[?fc00:/i, /^\[?fe80:/i,
  /\.local$/i, /^metadata\./i,
];
function isBlockedHostname(hostname) {
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'favicon');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 30 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  let domain = (searchParams.get('domain') || '').trim();

  if (!domain) {
    return new Response(JSON.stringify({ usage: 'GET /api/favicon?domain=example.com' }, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  domain = domain.replace(/^https?:\/\//, '').split('/')[0];
  if (isBlockedHostname(domain)) {
    return new Response(JSON.stringify({ error: 'Disallowed domain' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const targetUrl = 'https://' + domain + '/';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
    });
    clearTimeout(timeout);

    const finalUrl = new URL(res.url);
    if (isBlockedHostname(finalUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Disallowed domain after redirect' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    let faviconPath = '/favicon.ico';
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = (await res.text()).slice(0, 100000);
      const m = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]*>/i);
      if (m) {
        const hrefMatch = m[0].match(/href=["']([^"']*)["']/i);
        if (hrefMatch) faviconPath = hrefMatch[1];
      }
    }

    const faviconUrl = faviconPath.startsWith('http')
      ? faviconPath
      : new URL(faviconPath, finalUrl.origin).href;

    return new Response(JSON.stringify({ domain, favicon: faviconUrl }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400', ...corsHeaders() },
    });
  } catch (e) {
    clearTimeout(timeout);
    return new Response(JSON.stringify({
      domain,
      favicon: 'https://' + domain + '/favicon.ico',
      note: 'Could not verify, returning default guess.',
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
    });
  }
}
