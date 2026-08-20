from pathlib import Path

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
        continue
    
    html = en_file.read_text(encoding="utf-8", errors="ignore")
    
    # Trouver le bloc style
    start = html.find("<style>")
    end = html.find("</style>", start)
    if start == -1 or end == -1:
        continue
    
    css_content = html[start+7:end].strip()
    css_file = Path(f"css/{css_name}.css")
    css_file.write_text(css_content + "\n", encoding="utf-8")
    created += 1
    
    # Construire l'ancien et le nouveau bloc
    old_block = "<style>\n" + css_content + "\n</style>"
    link_tag = f'<link rel="stylesheet" href="/css/{css_name}.css">'
    
    paths = [en_file]
    if css_name == "admin":
        paths += [Path(f"{lang}/admin.html") for lang in ["de","es","fr","hi","ja","pt","ru"]]
    else:
        paths += [Path(f"{lang}/tools/{css_name}.html") for lang in ["de","es","fr","hi","ja","pt","ru"]]
    
    for f in paths:
        if not f.exists():
            continue
        html = f.read_text(encoding="utf-8", errors="ignore")
        if old_block in html:
            new_html = html.replace(old_block, link_tag)
            f.write_text(new_html, encoding="utf-8")
            replaced += 1

print(f"=== RÉSULTAT ===")
print(f"Fichiers CSS créés : {created}")
print(f"Pages modifiées : {replaced}")
