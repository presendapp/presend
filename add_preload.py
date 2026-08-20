from pathlib import Path

preload_link = '<link rel="preload" href="/style.css" as="style">'
style_link = '<link rel="stylesheet" href="/style.css">'

replaced = 0

for f in sorted(Path(".").rglob("*.html")):
    if ".git" in f.parts: continue
    html = f.read_text(encoding="utf-8", errors="ignore")
    
    # Vérifier si preload déjà présent
    if 'rel="preload"' in html and 'style.css' in html:
        continue
    
    # Vérifier si style.css est présent
    if style_link not in html:
        continue
    
    # Ajouter le preload juste avant le stylesheet
    new_html = html.replace(style_link, preload_link + "\n" + style_link)
    if new_html != html:
        f.write_text(new_html, encoding="utf-8")
        replaced += 1

print(f"Pages modifiées : {replaced}")
