import os
import re

LOCALES = {
    'fr': 'fr_FR', 'es': 'es_ES', 'de': 'de_DE',
    'pt': 'pt_BR', 'ja': 'ja_JP', 'ru': 'ru_RU', 'hi': 'hi_IN'
}

def fix_canonical(content, url):
    # Remplace TOUTE balise canonical par la bonne URL propre à la page
    content = re.sub(
        r'<link\s+(?:href=["\'][^"\']*["\']\s+rel=["\']canonical["\']|rel=["\']canonical["\']\s+href=["\'][^"\']*["\'])\s*/?>',
        f'<link rel="canonical" href="{url}" />',
        content
    )
    return content

def add_og_locale(content, locale):
    if 'og:locale' in content:
        content = re.sub(r'<meta[^>]+property=["\']og:locale["\'][^>]*>', 
                         f'<meta property="og:locale" content="{locale}" />', content)
    else:
        content = content.replace('</head>', f'<meta property="og:locale" content="{locale}" />\n</head>')
    return content

def add_hreflang_ru_hi(content):
    if 'hreflang="ru"' in content:
        return content
    # Insère ru et hi juste avant x-default
    content = re.sub(
        r'(\s*)(<link[^>]+hreflang=["\']x-default["\'][^>]*>)',
        r'\1<link rel="alternate" hreflang="ru" href="https://presend.pages.dev/ru/" />\n\1<link rel="alternate" hreflang="hi" href="https://presend.pages.dev/hi/" />\n\1\2',
        content
    )
    return content

# 1. Correction pour les 5 langues complètes
for lang in ['fr', 'es', 'de', 'pt', 'ja']:
    for root, _, files in os.walk(lang):
        for file in files:
            if not file.endswith('.html'):
                continue
            path = os.path.join(root, file)
            rel = os.path.relpath(path, lang)
            url_path = rel.replace('.html', '')
            if url_path.endswith('/index'):
                url_path = url_path[:-6]
            if url_path == 'index':
                url_path = ''
            
            canonical = f"https://presend.pages.dev/{lang}/{url_path}".rstrip('/')
            if canonical == f"https://presend.pages.dev/{lang}":
                canonical += "/"
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            orig = content
            
            content = fix_canonical(content, canonical)
            content = content.replace('href="/guides/', f'href="/{lang}/guides/')
            content = add_og_locale(content, LOCALES[lang])
            content = add_hreflang_ru_hi(content)
            
            if content != orig:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✓ {path}")

# 2. Correction homepage anglaise (ajout ru, hi, og:locale)
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
orig = content
content = add_og_locale(content, 'en_US')
content = add_hreflang_ru_hi(content)
if content != orig:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ index.html")

print("\n🛠️  Corrections appliquées : canonicals, liens guides, og:locale, hreflang ru+hi")
