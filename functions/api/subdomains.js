// GET /api/subdomains?domain=example.com
// Découverte PASSIVE de sous-domaines via Certificate Transparency (crt.sh).
// Aucun scan actif. Usage prévu : audit de sa propre surface d'attaque.

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 10) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'subdomains');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const domain = (searchParams.get('domain') || '').trim().toLowerCase();

  if (!domain) {
    return new Response(JSON.stringify({
      usage: 'GET /api/subdomains?domain=example.com',
      note: 'Passive discovery via public Certificate Transparency logs (crt.sh). No active scanning.',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (!DOMAIN_RE.test(domain)) {
    return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`crt.sh error: HTTP ${res.status}`);
    const data = await res.json();

    const subdomains = new Set();
    for (const entry of data) {
      const names = String(entry.name_value || '').split('\n');
      for (const n of names) {
        const clean = n.trim().toLowerCase().replace(/^\*\./, '');
        if (clean.endsWith('.' + domain) || clean === domain) {
          subdomains.add(clean);
        }
      }
    }

    const sorted = Array.from(subdomains).sort();

    return new Response(JSON.stringify({
      domain,
      count: sorted.length,
      subdomains: sorted.slice(0, 500),
      source: 'Certificate Transparency logs (crt.sh) — passive, publicly available data.',
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'crt.sh request timed out. Try again shortly.' }), {
        status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    return new Response(JSON.stringify({ error: 'Could not query certificate transparency logs.', detail: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
