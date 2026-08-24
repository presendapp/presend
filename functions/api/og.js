function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const tool = escapeXml((url.searchParams.get('tool') || 'Presend').slice(0, 100));
  const subtitle = escapeXml((url.searchParams.get('subtitle') || 'Free Privacy Tools').slice(0, 150));

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1F3A5F"/>
  <rect x="40" y="40" width="1120" height="550" rx="20" fill="#F7F5F0"/>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#1F3A5F" text-anchor="middle">${tool}</text>
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="36" fill="#6c757d" text-anchor="middle">${subtitle}</text>
  <text x="600" y="480" font-family="Arial, sans-serif" font-size="24" fill="#0066cc" text-anchor="middle">presend.pages.dev — 100% browser-based, zero upload</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    }
  });
}
