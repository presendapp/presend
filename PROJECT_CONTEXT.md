# Presend — Contexte Projet

## Identité et confidentialité (règle absolue)
- Utilisateur : Victor Barbier, opère **uniquement** sous les pseudonymes "Presendapp" ou "Presend" dans toute communication externe (issues GitHub, emails, commentaires publics, réseaux sociaux). **Jamais** son nom réel.
- Compte GitHub : `presendapp`
- Email de contact : `presendapp@gmail.com`
- Toujours divulguer l'affiliation dès la première ligne d'un message de démarchage/contribution ("Disclosure: I'm the developer of Presend...").

## Mission
Presend propose des micro-outils IT gratuits, respectueux de la vie privée, sans inscription : à la fois des outils navigateur (rien n'est jamais envoyé à un serveur) et une API REST server-side gratuite.

## Les trois volets du projet
1. **Produit** : le site + l'API + les outils navigateur (voir STRUCTURE.md).
2. **Distribution** : campagne de démarchage GitHub ciblé (voir ROADMAP.md pour l'état exact), soumissions RapidAPI/npm/Postman/MCP registry, annuaires "awesome-*".
3. **Recherche de sécurité / bug bounty** (volet séparé mais mené par la même personne) : divulgations responsables sur des projets tiers (RunOnFlux, GitLab, Vercel, Cosmos SDK/Immunefi...). Voir ROADMAP.md pour l'état des divulgations en cours.

## Chiffres clés (vérifiés le 25 septembre 2026 — toujours revérifier avant de les citer, ce projet a un historique de compteurs qui deviennent obsolètes)
- **48 endpoints API** (functions/api/, voir openapi.json — source de vérité)
- **48 outils navigateur** (tools/*.html)
- **41 outils exposés côté MCP** (functions/mcp.js) — les 7 endpoints binaires/fichiers sont volontairement exclus (hash, clean-image, malware-check, file-type, image-similarity, merge-and-compress-pdf, qr-scan)
- **8 langues** : en (racine) + fr, de, es, ja, pt, ru, hi

## Stack technique
- Frontend : HTML/CSS/JS statique, Cloudflare Pages
- Backend : Cloudflare Pages Functions (functions/api/*.js) — **pas** de Workers autonomes, donc pas de cron triggers natifs disponibles
- API : OpenAPI 3.0 (openapi.json = source de vérité, tout le reste doit être régénéré/vérifié depuis ce fichier)
- Analytics/rate-limit : Cloudflare KV (env.PRESEND_ANALYTICS)
- SEO : scripts Python (daily_seo.py, gsc_*.py, generate-rss.py)

## Distribution externe active (comptes/identifiants)
- **RapidAPI** : 4 fiches distinctes — "Presend API" (Cybersecurity, 24 endpoints sécurité), "Presend Blockchain & Crypto Compliance API" (Finance, 3 endpoints), "Presend Email & Phone Verification API" (Email, 5 endpoints), "Presend Developer Tools API" (Tools, 13 endpoints). Host format : `<nom-fiche>.p.rapidapi.com`.
- **npm** : client `presend-api` (v1.10.2+), aussi publié sur GitHub Packages sous `@presendapp/presend-api`
- **MCP** : serveur publié au registre officiel MCP sous `io.github.presendapp/presend-mcp`, transport Streamable HTTP sans état, endpoint `/mcp`
- **Postman** : collection publique, ID `57808683-783f3f64-0f9f-433e-95f6-518520d14ccf`, synchronisable via l'API Postman (`PUT https://api.getpostman.com/collections/{id}`, clé API à générer à chaque usage puis révoquer)
- **Statut public** : BetterStack, page publique `https://presend.betteruptime.com`, 2 moniteurs (site + /api/uuid), vérifiés toutes les 3 min depuis 4 régions

## Leçons importantes déjà apprises (ne pas refaire ces erreurs)
1. **Licence Spamhaus** : les données DROP sont libres d'usage, mais le **nom "Spamhaus" est interdit en matériel marketing/promotionnel** (section 3.2 de leurs conditions). OK dans une réponse API technique ou une FAQ factuelle ; interdit dans un titre SEO, une accroche, ou un message de démarchage. Reformuler en "a curated netblock reputation list" dans ces contextes.
2. **`maintainer-change-check` est actuellement npm-only** — ne pas prétendre qu'il couvre PyPI ou crates.io (erreur déjà commise une fois, corrigée publiquement).
3. **Ne pas proposer les endpoints "wrapper"** (`ip-reputation`, `url-reputation`, `malware-check`) à des outils de sécurité matures — ils intègrent très souvent déjà Spamhaus/URLhaus/MalwareBazaar en direct. Ces trois retours sont arrivés indépendamment (IntelOwl, web-check) : vérifier avant de pitcher, privilégier `maintainer-change-check`/`typosquat-check`/`address-risk`/`tx-decode`/`supply-chain-check` comme vrais différenciateurs.
4. **`address-risk` ne couvre que les adresses EVM (0x...)**, pas Bitcoin ni Cosmos SDK (bech32) — deux fois découvert en pitchant (Bitcoin wallet, dYdX v4). Vérifier l'écosystème cible avant de proposer.
5. **Cloudflare Pages Functions n'a pas de cron trigger natif** (feature Workers uniquement) — pour toute tâche planifiée, chercher une alternative (service tiers, déclenchement manuel) plutôt que de supposer que c'est faisable directement.
6. **Cloudflare Workers/Pages n'expose pas les détails de certificat TLS** (émetteur, expiration) au niveau JS, même via l'API `connect()` — un vérificateur SSL détaillé n'est pas réalisable proprement sur cette stack.
7. **Toujours vérifier les conditions d'usage commercial** avant d'adopter un service tiers gratuit (UptimeRobot restreint son palier gratuit au non-commercial depuis nov. 2024 — BetterStack et StatusCake n'ont pas cette restriction).

## Décisions business en attente / prises
- **Pas de palier payant RapidAPI pour l'instant** : décision consciente d'attendre d'avoir de vraies données d'usage avant de introduire du payant, pour rester cohérent avec le positionnement "gratuit" déjà largement communiqué.
- **Pas de gonflement artificiel des étoiles GitHub** : décision de laisser la croissance venir organiquement du travail de fond plutôt que d'acheter/échanger des étoiles.
- Le trafic `uuid` a un profil qui ressemble à du scan/bot automatisé (pics soudains, longs silences) — ne pas sur-interpréter le total cumulé comme de l'adoption organique réelle sans vérifier la répartition par jour.
