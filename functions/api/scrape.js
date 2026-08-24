const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB, largement suffisant pour du HTML de head

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\.0\.0\.0$/,
  /^\[?::1\]?$/, /^\[?fc00:/i, /^\[?fe80:/i,
  /\.local$/i, /^metadata\./i,
];

function isBlockedHostname(hostname) {
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

async function checkRateLimit(env, clientIP) {
  if (!env.PRESEND_ANALYTICS) return true; // fail-open si KV absent en dev
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:scrape:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 15) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });
  return true;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 15 requests per minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
    if (isBlockedHostname(parsedUrl.hostname)) {
      throw new Error('Blocked hostname');
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid or disallowed URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    // Re-vérifie l'hôte final après redirections (SSRF via redirect)
    const finalUrl = new URL(response.url);
    if (isBlockedHostname(finalUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Blocked hostname after redirect' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_RESPONSE_BYTES) {
      return new Response(JSON.stringify({ error: 'Target page too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(JSON.stringify({ error: 'Not an HTML page' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lit au maximum MAX_RESPONSE_BYTES même sans content-length fiable
    const reader = response.body.getReader();
    let received = 0;
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_RESPONSE_BYTES) {
        reader.cancel();
        return new Response(JSON.stringify({ error: 'Target page too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(
      chunks.reduce((acc, c) => new Uint8Array([...acc, ...c]), new Uint8Array())
    );

    const result = {
      url: targetUrl,
      title: extractMeta(html, 'og:title') || extractTag(html, '<title>', '</title>') || null,
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description') || null,
      image: extractMeta(html, 'og:image') || null,
      siteName: extractMeta(html, 'og:site_name') || null,
      type: extractMeta(html, 'og:type') || 'website',
      favicon: extractFavicon(html, parsedUrl) || null,
      canonical: extractLink(html, 'canonical') || null,
    };

    if (result.image && !result.image.startsWith('http')) {
      result.image = new URL(result.image, parsedUrl.origin).href;
    }
    if (result.favicon && !result.favicon.startsWith('http')) {
      result.favicon = new URL(result.favicon, parsedUrl.origin).href;
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (e) {
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function extractMeta(html, property) {
  let match = html.match(new RegExp(`<meta[^>]+property=["']${escapeRegex(property)}["'][^>]*>`, 'i'));
  if (!match) {
    match = html.match(new RegExp(`<meta[^>]+name=["']${escapeRegex(property)}["'][^>]*>`, 'i'));
  }
  if (!match) return null;
  const contentMatch = match[0].match(/content=["']([^"']*)["']/i);
  return contentMatch ? decodeHtmlEntities(contentMatch[1]).trim() : null;
}

function extractTag(html, open, close) {
  const idx = html.indexOf(open);
  if (idx === -1) return null;
  const start = idx + open.length;
  const end = html.indexOf(close, start);
  if (end === -1) return null;
  return decodeHtmlEntities(html.slice(start, end)).trim();
}

function extractLink(html, rel) {
  const match = html.match(new RegExp(`<link[^>]+rel=["']${escapeRegex(rel)}["'][^>]*>`, 'i'));
  if (!match) return null;
  const hrefMatch = match[0].match(/href=["']([^"']*)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
}

function extractFavicon(html, parsedUrl) {
  let match = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]*>/i);
  if (match) {
    const hrefMatch = match[0].match(/href=["']([^"']*)["']/i);
    if (hrefMatch) return hrefMatch[1];
  }
  return '/favicon.ico';
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'",
    '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
  };
  return text.replace(/&[#a-zA-Z0-9]+;/g, (entity) => entities[entity] || entity);
}
