import os
import re

LANGUAGES = ['fr', 'es', 'de', 'pt', 'ja', 'ru', 'hi']
GUIDES_DIR = 'guides'

TRANSLATIONS = {
    'fr': {'back': '← Retour aux outils'},
    'es': {'back': '← Volver a las herramientas'},
    'de': {'back': '← Zurück zu den Werkzeugen'},
    'pt': {'back': '← Voltar para as ferramentas'},
    'ja': {'back': '← ツールに戻る'},
    'ru': {'back': '← Назад к инструментам'},
    'hi': {'back': '← टूल पर wapas जाएं'}
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
            
        content = re.sub(r"href=['\"]/tools/([^'\"]+)['\"]", rf"href='/{lang}/tools/\1'", content)
        content = re.sub(r"href=['\"]/['\"]", rf"href='/{lang}/'", content)
        
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Génération des guides en hindi terminée avec succès !")
