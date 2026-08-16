import os
import re

LANGUAGES = ['fr', 'es', 'de', 'pt', 'ja']
GUIDES_DIR = 'guides'

# Traductions de base pour les éléments communs des guides (Titres, boutons de retour, etc.)
TRANSLATIONS = {
    'fr': {
        'back': '← Retour aux outils',
        'footer': 'Outils locaux et sécurisés fonctionnant directement dans votre navigateur.'
    },
    'es': {
        'back': '← Volver a las herramientas',
        'footer': 'Herramientas locales y seguras que se ejecutan directamente en su navegador.'
    },
    'de': {
        'back': '← Zurück zu den Werkzeugen',
        'footer': 'Lokale und sichere Werkzeuge, die direkt in Ihrem Browser laufen.'
    },
    'pt': {
        'back': '← Voltar para as ferramentas',
        'footer': 'Ferramentas locais e seguras executadas diretamente no seu navegador.'
    },
    'ja': {
        'back': '← ツールに戻る',
        'footer': 'ブラウザ上で直接動作する、ローカルで安全なツール。'
    }
}

if not os.path.exists(GUIDES_DIR):
    print("Dossier guides/ introuvable !")
    exit(1)

for lang in LANGUAGES:
    lang_guides_dir = os.path.join(lang, 'guides')
    os.makedirs(lang_guides_dir, exist_ok=True)
    
    for filename in os.listdir(GUIDES_DIR):
        if not filename.endswith('.html'):
            continue
            
        src_path = os.path.join(GUIDES_DIR, filename)
        dest_path = os.path.join(lang_guides_dir, filename)
        
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Adapter les liens des outils pour inclure le préfixe de la langue
        # Ex: href='/tools/exif-remover' -> href='/ja/tools/exif-remover'
        content = re.sub(r"href=['\"]/tools/([^'\"]+)['\"]", rf"href='/{lang}/tools/\1'", content)
        
        # Adapter le lien de retour à l'accueil
        content = re.sub(r"href=['\"]/['\"]", rf"href='/{lang}/'", content)
        
        # Écrire le fichier dans le dossier de la langue
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Génération et localisation des guides terminées avec succès !")
