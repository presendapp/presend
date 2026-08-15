export async function onRequestGet() {
  const base = 'https://presend.pages.dev';
  const today = new Date().toISOString().split('T')[0];
  
  let urls = [
    { loc: base + '/', priority: '1.0', changefreq: 'weekly' },
    { loc: base + '/about', priority: '0.7', changefreq: 'monthly' },
    { loc: base + '/privacy', priority: '0.7', changefreq: 'monthly' },
    { loc: base + '/faq', priority: '0.8', changefreq: 'monthly' },
    { loc: base + '/alternatives', priority: '0.8', changefreq: 'monthly' },
  ];
  
  // Auto-detect tools
  const tools = [
    'color-contrast', 'email-list-cleaner', 'exif-remover', 'file-hash-checker',
    'heic-converter', 'image-compressor', 'image-to-base64', 'json-csv-converter',
    'office-metadata-remover', 'password-generator', 'password-strength', 'pdf-compress',
    'pdf-merger',
    'pdf-metadata-remover', 'qr-code-generator', 'text-diff', 'text-formatter',
    'thread-splitter', 'url-cleaner', 'video-metadata-remover', 'word-counter'
  ];
  
  for (const tool of tools) {
    urls.push({ loc: base + '/tools/' + tool, priority: '0.9', changefreq: 'monthly' });
  }
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of urls) {
    xml += `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>\n`;
  }
  xml += '</urlset>';
  
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
  });
}
