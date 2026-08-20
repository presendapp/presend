#!/bin/bash
# Script maître : déploie et soumet automatiquement aux moteurs

set -e

echo "🚀 Déploiement Presend + Soumission automatique"
echo "================================================"

# 1. Git push
echo "📤 Git push..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || true
git push origin main

# 2. Attendre le déploiement Cloudflare
echo "⏳ Attente déploiement (30s)..."
sleep 30

# 3. Soumission IndexNow
echo "📡 Soumission IndexNow..."
python3 submit_indexnow.py

# 4. Vérification sitemap
echo "🔍 Vérification sitemap..."
curl -s -o /dev/null -w "Sitemap HTTP: %{http_code}\n" https://presend.pages.dev/sitemap.xml

# 5. Ping Google (sitemap)
echo "🔔 Ping Google..."
curl -s "https://www.google.com/ping?sitemap=https://presend.pages.dev/sitemap.xml" > /dev/null && echo "✅ Google pingé" || echo "⚠️ Échec ping Google"

# 6. Ping Bing (sitemap)
echo "🔔 Ping Bing..."
curl -s "https://www.bing.com/ping?sitemap=https://presend.pages.dev/sitemap.xml" > /dev/null && echo "✅ Bing pingé" || echo "⚠️ Échec ping Bing"

echo "================================================"
echo "✅ Déploiement et soumission terminés !"
