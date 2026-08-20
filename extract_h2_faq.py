from pathlib import Path
import re

# Mapping: slug -> langues
SLUGS = [
    "how-to-clean-urls-for-sharing",
    "how-to-compress-images-email", 
    "how-to-remove-metadata-before-sharing",
    "how-to-verify-downloaded-file-safe",
]

LANGS = ["de", "es", "fr", "hi", "ja", "pt", "ru"]

for slug in SLUGS:
    print(f"\n=== {slug} ===")
    
    # Version EN
    f_en = Path(f"guides/{slug}.html")
    if f_en.exists():
        html = f_en.read_text(encoding="utf-8", errors="ignore")
        h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.S)
        h2s = [re.sub(r'<[^>]+>', '', h).strip() for h in h2s]
        print(f"EN: {h2s}")
    
    # Versions traduites
    for lang in LANGS:
        f = Path(f"{lang}/guides/{slug}.html")
        if f.exists():
            html = f.read_text(encoding="utf-8", errors="ignore")
            h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.S)
            h2s = [re.sub(r'<[^>]+>', '', h).strip() for h in h2s]
            print(f"{lang}: {h2s}")
