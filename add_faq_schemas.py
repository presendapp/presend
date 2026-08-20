from pathlib import Path
import re

# FAQ schemas par sujet (EN)
FAQ_SCHEMAS = {
    "how-to-clean-urls-for-sharing": {
        "questions": [
            ("What are tracking parameters in URLs?", "Tracking parameters like UTM, fbclid, and gclid are added by marketing platforms to monitor where clicks come from. They can reveal your browsing habits and make links look messy when shared."),
            ("Is it safe to remove tracking parameters?", "Yes — removing tracking parameters only deletes the monitoring tags. The destination website and its content remain completely unchanged."),
            ("Can cleaned URLs still work?", "Absolutely. A cleaned URL points to the exact same page. Only the tracking junk is removed, so links work perfectly for everyone."),
        ]
    },
    "how-to-compress-images-email": {
        "questions": [
            ("What is the best image size for email?", "Most email providers recommend images under 1 MB total per email. Individual images should ideally be under 200 KB to ensure fast loading and avoid spam filters."),
            ("Does compressing images reduce quality?", "Our tool uses smart compression that reduces file size while keeping visual quality high. You can preview the result before downloading."),
            ("Which image format is best for email?", "JPG is best for photos, PNG for images with transparency, and WebP offers the best compression with quality. Our converter handles all three."),
        ]
    },
    "how-to-remove-metadata-before-sharing": {
        "questions": [
            ("What is metadata in files?", "Metadata is hidden information embedded in files — like GPS coordinates in photos, author names in documents, and creation dates in PDFs. It can reveal personal information you didn't intend to share."),
            ("Can metadata reveal my location?", "Yes — photos taken with smartphones often contain GPS coordinates in their EXIF metadata. Anyone with the right tool can extract your exact location from an unedited photo."),
            ("Is removing metadata reversible?", "No — once metadata is removed, it cannot be recovered. Make sure to keep an original copy if you need the metadata for your own records."),
        ]
    },
    "how-to-verify-downloaded-file-safe": {
        "questions": [
            ("What is a file hash?", "A file hash is a unique fingerprint generated from a file's contents. If even one byte changes, the hash changes completely — making it perfect for verifying file integrity."),
            ("What is SHA-256?", "SHA-256 is a cryptographic hash function that produces a 64-character string. It's the industry standard for verifying file integrity because it's extremely secure and virtually impossible to fake."),
            ("Should I verify every download?", "For critical software, updates, or files from unofficial sources — yes. Verifying the hash ensures the file hasn't been tampered with or corrupted during download."),
        ]
    },
}

def build_faq_schema(questions, url):
    items = []
    for q, a in questions:
        items.append(f'''    {{
      "@type": "Question",
      "name": "{q}",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "{a}"
      }}
    }}''')
    
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
{',\n'.join(items)}
  ]
}}
</script>'''

replaced = 0

for slug, data in FAQ_SCHEMAS.items():
    f = Path(f"guides/{slug}.html")
    if not f.exists():
        print(f"SKIP: {f}")
        continue
    
    html = f.read_text(encoding="utf-8", errors="ignore")
    
    # Vérifier si FAQ déjà présent
    if '"@type": "FAQPage"' in html:
        print(f"SKIP (déjà FAQ): {f}")
        continue
    
    # Construire le schema
    url = f"https://presend.pages.dev/guides/{slug}"
    schema = build_faq_schema(data["questions"], url)
    
    # Insérer avant </body>
    if "</body>" in html:
        new_html = html.replace("</body>", schema + "\n</body>")
        f.write_text(new_html, encoding="utf-8")
        replaced += 1
        print(f"AJOUTÉ: {f}")
    else:
        print(f"SKIP (pas de </body>): {f}")

print(f"\nTotal: {replaced} guides EN modifiés")
