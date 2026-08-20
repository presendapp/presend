#!/bin/bash
# Auto Discovery Master - Système complet de découverte automatique
# À exécuter via cron toutes les semaines
# crontab -e → 0 2 * * 0 /home/victor-barbier/Bureau/microtools-clean/microtools/auto_discovery_master.sh

set -e

LOG_FILE="/tmp/presend_discovery_$(date +%Y%m%d_%H%M%S).log"
PROJECT_DIR="/home/victor-barbier/Bureau/microtools-clean/microtools"

echo "🤖 Auto Discovery Master - $(date)" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

cd "$PROJECT_DIR"

# 1. Discovery Engine (DNS, SSL, WHOIS, Wayback, W3C)
echo -e "\n📡 Étape 1: Discovery Engine" | tee -a "$LOG_FILE"
python3 discovery_engine.py >> "$LOG_FILE" 2>&1 || true

# 2. Crawler Ping System (Common Crawl, Memento, etc.)
echo -e "\n🕷️  Étape 2: Crawler Ping System" | tee -a "$LOG_FILE"
python3 crawler_ping_system.py >> "$LOG_FILE" 2>&1 || true

# 3. IndexNow Submission (Bing, Yandex, Naver, Seznam)
echo -e "\n📡 Étape 3: IndexNow Submission" | tee -a "$LOG_FILE"
python3 submit_indexnow.py >> "$LOG_FILE" 2>&1 || true

# 4. Ping sitemap (même si déprécié, certains services l'utilisent encore)
echo -e "\n🔔 Étape 4: Ping Sitemap (fallback)" | tee -a "$LOG_FILE"
curl -s "https://www.bing.com/ping?sitemap=https://presend.pages.dev/sitemap.xml" > /dev/null 2>&1 || true
curl -s "https://webmaster.yandex.ru/ping?sitemap=https://presend.pages.dev/sitemap.xml" > /dev/null 2>&1 || true

# 5. Wayback Machine - archive toutes les pages importantes
echo -e "\n📚 Étape 5: Wayback Machine Archiving" | tee -a "$LOG_FILE"
for page in "/" "/tools/exif-remover" "/tools/pdf-compress" "/tools/image-compressor" "/tools/password-generator"; do
    curl -s "https://web.archive.org/save/https://presend.pages.dev${page}" > /dev/null 2>&1 || true
    sleep 5
done

# 6. Générer un rapport
echo -e "\n📊 Étape 6: Rapport" | tee -a "$LOG_FILE"
URL_COUNT=$(grep -c "<loc>" sitemap.xml)
echo "URLs dans le sitemap: $URL_COUNT" | tee -a "$LOG_FILE"
echo "Log complet: $LOG_FILE" | tee -a "$LOG_FILE"

echo -e "\n================================================" | tee -a "$LOG_FILE"
echo "✅ Auto Discovery Master terminé - $(date)" | tee -a "$LOG_FILE"
