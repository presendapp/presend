import os, re

# ─── 1. CANONICALS + OG:LOCALE MANQUANTS SUR RU/HI INDEX ───
LOCALES = {'ru': 'ru_RU', 'hi': 'hi_IN'}
URLS = {'ru': 'https://presend.pages.dev/ru/', 'hi': 'https://presend.pages.dev/hi/'}

for lang in ['ru', 'hi']:
    path = f"{lang}/index.html"
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Canonical
    if 'rel="canonical"' not in c:
        c = c.replace('</head>', f'<link rel="canonical" href="{URLS[lang]}" />\n</head>')
        print(f"✓ Canonical ajouté : {lang}/index.html")
    else:
        print(f"  Canonical déjà présent : {lang}/index.html")
    
    # og:locale
    if 'og:locale' not in c:
        c = c.replace('</head>', f'<meta property="og:locale" content="{LOCALES[lang]}" />\n</head>')
        print(f"✓ og:locale ajouté : {lang}/index.html")
    else:
        print(f"  og:locale déjà présent : {lang}/index.html")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

# ─── 2. META DESCRIPTIONS EN ANGLAIS SUR INDEX FR/ES/DE/PT/JA ───
DESC = {
    'fr': "Outils gratuits dans le navigateur pour nettoyer, compresser, convertir et vérifier vos fichiers avant le partage. Rien n'est jamais téléchargé — tout s'exécute sur votre appareil.",
    'es': "Herramientas gratuitas basadas en el navegador para limpiar, comprimir, convertir y verificar sus archivos antes de compartirlos. Nunca se sube nada — todo se ejecuta en su dispositivo.",
    'de': "Kostenlose browserbasierte Tools zum Bereinigen, Komprimieren, Konvertieren und Überprüfen Ihrer Dateien vor dem Teilen. Nichts wird jemals hochgeladen — alles läuft auf Ihrem Gerät.",
    'pt': "Ferramentas gratuitas baseadas no navegador para limpar, compactar, converter e verificar seus arquivos antes de compartilhar. Nada é enviado — tudo é executado no seu dispositivo.",
    'ja': "ブラウザベースの無料ツールで、共有前にファイルをクリーンアップ、圧縮、変換、確認できます。アップロードは一切なし — すべてお使いのデバイス上で実行されます。"
}

for lang, desc in DESC.items():
    path = f"{lang}/index.html"
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Deux formats possibles
    old1 = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', c)
    old2 = re.search(r'<meta\s+content="([^"]*)"\s+name="description"', c)
    
    if old1 and 'Free browser-based tools' in old1.group(1):
        c = re.sub(r'<meta\s+name="description"\s+content="[^"]*"', f'<meta name="description" content="{desc}"', c)
        print(f"✓ Meta description traduite : {lang}/index.html")
    elif old2 and 'Free browser-based tools' in old2.group(1):
        c = re.sub(r'<meta\s+content="[^"]*"\s+name="description"', f'<meta content="{desc}" name="description"', c)
        print(f"✓ Meta description traduite : {lang}/index.html")
    else:
        print(f"  Meta description OK ou déjà traduite : {lang}/index.html")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

# ─── 3. VÉRIFICATION HREFLANG SELF-REFERENCING (format exact) ───
print("\n=== VÉRIFICATION HREFLANG ===")
for f in ['index.html', 'fr/index.html', 'ru/index.html', 'hi/index.html']:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    # Cherche le self-reference (peut être hreflang avant href ou l'inverse)
    self = 0
    for line in content.split('\n'):
        if 'hreflang=' in line and 'href=' in line:
            # Extrait l'URL du hreflang
            m = re.search(r'href="([^"]*)"', line)
            if m and f in m.group(1):
                self += 1
    total = content.count('hreflang=')
    print(f"{f}: {total} hreflang | self-referencing détectés: {self}")

print("\n🎉 Corrections appliquées.")
