export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const { keys } = await env.PRESEND_ANALYTICS.list({ prefix: "visits:" });
    const stats = {};
    let total = 0;
    
    for (const key of keys) {
      const value = await env.PRESEND_ANALYTICS.get(key.name);
      const parts = key.name.split(":");
      const tool = parts[1];
      const date = parts[2];
      
      if (!stats[tool]) stats[tool] = {};
      stats[tool][date] = parseInt(value);
      total += parseInt(value);
    }
    
    return new Response(JSON.stringify({
      total,
      tools: stats,
      message: "Privacy-first analytics (no cookies, no IP)"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
