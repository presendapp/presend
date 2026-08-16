import os, re
from collections import defaultdict

issues = []
titles = defaultdict(list)
h1s = defaultdict(list)

def audit_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    rel = os.path.relpath(path, '.')
    
    # Title
    t = re.search(r'<title>(.*?)</title>', c, re.I)
    if not t:
        issues.append(f"{rel}: ❌ PAS DE <title>")
    else:
        titles[t.group(1)].append(rel)
    
    # Meta description
    if not re.search(r'<meta[^>]+name=["\']description["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE meta description")
    
    # Canonical
    if not re.search(r'<link[^>]+rel=["\']canonical["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE canonical")
    
    # og:locale
    if not re.search(r'<meta[^>]+property=["\']og:locale["\']', c, re.I):
        issues.append(f"{rel}: ❌ PAS DE og:locale")
    
    # H1
    h = re.search(r'<h1[^>]*>(.*?)</h1>', c, re.I|re.DOTALL)
    if not h:
        issues.append(f"{rel}: ❌ PAS DE <h1>")
    else:
        h1s[h.group(1).strip()].append(rel)
    
    # Images sans alt
    for img in re.finditer(r'<img[^>]*>', c, re.I):
        tag = img.group(0)
        if 'alt=' not in tag:
            issues.append(f"{rel}: ⚠️ Image sans alt")
            break
    
    # Images sans width/height
    for img in re.finditer(r'<img[^>]*>', c, re.I):
        tag = img.group(0)
        if 'width=' not in tag or 'height=' not in tag:
            issues.append(f"{rel}: ⚠️ Image sans width/height")
            break

# Audit tous les HTML
for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.html') and '.git' not in root and 'venv' not in root:
            audit_file(os.path.join(root, f))

print("=== PAGES AVEC PROBLÈMES CRITIQUES ===")
if issues:
    for i in issues[:50]:
        print(i)
    if len(issues) > 50:
        print(f"... et {len(issues)-50} autres problèmes")
else:
    print("✅ Aucun problème critique détecté")

print(f"\n=== TITRES DUPLIQUÉS ===")
dup_titles = {k:v for k,v in titles.items() if len(v) > 1}
if dup_titles:
    for t, files in list(dup_titles.items())[:10]:
        print(f"'{t[:60]}...' → {len(files)} pages")
else:
    print("✅ Tous les titres sont uniques")

print(f"\n=== H1 DUPLIQUÉS ===")
dup_h1 = {k:v for k,v in h1s.items() if len(v) > 1}
if dup_h1:
    for h, files in list(dup_h1.items())[:10]:
        print(f"'{h[:60]}...' → {len(files)} pages")
else:
    print("✅ Tous les H1 sont uniques")

print(f"\n=== RÉCAPITULATIF ===")
print(f"Pages auditées: {len(titles)}")
print(f"Problèmes: {len(issues)}")
print(f"Titres dupliqués: {sum(len(v) for v in dup_titles.values())}")
print(f"H1 dupliqués: {sum(len(v) for v in dup_h1.values())}")
