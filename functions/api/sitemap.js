export async function onRequestGet() {
  const today = "2026-08-15";
  const urls = [
    { loc: "https://presend.pages.dev/", priority: "1.0", changefreq: "weekly" },
    { loc: "https://presend.pages.dev/about", priority: "0.7", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/privacy", priority: "0.7", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/faq", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/alternatives", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/color-contrast", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/email-list-cleaner", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/exif-remover", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/file-hash-checker", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/heic-converter", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/image-compressor", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/image-resizer", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/image-to-base64", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/json-csv-converter", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/office-metadata-remover", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/password-generator", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/password-strength", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/pdf-compress", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/pdf-merger", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/pdf-metadata-remover", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/qr-code-generator", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/text-diff", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/text-formatter", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/thread-splitter", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/url-cleaner", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/video-metadata-remover", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/word-counter", priority: "0.9", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/bold-text-generator-social-media", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/check-file-integrity-sha256", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/check-password-strength", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/check-sha256-download", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/clean-email-list-free", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/clean-pdf-before-email", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/clean-url-before-sharing", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/clean-word-document-metadata", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/compare-texts-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/compare-two-texts-diff", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/compress-image-email", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/compress-pdf-for-email-attachment", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/convert-heic-jpg-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/convert-heic-to-jpg-windows", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/convert-json-to-csv-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/create-qr-code-link", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/generate-strong-password", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/image-to-base64-converter", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/json-to-csv-converter-free", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/merge-pdf-files-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/merge-pdfs-into-one-document", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/pdf-metadata-remover-mac", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/qr-code-generator-free", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/reduce-pdf-file-size", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-author-from-word-document", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-duplicates-email-list", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-exif-iphone", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-gps-from-iphone-photo", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-gps-from-photo", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-gps-from-video", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-photo-location-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-tracking-from-url", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/remove-video-location-data", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/resize-image-for-instagram", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/resize-image-for-linkedin-banner", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/shrink-pdf-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/split-text-twitter-thread", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/strip-metadata-pdf", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/strong-password-generator-online", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/wcag-color-contrast-checker", priority: "0.8", changefreq: "monthly" },
    { loc: "https://presend.pages.dev/tools/landings/word-counter-online", priority: "0.8", changefreq: "monthly" },
  ];

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
