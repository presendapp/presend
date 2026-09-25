# Architecture Presend

## Vue d'ensemble
Site statique + API serverless sur Cloudflare Pages/Functions (pas de Workers autonomes séparés).

## Source de vérité
**openapi.json** est la source de vérité pour la liste des endpoints. En cas de doute sur le nombre ou la liste exacte, régénérer depuis ce fichier plutôt que de se fier à un chiffre mentionné dans un document :
```bash
python3 -c "import json; d=json.load(open('openapi.json')); print(len(d['paths']))"
```

## Frontend (tools/)
48 outils client-side, HTML/CSS/JS vanilla, rien n'est envoyé à un serveur pour ces outils-là.

## API (functions/api/) — 48 endpoints (vérifié 25 sept. 2026)

### Sécurité & supply-chain
maintainer-change-check (npm uniquement), vulnerability-check (OSV.dev), typosquat-check, supply-chain-check (combine les 3 précédents + repo-health-check), repo-health-check, malware-check (POST), cve-lookup (recherche directe OSV.dev par ID)
Batch : typosquat-check (max 100 noms, npm/PyPI) et maintainer-change-check (max 20, npm) acceptent aussi `POST {"ecosystem": ..., "packages": [...]}`, compté comme une seule requête pour le rate limit (depuis le 25 sept.).

### Web & réseau
security-scan, security-headers, url-reputation, ip-reputation, subdomains, redirect-trace, ai-crawler-check, dns-lookup, whois-lookup, link-metadata (Open Graph/Twitter Card)

### Email & téléphone
email-validate, email-verify, email-disposable, email-security, phone-verify

### Authentification & mots de passe
jwt-decode, jwt-verify (POST), password, password-check (POST), password-breach

### Blockchain (Cosmos SDK / EVM)
address-risk (OFAC, **EVM uniquement**), tx-decode (Cosmos SDK, sans dépendance externe), rpc-check (audit CometBFT)

### Fichiers & images
hash (POST), file-type (POST), clean-image (POST), image-similarity (POST), merge-and-compress-pdf (POST), qr-scan (POST)

### Validation sans dépendance externe
iban-validate (ISO 7064 mod-97), vat-validate (VIES officiel UE)

### Utilitaires divers
uuid, base64, csv-json (GET+POST), timestamp, color, ip, url-clean (GET+POST), user-agent, favicon, text-similarity (POST)

## Endpoints exclus du MCP (7, binaires/fichiers)
hash, clean-image, malware-check, file-type, image-similarity, merge-and-compress-pdf, qr-scan — faire transiter du binaire encodé en base64 dans le contexte d'un agent IA est peu pratique.

## Librairies partagées
- functions/_lib/safe-fetch.js : `validateAndResolve()` — protection SSRF (résolution + validation IP avant fetch, pinning via `cf.resolveOverride`). **Obligatoire** pour tout endpoint qui fetch une URL fournie par l'utilisateur (redirect-trace, link-metadata, security-scan, etc.)
- functions/mcp.js : serveur MCP, généré/maintenu manuellement en miroir de openapi.json (pas de script de génération automatique retrouvé — vérifier avant d'en supposer un)

## SEO
- daily_seo.py, gsc_query.py, gsc_submit.py, indexnow_submit.py, generate-rss.py

## i18n
8 langues : en (racine) + fr, de, es, ja, pt, ru, hi. Les traductions ont un historique de retard par rapport à la version anglaise (~17 sections d'écart signalé une fois) — vérifier avant de supposer une parité totale.

## Distribution externe (voir PROJECT_CONTEXT.md pour les détails)
4 fiches RapidAPI, client npm `presend-api`, serveur MCP au registre officiel, collection Postman synchronisée, page de statut BetterStack.
