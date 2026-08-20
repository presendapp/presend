from pathlib import Path
import re

replaced = 0

for f in sorted(Path(".").rglob("*.html")):
    if ".git" in f.parts: continue
    html = f.read_text(encoding="utf-8", errors="ignore")
    
    # Vérifier si preload déjà présent pour style.css
    if 'rel="preload"' in html and 'style.css' in html:
        continue
    
    # Chercher le pattern: <link href="..." rel="stylesheet" fetchpriority="high"/>
    pattern = r'(<link href="[^"]*style\.css" rel="stylesheet" fetchpriority="high"/?>)'
    m = re.search(pattern, html)
    if m:
        original = m.group(1)
        # Créer le preload avec le même chemin
        preload = original.replace('rel="stylesheet" fetchpriority="high"', 'rel="preload" as="style"')
        new_html = html.replace(original, preload + "\n" + original, 1)
        if new_html != html:
            f.write_text(new_html, encoding="utf-8")
            replaced += 1

print(f"Pages modifiées : {replaced}")
