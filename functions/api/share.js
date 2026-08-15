export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const tool = body.tool || 'home';
    const data = body.data || '';
    
    // Génère un hash court (8 caractères)
    const hash = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .slice(0, 8);
    
    const key = `share:${hash}`;
    const value = JSON.stringify({ tool, data, created: Date.now() });
    
    // Stockage KV (expire après 30 jours)
    await env.PRESEND_ANALYTICS.put(key, value, { expirationTtl: 2592000 });
    
    return new Response(JSON.stringify({
      success: true,
      hash,
      shortUrl: `https://presend.pages.dev/s/${hash}`,
      message: "Share link created!"
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
