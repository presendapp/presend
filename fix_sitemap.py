import os

BASE_URL = "https://presend.pages.dev"
EXCLUDE_DIRS = {'.git','venv','functions','.backup-seo-20260731'}
EXCLUDE_FILES = {'embed.html','admin.html','404.html'}
PRIORITIES = {
    'index.html': 1.0, 'tools/': 0.9, 'guides/': 0.8,
    'about.html': 0.6, 'faq.html': 0.6, 'privacy.html': 0.4,
    'alternatives.html': 0.5,
}

urls = []
for root, dirs, files in os.walk('.', topdown=True):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    for file in files:
        if not file.endswith('.html') or file in EXCLUDE_FILES:
            continue
        path = os.path.join(root, file)
        rel = os.path.relpath(path, '.').replace('\\', '/')
        
        # URL publique
        if rel == 'index.html':
            url_path = ''
        elif rel.endswith('/index.html'):
            url_path = rel[:-10]  # enlève /index.html
        elif rel.endswith('.html'):
            url_path = rel[:-5]   # enlève .html
        else:
            url_path = rel
        
        url = f"{BASE_URL}/{url_path}" if url_path else BASE_URL
        
        priority = 0.7
        for key, val in PRIORITIES.items():
            if key in rel:
                priority = val
                break
        
        urls.append((url, priority))

urls.sort(key=lambda x: -x[1])

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for url, priority in urls:
        f.write(f'  <url>\n')
        f.write(f'    <loc>{url}</loc>\n')
        f.write(f'    <lastmod>2026-08-16</lastmod>\n')
        f.write(f'    <changefreq>weekly</changefreq>\n')
        f.write(f'    <priority>{priority}</priority>\n')
        f.write(f'  </url>\n')
    f.write('</urlset>\n')

print(f"✓ Sitemap corrigé : {len(urls)} URLs")
print("Premières URLs:")
for u, p in urls[:5]:
    print(f"  {u} (prio {p})")
