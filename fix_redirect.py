import os, re

# Mise à jour du script de redirection dans index.html pour inclure ru et hi
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

old = "var supported = ['fr', 'es', 'de', 'pt', 'ja'];"
new = "var supported = ['fr', 'es', 'de', 'pt', 'ja', 'ru', 'hi'];"

if old in c:
    c = c.replace(old, new)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print("✓ Redirection mise à jour : ru + hi ajoutés")
else:
    print("⚠️ Pattern non trouvé, vérifiez manuellement")

# Propager à toutes les pages racine (about, faq, privacy, alternatives)
for file in ['about.html','faq.html','privacy.html','alternatives.html','404.html']:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            c = f.read()
        if old in c:
            c = c.replace(old, new)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(c)
            print(f"✓ {file} mis à jour")
