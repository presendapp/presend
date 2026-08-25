// GET /api/base64?action=encode&text=hello  ou  ?action=decode&text=aGVsbG8=

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 60) return false;
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

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'base64');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 60 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'encode';
  const text = searchParams.get('text');

  if (!text) {
    return new Response(JSON.stringify({
      usage: 'GET /api/base64?action=encode|decode&text=...',
      example: 'https://presend.pages.dev/api/base64?action=encode&text=hello',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (text.length > 10000) {
    return new Response(JSON.stringify({ error: 'Text too long (max 10000 chars). Use the browser tool for larger inputs.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    let result;
    if (action === 'decode') {
      result = new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
    } else {
      result = btoa(new TextEncoder().encode(text).reduce((s, b) => s + String.fromCharCode(b), ''));
    }
    return new Response(JSON.stringify({ action, input: text, result }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid input for ' + action, detail: e.message }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
