export async function onRequestGet(context) {
  const { env, params } = context;
  const hash = params.hash;
  
  try {
    const value = await env.PRESEND_ANALYTICS.get(`share:${hash}`);
    if (!value) {
      return Response.redirect('https://presend.pages.dev/404.html', 302);
    }
    
    const data = JSON.parse(value);
    const toolUrl = `https://presend.pages.dev/tools/${data.tool}`;
    
    return Response.redirect(toolUrl, 302);
  } catch (e) {
    return Response.redirect('https://presend.pages.dev/404.html', 302);
  }
}
