import os
import time
from bs4 import BeautifulSoup, NavigableString
from deep_translator import GoogleTranslator

LANGUAGES = {'ru': 'ru', 'hi': 'hi'}

TEXT_TAGS = {'title','h1','h2','h3','h4','h5','h6','p','li','span','strong','em','b','i','a','label','button','figcaption','th','td','option','div','small','dt','dd'}
ATTRS = {'title','alt','placeholder','aria-label'}

def should_translate(text):
    if not text or not text.strip():
        return False
    t = text.strip()
    if len(t) <= 2:
        return False
    if t.startswith(('/', 'http', '#', '.', 'data:', 'javascript:')):
        return False
    if t.replace('.','',1).replace('-','').isdigit():
        return False
    if '<' in t and '>' in t:
        return False
    return True

def translate_element(element, translator):
    for attr in ATTRS:
        if element.get(attr) and should_translate(element[attr]):
            try:
                element[attr] = translator.translate(element[attr])
                time.sleep(0.03)
            except:
                pass
    for child in element.children:
        if isinstance(child, NavigableString):
            txt = str(child)
            if should_translate(txt):
                try:
                    translated = translator.translate(txt)
                    child.replace_with(translated)
                    time.sleep(0.03)
                except:
                    pass
        elif child.name not in ('script','style','code','pre','noscript'):
            translate_element(child, translator)

def translate_file(filepath, target_lang):
    translator = GoogleTranslator(source='en', target=target_lang)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'lxml')
    
    # Meta description
    for meta in soup.find_all('meta'):
        if meta.get('name') == 'description' and meta.get('content'):
            if should_translate(meta['content']):
                try: meta['content'] = translator.translate(meta['content']); time.sleep(0.03)
                except: pass
        if meta.get('property') in ('og:title','og:description','og:site_name') and meta.get('content'):
            if should_translate(meta['content']):
                try: meta['content'] = translator.translate(meta['content']); time.sleep(0.03)
                except: pass
        if meta.get('name') in ('twitter:title','twitter:description') and meta.get('content'):
            if should_translate(meta['content']):
                try: meta['content'] = translator.translate(meta['content']); time.sleep(0.03)
                except: pass
    
    # Title
    if soup.title and soup.title.string:
        try:
            soup.title.string.replace_with(translator.translate(soup.title.string))
            time.sleep(0.03)
        except:
            pass
    
    # Body
    if soup.body:
        translate_element(soup.body, translator)
    
    # html lang
    if soup.html:
        soup.html['lang'] = target_lang
    
    # Supprimer le banner "temporairement en anglais" (plus besoin)
    for div in soup.find_all('div'):
        if div.get('style') and ('temporairement' in str(div) or 'Эта страница' in str(div) or 'यह पेज' in str(div)):
            div.decompose()
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    return True

for lang, code in LANGUAGES.items():
    files = []
    for root, _, filenames in os.walk(lang):
        for filename in filenames:
            if filename.endswith('.html'):
                files.append(os.path.join(root, filename))
    
    print(f"\n🌐 Traduction {lang.upper()} : {len(files)} fichiers...")
    for i, filepath in enumerate(files, 1):
        try:
            translate_file(filepath, code)
            if i % 10 == 0:
                print(f"  {i}/{len(files)} traités...")
        except Exception as e:
            print(f"  ✗ Erreur {filepath}: {e}")
    print(f"✓ {lang.upper()} terminé !")

print("\n🎉 Traductions terminées. Vérifiez un échantillon avant de continuer.")
