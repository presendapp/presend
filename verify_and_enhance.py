import os, re
from collections import defaultdict

issues = []
titles = defaultdict(list)
h1s = defaultdict(list)

def audit_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    rel = os.path.relpath(path, '.')
    
    t = re.search(r'<title>(.*?)</title>', c, re.I)
    if t: titles[t.group(1)].append(rel)
    else: issues.append(f"{rel}: ❌ PAS DE <title>")
    
    if not re.search(r'<meta[^>]+name=["\']description["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE meta description")
    if not re.search(r'<link[^>]+rel=["\']canonical["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE canonical")
    if not re.search(r'<meta[^>]+property=["\']og:locale["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE og:locale")
    
    h = re.search(r'<h1[^>]*>(.*?)</h1>', c, re.I|re.DOTALL)
    if h: h1s[h.group(1).strip()].append(rel)
    else: issues.append(f"{rel}: ❌ PAS DE <h1>")
    
    # Open Graph manquants
    if 'property="og:title"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE og:title")
    if 'property="og:description"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE og:description")
    if 'property="og:url"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE og:url")
    if 'property="og:image"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE og:image")
    if 'property="og:type"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE og:type")
    
    # Twitter Cards
    if 'name="twitter:card"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE twitter:card")
    if 'name="twitter:title"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE twitter:title")
    if 'name="twitter:description"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE twitter:description")
    
    # Schema.org
    if '"@type"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE Schema.org JSON-LD")
    
    # Meta robots
    if 'name="robots"' not in c:
        issues.append(f"{rel}: ⚠️ PAS DE meta robots")

# Audit
for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.html') and '.git' not in root and 'venv' not in root:
            audit_file(os.path.join(root, f))

print("=== PROBLÈMES CRITIQUES RESTANTS ===")
critiques = [i for i in issues if i.startswith('❌')]
if critiques:
    for i in critiques[:30]:
        print(i)
    if len(critiques) > 30:
        print(f"... et {len(critiques)-30} autres")
else:
    print("✅ Aucun problème critique !")

print(f"\n=== AMÉLIORATIONS POSSIBLES (non critiques) ===")
ameliorations = [i for i in issues if i.startswith('⚠️')]
if ameliorations:
    # Grouper par type
    types = defaultdict(int)
    for a in ameliorations:
        types[a.split(':')[1].strip()] += 1
    for t, count in sorted(types.items(), key=lambda x: -x[1]):
        print(f"{count:4d} × {t}")
else:
    print("✅ Tout est parfait !")

print(f"\n=== TITRES DUPLIQUÉS RESTANTS ===")
dup = {k:v for k,v in titles.items() if len(v) > 1}
if dup:
    for t, files in list(dup.items())[:8]:
        print(f"'{t[:50]}...' → {len(files)} pages")
else:
    print("✅ Tous uniques")

print(f"\n=== H1 DUPLIQUÉS RESTANTS ===")
duph = {k:v for k,v in h1s.items() if len(v) > 1}
if duph:
    for h, files in list(duph.items())[:8]:
        print(f"'{h[:50]}...' → {len(files)} pages")
else:
    print("✅ Tous uniques")

print(f"\n=== RÉCAP ===")
print(f"Pages: {len(titles)} | Critiques: {len(critiques)} | Améliorations: {len(ameliorations)}")
