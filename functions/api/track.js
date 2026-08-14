export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const tool = body.tool || 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const key = `visits:${tool}:${date}`;
    
    let count = await env.PRESEND_ANALYTICS.get(key);
    count = count ? parseInt(count) : 0;
    count++;
    
    await env.PRESEND_ANALYTICS.put(key, count.toString());
    
    return new Response(JSON.stringify({
      tool,
      date,
      count,
      message: "Tracked anonymously"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
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
