// GET /api/password-breach?password=...
// Utilise le pattern k-anonymity de HIBP : seuls les 5 premiers caractères du hash SHA-1
// sont envoyés à l'API externe. Le mot de passe complet ne quitte jamais l'edge Cloudflare
// et n'est jamais loggé.

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 20) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });

  // Tracking d'usage (best-effort, ne bloque jamais la requête si ça échoue)
  try {
    const today = new Date().toISOString().split('T')[0];
    const visitKey = `api-visits:${bucket}:${today}`;
    const visits = await env.PRESEND_ANALYTICS.get(visitKey);
    await env.PRESEND_ANALYTICS.put(visitKey, ((visits ? parseInt(visits) : 0) + 1).toString());
  } catch (e) { /* tracking best-effort */ }

  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

async function sha1Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'passwordbreach');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 20 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password');

  if (!password) {
    return new Response(JSON.stringify({
      usage: 'GET /api/password-breach?password=...',
      note: 'Uses k-anonymity: only the first 5 chars of the SHA-1 hash are sent externally. Your password is never logged or transmitted in full.',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (password.length > 256) {
    return new Response(JSON.stringify({ error: 'Password too long' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HIBP API error: HTTP ${res.status}`);
    const text = await res.text();

    let breachCount = 0;
    for (const line of text.split('\n')) {
      const [lineSuffix, countStr] = line.trim().split(':');
      if (lineSuffix === suffix) {
        breachCount = parseInt(countStr, 10);
        break;
      }
    }

    return new Response(JSON.stringify({
      breached: breachCount > 0,
      breach_count: breachCount,
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Could not check password right now.', detail: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
