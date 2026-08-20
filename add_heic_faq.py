from pathlib import Path

faq_schema = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why does my iPhone use HEIC?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Apple switched to HEIC (High Efficiency Image Container) because it produces photos with the same quality as JPG but at roughly half the file size. This saves storage space on your device and reduces bandwidth when sharing. However, not all platforms and devices support HEIC natively, which is why conversion is often necessary."
      }
    },
    {
      "@type": "Question",
      "name": "The privacy-friendly way to convert",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Unlike online converters that upload your photos to servers, our HEIC to JPG converter runs entirely in your browser. Your images never leave your device — no account, no tracking, no data collection. This ensures your personal photos remain completely private."
      }
    },
    {
      "@type": "Question",
      "name": "Does conversion reduce quality?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No — converting HEIC to JPG does not reduce image quality when done correctly. Our tool preserves the original resolution and color depth. The only change is the file format, which makes the image universally compatible with all devices and platforms."
      }
    },
    {
      "@type": "Question",
      "name": "Batch workflow tip",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can convert multiple HEIC files at once by selecting them all in the file picker. The tool processes each image individually and provides a ZIP download containing all converted JPG files. This saves time when converting entire photo albums."
      }
    }
  ]
}
</script>'''

f = Path("guides/how-to-convert-heic-jpg.html")
html = f.read_text(encoding="utf-8", errors="ignore")

if '"@type": "FAQPage"' not in html:
    new_html = html.replace("</body>", faq_schema + "\n</body>")
    f.write_text(new_html, encoding="utf-8")
    print(f"AJOUTÉ: {f}")
else:
    print(f"DÉJÀ PRÉSENT: {f}")
