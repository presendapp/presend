from pathlib import Path
import re

TOOLS = {
    "admin": ".admin-container",
    "color-contrast": ".color-row",
    "password-strength": ".strength-bar", 
    "text-diff": ".diff-wrap",
    "text-formatter": ".fmt-grid",
    "thread-splitter": ".platform-row",
    "word-counter": ".counter-grid",
}

created = 0
replaced = 0

for css_name, css_class in TOOLS.items():
    en_file = Path(f"tools/{css_name}.html") if css_name != "admin" else Path("admin.html")
    if not en_file.exists():
        en_file = Path(f"{css_name}.html")
    
    if not en_file.exists():
        print(f"SKIP: {css_name} - fichier EN non trouvé")
        continue
    
    html = en_file.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r'<style>(.*?)</style>', html, re.S)
    if not m:
        print(f"SKIP: {css_name} - pas de style inline")
        continue
    
    css_content = m.group(1).strip()
    css_file = Path(f"css/{css_name}.css")
    css_file.write_text(css_content + "\n", encoding="utf-8")
    created += 1
    
    paths = [en_file]
    if css_name == "admin":
        paths += [Path(f"{lang}/admin.html") for lang in ["de","es","fr","hi","ja","pt","ru"]]
    else:
        paths += [Path(f"{lang}/tools/{css_name}.html") for lang in ["de","es","fr","hi","ja","pt","ru"]]
    
    link_tag = f'<link rel="stylesheet" href="/css/{css_name}.css">'
    old_pattern = re.compile(r'<style>' + re.escape(css_content) + r'</style>', re.S)
    
    for f in paths:
        if not f.exists():
            continue
        html = f.read_text(encoding="utf-8", errors="ignore")
        new_html, n = old_pattern.subn(link_tag, html)
        if n > 0:
            f.write_text(new_html, encoding="utf-8")
            replaced += 1

print(f"=== RÉSULTAT ===")
print(f"Fichiers CSS créés : {created}")
print(f"Pages modifiées : {replaced}")
