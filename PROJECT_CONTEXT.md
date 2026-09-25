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
- **npm** : client `presend-api` **v1.11.0** (publiée le 25 sept. 2026 ; 1.10.1 et 1.10.2 n'avaient jamais été publiées, seul `package.json` avait changé). 53 fonctions : couvre les 48 endpoints + méthodes batch (`typosquatCheckBatch`, `maintainerChangeCheckBatch`, découpage automatique). Publication = créer une release GitHub `vX.Y.Z` sur `presendapp/presend-api` -> workflow `publish.yml` (tests contre la prod, puis `npm publish --provenance`, attestation Sigstore). Vérifier ensuite via `curl https://registry.npmjs.org/presend-api` (le CLI `npm view` peut rester en retard quelques minutes). GitHub Packages `@presendapp/presend-api` : NON publiée par le workflow, dernière version constatée le 25 sept. : {"message":"You need at least read:packages scope to get a package's versions.","documentation_url":"https://docs.github.com/rest/packages/packages#list-package-versions-for-a-package-owned-by-a-user","status":"403"}inconnu (droit read:packages manquant ?).
- **MCP** : serveur publié au registre officiel MCP sous `io.github.presendapp/presend-mcp`, transport Streamable HTTP sans état, endpoint `/mcp`
- **Postman** : collection publique, ID `57808683-783f3f64-0f9f-433e-95f6-518520d14ccf`, générée depuis openapi.json par `openapi-to-postmanv2` (un dossier par chemin, variable `baseUrl`). Resynchroniser avec `bash scripts/postman-sync.sh` (conversion, diff avec la version en ligne, confirmation, PUT, relecture) ; clé API à générer à chaque usage puis révoquer.
- **Statut public** : BetterStack, page publique `https://presend.betteruptime.com`, 2 moniteurs (site + /api/uuid), vérifiés toutes les 3 min depuis 4 régions

## Leçons importantes déjà apprises (ne pas refaire ces erreurs)
1. **Licence Spamhaus** : les données DROP sont libres d'usage, mais le **nom "Spamhaus" est interdit en matériel marketing/promotionnel** (section 3.2 de leurs conditions). OK dans une réponse API technique ou une FAQ factuelle ; interdit dans un titre SEO, une accroche, ou un message de démarchage. Reformuler en "a curated netblock reputation list" dans ces contextes.
   - Complément (25 sept.) : la correction du 24 sept. avait oublié `openapi-security-only.json` et l'export RapidAPI `presend-openapi.json` (titre "IP reputation check (Spamhaus DROP)"). Vérifier par un scan des champs summary/description/title de TOUS les JSON (repo + rapidapi-exports) plutôt que de se fier à la mémoire. Côté usage des données : téléchargement automatisé au plus 1 fois/heure (1 fois/jour suffit), crédit à The Spamhaus Project + date/copyright avec les données -- `ip-reputation` respecte les deux depuis le 25 sept.
2. **`maintainer-change-check` est actuellement npm-only** -- ne pas prétendre qu'il couvre PyPI ou crates.io (erreur déjà commise une fois, corrigée publiquement ; le 25 sept. elle subsistait encore dans 3 issues -- SkillSpector #602, devguard #3083, typomania #36 -- corrigées. Chercher avec `gh api search/issues -f q='author:presendapp ...'` plutôt que de supposer qu'une correction est complète).
3. **Ne pas proposer les endpoints "wrapper"** (`ip-reputation`, `url-reputation`, `malware-check`) à des outils de sécurité matures — ils intègrent très souvent déjà Spamhaus/URLhaus/MalwareBazaar en direct. Ces trois retours sont arrivés indépendamment (IntelOwl, web-check) : vérifier avant de pitcher, privilégier `maintainer-change-check`/`typosquat-check`/`address-risk`/`tx-decode`/`supply-chain-check` comme vrais différenciateurs.
   - Complément (25 sept., guard-core) : avant de proposer un endpoint qui ne fait que relayer un jeu de données **gratuit et petit** (ex. `ip-reputation` = Spamhaus DROP, ~110 Ko), se demander si la cible ne ferait pas mieux de le charger en local. Pour un middleware appelé à chaque requête, un appel à Presend ajoute latence, point de panne et envoi des IP de visiteurs à un tiers (donnée personnelle). Dans ce cas, le dire franchement et proposer le design natif, quitte à ce que Presend sorte de la boucle.
