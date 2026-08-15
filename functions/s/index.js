export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const hash = url.pathname.replace('/s/', '').replace('/', '');
  
  try {
    const value = await env.PRESEND_ANALYTICS.get('share:' + hash);
    if (!value) {
      return Response.redirect('https://presend.pages.dev/404.html', 302);
    }
    const data = JSON.parse(value);
    return Response.redirect('https://presend.pages.dev/tools/' + data.tool, 302);
  } catch (e) {
    return Response.redirect('https://presend.pages.dev/404.html', 302);
  }
}
