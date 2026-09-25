# Architecture Presend

## Vue d'ensemble
Site statique + API serverless sur Cloudflare Pages/Workers.

## Frontend (tools/)
49 outils client-side, HTML/CSS/JS vanilla.

## API (functions/api/)
57 endpoints par domaine :

### Email (4)
email-validate, email-verify, email-disposable, email-security

### Securite (7)
security-scan, security-headers, password-check, password-breach, malware-check, vulnerability-check, cve-lookup

### Blockchain (3)
tx-decode, rpc-check, address-risk

### Reseau (7)
dns-lookup, whois-lookup, ip, ip-reputation, redirect-trace, subdomains

### Donnees (6)
csv-json, base64, hash, uuid, timestamp, file-type

### URL/Web (7)
url-clean, link-metadata, scrape, favicon, og, qr-scan

### Validation (3)
iban-validate, vat-validate, phone-verify

### Divers (20+)
jwt-decode, jwt-verify, color, image-similarity, text-similarity, etc.

## Librairies partagees
- functions/_lib/safe-fetch.js
- functions/_shared/ : perceptual-hash, simhash, disposable-domains, url-reputation-check

## SEO
- daily_seo.py, gsc_query.py, gsc_submit.py, indexnow_submit.py
- sitemap.xml : 162 KB genere automatiquement

## i18n
8 langues : fr, en, de, es, ja, pt, ru, hi
