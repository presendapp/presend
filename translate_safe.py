import os, time, re
from bs4 import BeautifulSoup, NavigableString
from deep_translator import GoogleTranslator

def translate_file(path, target):
    translator = GoogleTranslator(source='en', target=target)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Meta description
    for meta in soup.find_all('meta'):
        if meta.get('name') == 'description' and meta.get('content'):
            if len(meta['content']) > 10:
                try:
                    meta['content'] = translator.translate(meta['content'])
                    time.sleep(0.03)
                except: pass
        if meta.get('property') in ('og:title','og:description','og:site_name') and meta.get('content'):
            try:
                meta['content'] = translator.translate(meta['content'])
                time.sleep(0.03)
            except: pass
    
    # Title
    if soup.title and soup.title.string:
        try:
            soup.title.string.replace_with(translator.translate(soup.title.string))
            time.sleep(0.03)
        except: pass
    
    # Body text (uniquement text nodes visibles)
    def translate_node(node):
        for child in node.children:
            if isinstance(child, NavigableString):
                txt = str(child).strip()
                if len(txt) > 2 and not txt.startswith(('/', 'http', '#', '.')) and '<' not in txt:
                    try:
                        translated = translator.translate(str(child))
                        child.replace_with(translated)
                        time.sleep(0.03)
                    except:
                        pass
            elif child.name not in ('script','style','code','pre','noscript'):
                translate_node(child)
    
    if soup.body:
        translate_node(soup.body)
    
    # html lang
    if soup.html:
        soup.html['lang'] = target
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    return True

for lang, code in [('ru','ru'), ('hi','hi')]:
    files = [os.path.join(r, f) for r, _, fs in os.walk(lang) for f in fs if f.endswith('.html')]
    print(f"\n🌐 Traduction {lang.upper()} : {len(files)} fichiers...")
    for i, fp in enumerate(files, 1):
        try:
            translate_file(fp, code)
        except Exception as e:
            print(f"  ✗ {fp}: {e}")
        if i % 10 == 0:
            print(f"  {i}/{len(files)} traités...")
    print(f"✓ {lang.upper()} terminé !")

print("\n🎉 Traductions safe terminées. Vérifiez la mise en page avant de continuer.")