4. **`address-risk` ne couvre que les adresses EVM (0x...)**, pas Bitcoin ni Cosmos SDK (bech32) — deux fois découvert en pitchant (Bitcoin wallet, dYdX v4). Vérifier l'écosystème cible avant de proposer.
5. **Cloudflare Pages Functions n'a pas de cron trigger natif** (feature Workers uniquement) — pour toute tâche planifiée, chercher une alternative (service tiers, déclenchement manuel) plutôt que de supposer que c'est faisable directement.
6. **Cloudflare Workers/Pages n'expose pas les détails de certificat TLS** (émetteur, expiration) au niveau JS, même via l'API `connect()` — un vérificateur SSL détaillé n'est pas réalisable proprement sur cette stack.
7. **Toujours vérifier les conditions d'usage commercial** avant d'adopter un service tiers gratuit (UptimeRobot restreint son palier gratuit au non-commercial depuis nov. 2024 — BetterStack et StatusCake n'ont pas cette restriction).
8. **Tester un check heuristique sur un lot de paquets populaires SAINS avant de le pitcher ou de l'intégrer** : typosquat-check signalait 12/25 paquets npm très populaires (ms, qs...), maintainer-change-check 17/22 (passations légitimes anciennes). Ni l'un ni l'autre n'avait été testé sur des dépendances réelles. Dans un outil qui scanne un vrai package.json, ce bruit rend le signal inutile. Corrigé le 25 sept. -- garder le jeu de test (25 paquets npm + 10 PyPI légitimes, 18 typosquats, rejeu event-stream au 2018-11-26).
9. **maintainer-change-check ne détecte QUE le schéma event-stream** (nouveau publieur après dormance). Ne jamais citer ua-parser-js (compte légitime piraté) ni colors.js (sabotage par le mainteneur d'origine) comme exemples : même identité de publieur, donc invisibles. L'affirmation inverse figurait dans 11 publications, corrigées le 25 sept.
10. **Toute écriture KV doit être échantillonnée** (modèle : écriture 1 fois sur N avec +N). L'espace `PRESEND_ANALYTICS` est partagé par tous les endpoints (rate limits, stats, copie Spamhaus) et le plan gratuit Cloudflare plafonne KV à 1 000 écritures/jour : un seul endpoint non échantillonné appelé à chaque page vue (`track.js`, corrigé le 25 sept.) peut épuiser le quota et désactiver en silence tous les rate limits. Toute écriture KV doit aussi être dans un try/catch qui ne fait jamais échouer la requête.
   - Limite de l'échantillonnage : il donne la bonne limite EN MOYENNE mais avec une forte variance quand la limite est basse. Sous 10/min avec +5 une fois sur 5, 2 écritures suffisent à bloquer : ~18 % des clients bloqués à tort au 5e appel (constaté le 25 sept. sur les tests du client npm). Pour les appels rares et coûteux (POST batch), compter exactement (+1 à chaque appel) : `checkRateLimit(..., exact = true)` dans typosquat-check et maintainer-change-check.

## Décisions business en attente / prises
- **Pas de palier payant RapidAPI pour l'instant** : décision consciente d'attendre d'avoir de vraies données d'usage avant de introduire du payant, pour rester cohérent avec le positionnement "gratuit" déjà largement communiqué.
- **Pas de gonflement artificiel des étoiles GitHub** : décision de laisser la croissance venir organiquement du travail de fond plutôt que d'acheter/échanger des étoiles.
- Le trafic `uuid` a un profil qui ressemble à du scan/bot automatisé (pics soudains, longs silences) — ne pas sur-interpréter le total cumulé comme de l'adoption organique réelle sans vérifier la répartition par jour.
