import re

BASE_URL = "https://presendapp.netlify.app"

def insert_after(content, marker, addition):
    if addition.strip() in content:
        return content  # déjà présent, on ne double pas
    return content.replace(marker, marker + "\n" + addition, 1)

pages = {
    "index.html": {
        "url": BASE_URL + "/",
        "title": "Presend — Prepare your files before you send them",
        "desc": "Free browser-based tools to clean, compress and prepare files before you share them. Nothing is ever uploaded.",
        "jsonld": None,
    },
    "tools/exif-remover.html": {
        "url": BASE_URL + "/tools/exif-remover.html",
        "title": "EXIF Remover — Presend",
        "desc": "Remove hidden EXIF data (GPS location, camera model, timestamps) from a photo, entirely in your browser.",
        "jsonld": {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "EXIF Remover",
            "url": BASE_URL + "/tools/exif-remover.html",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Any (runs in browser)",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "description": "Remove hidden EXIF metadata (GPS, camera model, timestamps) from a photo entirely client-side."
        },
    },
    "tools/pdf-metadata-remover.html": {
        "url": BASE_URL + "/tools/pdf-metadata-remover.html",
        "title": "PDF Metadata Remover — Presend",
        "desc": "Remove hidden metadata (author, software used, dates) from a PDF, entirely in your browser.",
        "jsonld": {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PDF Metadata Remover",
            "url": BASE_URL + "/tools/pdf-metadata-remover.html",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Any (runs in browser)",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "description": "Remove hidden document metadata from a PDF entirely client-side, using pdf-lib."
        },
    },
}

import json

for path, info in pages.items():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    og_block = (
        f'  <meta property="og:title" content="{info["title"]}">\n'
        f'  <meta property="og:description" content="{info["desc"]}">\n'
        f'  <meta property="og:type" content="website">\n'
        f'  <meta property="og:url" content="{info["url"]}">\n'
        f'  <meta name="twitter:card" content="summary">'
    )

    marker = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    content = insert_after(content, marker, og_block)

    if info["jsonld"]:
        script_block = (
            '<script type="application/ld+json">\n'
            + json.dumps(info["jsonld"], indent=2)
            + '\n</script>'
        )
        if 'application/ld+json' not in content:
            content = content.replace("</body>", script_block + "\n</body>", 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Mis à jour : {path}")

print("Terminé.")
