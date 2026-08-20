from pathlib import Path

old = '<link href="style.css" rel="stylesheet"/>'
new = '<link href="style.css" rel="preload" as="style"/>\n<link href="style.css" rel="stylesheet" fetchpriority="high"/>'

replaced = 0

for f in ["admin.html", "de/admin.html", "es/admin.html", "fr/admin.html", 
          "hi/admin.html", "ja/admin.html", "pt/admin.html", "ru/admin.html"]:
    path = Path(f)
    if not path.exists():
        continue
    html = path.read_text(encoding="utf-8", errors="ignore")
    if old in html:
        new_html = html.replace(old, new)
        path.write_text(new_html, encoding="utf-8")
        replaced += 1
        print(f"MODIFIÉ: {f}")

print(f"\nTotal: {replaced} pages")
