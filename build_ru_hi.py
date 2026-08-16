import os, re, shutil

LANGUAGES = ['ru', 'hi']
LOCALES = {'ru': 'ru_RU', 'hi': 'hi_IN'}
BANNERS = {
    'ru': '<div style="background:#1a1a2e;color:#ffd700;text-align:center;padding:10px 16px;font-size:14px;border-bottom:1px solid #333;">🌐 Эта страница временно доступна на английском языке. Перевод на русский скоро появится. <a href="/" style="color:#ffd700;text-decoration:underline;">Смотреть на английском</a></div>',
    'hi': '<div style="background:#1a1a2e;color:#ffd700;text-align:center;padding:10px 16px;font-size:14px;border-bottom:1px solid #333;">🌐 यह पेज अभी अंग्रेजी में उपलब्ध है। हिंदी अनुवाद जल्द ही आएगा। <a href="/" style="color:#ffd700;text-decoration:underline;">अंग्रेजी में देखें</a></div>'
}

# 1. Lister les fichiers source (racine, pas les dossiers langue)
source_files = []
for root, dirs, files in os.walk('.', topdown=True):
    dirs[:] = [d for d in dirs if d not in ['fr','es','de','pt','ja','ru','hi','.git','venv','functions'] and not d.startswith('.')]
    for f in files:
        if f.endswith('.html'):
            source_files.append(os.path.relpath(os.path.join(root, f), '.'))

# 2. Copier et adapter pour ru/hi
for lang in LANGUAGES:
    os.makedirs(f"{lang}/tools", exist_ok=True)
    copied = 0
    for src in source_files:
        if src.startswith('guides/') and os.path.exists(f"{lang}/{src}"):
            continue  # préserve les guides déjà traduits
        dst = f"{lang}/{src}"
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        
        with open(dst, 'r', encoding='utf-8') as f:
            c = f.read()
        
        c = c.replace('href="/"', f'href="/{lang}/"')
        c = c.replace('href="/tools/', f'href="/{lang}/tools/')
        c = c.replace('href="/guides/', f'href="/{lang}/guides/')
        c = c.replace('href="/about"', f'href="/{lang}/about"')
        c = c.replace('href="/privacy"', f'href="/{lang}/privacy"')
        c = c.replace('href="/faq"', f'href="/{lang}/faq"')
        c = c.replace('href="/alternatives"', f'href="/{lang}/alternatives"')
        c = c.replace('href="/embed"', f'href="/{lang}/embed"')
        c = c.replace('href="/admin"', f'href="/{lang}/admin"')
        c = c.replace('href="/404"', f'href="/{lang}/404"')
        c = c.replace('<html lang="en"', f'<html lang="{lang}"')
        
        if 'og:locale' in c:
            c = re.sub(r'<meta[^>]+property=["\']og:locale["\'][^>]*>', f'<meta property="og:locale" content="{LOCALES[lang]}" />', c)
        else:
            c = c.replace('</head>', f'<meta property="og:locale" content="{LOCALES[lang]}" />\n</head>')
        
        # Canonical vers la version anglaise
        en_url = 'https://presend.pages.dev/' if src == 'index.html' else f'https://presend.pages.dev/{src.replace(".html", "")}'
        c = re.sub(r'<link[^>]+rel=["\']canonical["\'][^>]*>', f'<link rel="canonical" href="{en_url}" />', c)
        
        if '<body>' in c:
            c = c.replace('<body>', f'<body>\n{BANNERS[lang]}')
        
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(c)
        copied += 1
    print(f"✓ {lang.upper()}: {copied} fichiers créés/adaptés")

# 3. Corriger les hreflang sur TOUTES les pages (self-referencing correct)
ALL_LANGS = ['en','fr','es','de','pt','ja','ru','hi']

def url_for(rel, target_lang):
    if target_lang == 'en':
        if rel == 'index.html':
            return 'https://presend.pages.dev/'
        if rel.startswith(('fr/','es/','de/','pt/','ja/','ru/','hi/')):
            rest = rel[3:]
            return 'https://presend.pages.dev/' if rest == 'index.html' else f'https://presend.pages.dev/{rest.replace(".html","")}'
        return f'https://presend.pages.dev/{rel.replace(".html","")}'
    else:
        if rel == 'index.html':
            return f'https://presend.pages.dev/{target_lang}/'
        if rel.startswith(('fr/','es/','de/','pt/','ja/','ru/','hi/')):
            rest = rel[3:]
            return f'https://presend.pages.dev/{target_lang}/' if rest == 'index.html' else f'https://presend.pages.dev/{target_lang}/{rest.replace(".html","")}'
        return f'https://presend.pages.dev/{target_lang}/{rel.replace(".html","")}'

fixed = 0
for root, dirs, files in os.walk('.', topdown=True):
    dirs[:] = [d for d in dirs if d not in ['.git','venv','functions'] and not d.startswith('.')]
    for file in files:
        if not file.endswith('.html'):
            continue
        path = os.path.join(root, file)
        rel = os.path.relpath(path, '.')
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        orig = c
        
        c = re.sub(r'\s*<link[^>]+rel=["\']alternate["\'][^>]*>\n?', '\n', c)
        lines = [f'<link rel="alternate" hreflang="{l}" href="{url_for(rel, l)}" />' for l in ALL_LANGS]
        lines.append('<link rel="alternate" hreflang="x-default" href="https://presend.pages.dev/" />')
        block = '\n'.join(lines)
        c = c.replace('</head>', f'{block}\n</head>')
        
        if c != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c)
            fixed += 1

print(f"✓ Hreflang corrigés sur {fixed} fichiers (self-referencing + ru + hi)")
