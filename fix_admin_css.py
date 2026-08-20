from pathlib import Path
import re

css_file = Path("css/admin.css")
css = css_file.read_text(encoding="utf-8", errors="ignore").strip()

pattern = re.compile(r'<style>\s*' + re.escape(css) + r'\s*</style>', re.S)

paths = [Path("admin.html")] + [Path(f"{lang}/admin.html") for lang in ["de","es","fr","hi","ja","pt","ru"]]
replaced = 0

for f in paths:
    if not f.exists():
        continue
    html = f.read_text(encoding="utf-8", errors="ignore")
    new_html, n = pattern.subn('<link rel="stylesheet" href="/css/admin.css">', html)
    if n > 0:
        f.write_text(new_html, encoding="utf-8")
        replaced += 1
        print(f"MODIFIÉ: {f}")
    else:
        print(f"PAS MATCH: {f}")

print(f"\nTotal: {replaced} pages modifiées")
