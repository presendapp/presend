import os, re

# 1. Traduction des meta-descriptions des index
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
    c = re.sub(r'<meta\s+name="description"\s+content="[^"]*"', f'<meta name="description" content="{desc}"', c)
    c = re.sub(r'<meta\s+content="[^"]*"\s+name="description"', f'<meta content="{desc}" name="description"', c)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"✓ Description traduite : {path}")

# 2. Retirer ru et hi de TOUTES les balises hreflang (sécurité 404)
fixed = 0
for root, _, files in os.walk('.'):
    for file in files:
        if not file.endswith('.html') or '.git' in root:
            continue
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        orig = c
        c = re.sub(r'\s*<link[^>]+hreflang=["\']ru["\'][^>]*>\n?', '\n', c)
        c = re.sub(r'\s*<link[^>]+hreflang=["\']hi["\'][^>]*>\n?', '\n', c)
        if c != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c)
            fixed += 1
print(f"✓ ru/hi retirés des hreflang dans {fixed} fichiers")

# 3. Détecter les scripts de génération existants
scripts = [f for f in os.listdir('.') if f.endswith('.py') and 'generate' in f.lower()]
print(f"\n📜 Scripts de génération trouvés : {scripts}")
