import os, re

LOCALES = {
    '': 'en_US', 'fr': 'fr_FR', 'es': 'es_ES', 'de': 'de_DE',
    'pt': 'pt_BR', 'ja': 'ja_JP', 'ru': 'ru_RU', 'hi': 'hi_IN'
}

# ─── 1. OG:LOCALE MANQUANT (toutes les pages) ───
def fix_og_locale(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'og:locale' in c:
        return False
    parts = os.path.relpath(path, '.').split(os.sep)
    lang = parts[0] if parts[0] in LOCALES else ''
    locale = LOCALES.get(lang, 'en_US')
    c = c.replace('</head>', f'<meta property="og:locale" content="{locale}" />\n</head>')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    return True

# ─── 2. ADMIN PAGES (meta desc, canonical, og:locale) ───
def fix_admin(path, lang):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    modified = False
    
    if 'name="description"' not in c:
        c = c.replace('</head>', '<meta name="description" content="Admin dashboard for Presend tools." />\n</head>')
        modified = True
    if 'rel="canonical"' not in c:
        url = f"https://presend.pages.dev/{lang}admin" if lang else "https://presend.pages.dev/admin"
        c = c.replace('</head>', f'<link rel="canonical" href="{url}" />\n</head>')
        modified = True
    if 'og:locale' not in c:
        locale = LOCALES.get(lang, 'en_US')
        c = c.replace('</head>', f'<meta property="og:locale" content="{locale}" />\n</head>')
        modified = True
    
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
    return modified

# ─── 3. TITRES & H1 DES GUIDES (traduction statique rapide) ───
GUIDE_TITLES = {
    'how-to-convert-heic-jpg': {
        'fr': "Comment convertir HEIC en JPG sur n'importe quel appareil",
        'es': "Cómo convertir HEIC a JPG en cualquier dispositivo",
        'de': "HEIC in JPG auf jedem Gerät konvertieren",
        'pt': "Como converter HEIC para JPG em qualquer dispositivo",
        'ja': "あらゆるデバイスでHEICをJPGに変換する方法",
        'ru': "Как конвертировать HEIC в JPG на любом устройстве",
        'hi': "किसी भी डिवाइस पर HEIC को JPG में कैसे बदलें"
    },
    'how-to-remove-metadata-before-sharing': {
        'fr': "Comment supprimer les métadonnées avant le partage",
        'es': "Cómo eliminar metadatos antes de compartir",
        'de': "Metadaten vor dem Teilen entfernen",
        'pt': "Como remover metadados antes de compartilhar",
        'ja': "共有前にメタデータを削除する方法",
        'ru': "Как удалить метаданные перед отправкой",
        'hi': "साझा करने से पहले मेटाडेटा कैसे हटाएं"
    },
    'how-to-verify-downloaded-file-safe': {
        'fr': "Comment vérifier qu'un fichier téléchargé est sûr",
        'es': "Cómo verificar que un archivo descargado es seguro",
        'de': "Überprüfen, ob eine heruntergeladene Datei sicher ist",
        'pt': "Como verificar se um arquivo baixado é seguro",
        'ja': "ダウンロードしたファイルが安全かどうか確認する方法",
        'ru': "Как проверить, безопасен ли загруженный файл",
        'hi': "डाउनलोड की गई फ़ाइल सुरक्षित है या नहीं कैसे जांचें"
    },
    'how-to-clean-urls-for-sharing': {
        'fr': "Comment nettoyer les URLs avant de les partager",
        'es': "Cómo limpiar URLs antes de compartirlas",
        'de': "URLs vor dem Teilen bereinigen",
        'pt': "Como limpar URLs antes de compartilhar",
        'ja': "共有前にURLをクリーンアップする方法",
        'ru': "Как очистить URL перед отправкой",
        'hi': "साझा करने से पहले URL कैसे साफ़ करें"
    },
    'how-to-compress-images-email': {
        'fr': "Comment compresser des images pour l'email sans perte de qualité",
        'es': "Cómo comprimir imágenes para email sin perder calidad",
        'de': "Bilder für E-Mails ohne Qualitätsverlust komprimieren",
        'pt': "Como comprimir imagens para email sem perder qualidade",
        'ja': "品質を落とさずにメール用画像を圧縮する方法",
        'ru': "Как сжать изображения для email без потери качества",
        'hi': "गुणवत्ता खोए बिना ईमेल के लिए छवियों को कैसे संपीड़ित करें"
    }
}

def translate_guide(path):
    rel = os.path.relpath(path, '.')
    parts = rel.split(os.sep)
    if len(parts) < 3 or parts[1] != 'guides':
        return False
    lang = parts[0]
    if lang not in GUIDE_TITLES.get(os.path.basename(path).replace('.html',''), {}):
        return False
    
    filename = os.path.basename(path).replace('.html', '')
    new_title = GUIDE_TITLES[filename][lang]
    
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    modified = False
    # Title
    old_title = re.search(r'<title>(.*?)</title>', c, re.I)
    if old_title and ('How to' in old_title.group(1) or 'Presend' in old_title.group(1)):
        c = re.sub(r'<title>.*?</title>', f'<title>{new_title} — Presend</title>', c, flags=re.I)
        modified = True
    # H1 (garde les attributs de balise)
    old_h1 = re.search(r'(<h1[^>]*>)(.*?)(</h1>)', c, re.I|re.DOTALL)
    if old_h1 and ('How to' in old_h1.group(2) or 'Comment' not in old_h1.group(2)):
        c = re.sub(r'(<h1[^>]*>)(.*?)(</h1>)', r'\1'+new_title+r'\3', c, flags=re.I|re.DOTALL, count=1)
        modified = True
    
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
    return modified

# ─── 4. IMAGES SANS WIDTH/HEIGHT ───
def fix_images(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    if '<img' not in c:
        return False
    # Vérifie si AU MOINS une img a width ET height
    has_dims = False
    for img in re.finditer(r'<img[^>]*>', c, re.I):
        tag = img.group(0)
        if 'width=' in tag and 'height=' in tag:
            has_dims = True
            break
    if has_dims:
        return False
    # Ajoute width/height aux images sans (valeurs sûres pour base64 preview)
    c = re.sub(r'<img(?![^>]*width=)([^>]*?)>', r'<img\1 width="600" height="400">', c)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    return True

# ─── EXÉCUTION ───
print("=== 1. OG:LOCALE ===")
count = 0
for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.html') and '.git' not in root and 'venv' not in root:
            if fix_og_locale(os.path.join(root, f)):
                count += 1
print(f"✓ {count} pages corrigées")

print("\n=== 2. ADMIN PAGES ===")
count = 0
for lang in ['', 'fr', 'es', 'de', 'pt', 'ja', 'ru', 'hi']:
    p = os.path.join(lang, 'admin.html') if lang else 'admin.html'
    if os.path.exists(p) and fix_admin(p, lang):
        count += 1
print(f"✓ {count} admin corrigés")

print("\n=== 3. GUIDES TITRES/H1 ===")
count = 0
for lang in ['fr', 'es', 'de', 'pt', 'ja', 'ru', 'hi']:
    d = os.path.join(lang, 'guides')
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith('.html') and translate_guide(os.path.join(d, f)):
                count += 1
print(f"✓ {count} guides traduits")

print("\n=== 4. IMAGES ===")
count = 0
for lang in ['', 'fr', 'es', 'de', 'pt', 'ja', 'ru', 'hi']:
    p = os.path.join(lang, 'tools', 'image-to-base64.html') if lang else os.path.join('tools', 'image-to-base64.html')
    if os.path.exists(p) and fix_images(p):
        count += 1
print(f"✓ {count} pages image corrigées")

print("\n🎉 Corrections profondes appliquées.")
