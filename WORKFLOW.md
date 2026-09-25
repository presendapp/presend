# Démarrage de session Presend

## Fichiers à lire, dans l'ordre
1. PROJECT_CONTEXT.md — identité, chiffres clés, leçons apprises, décisions business
2. STRUCTURE.md — architecture technique, liste des endpoints
3. ROADMAP.md — état réel des choses en cours (conversations actives, démarchage, divulgations)
4. Ce fichier (WORKFLOW.md)

## Avant de commencer une tâche
- Les chiffres (nombre d'endpoints, d'outils, etc.) peuvent devenir obsolètes vite sur ce projet — en cas de doute, régénérer depuis openapi.json plutôt que de faire confiance à un document.
- Vérifier ROADMAP.md pour ne pas re-proposer quelque chose déjà en cours ailleurs (ex : ne pas re-contacter une cible de démarchage déjà traitée).
- Si la tâche touche à un nouvel endpoint faisant un fetch d'URL fournie par l'utilisateur : utiliser `validateAndResolve()` de `functions/_lib/safe-fetch.js` (protection SSRF), pas un `fetch()` nu.

## Workflow type pour un nouvel endpoint
1. Regarder un endpoint existant similaire dans functions/api/ comme modèle (rate limit, tracking, CORS, format de réponse)
2. Écrire le nouvel endpoint
3. Tester en local : `npx wrangler pages dev . --port 8788` puis `curl localhost:8788/api/...`
4. Vérifier la syntaxe : `node -c functions/api/nom.js`
5. Commit + push
6. Attendre ~30-40s le déploiement, tester en production
7. Ajouter la définition à openapi.json (vérifier avec `npx @redocly/cli lint openapi.json`)
8. Ajouter comme outil MCP dans functions/mcp.js si pertinent (pas binaire/fichier)
9. Mettre à jour les compteurs partout où ils apparaissent (site, README, profil GitHub) — chercher avec grep plutôt que de deviner où

## Workflow type pour du démarchage GitHub
1. `gh api "search/code?q=<TERME>+in:file"` pour trouver des candidats
2. Vérifier étoiles/activité/pertinence avant de contacter (`gh api "repos/<owner>/<repo>"`)
3. Vérifier l'usage exact du terme recherché dans le repo cible avant de rédiger (`gh api "search/code?q=<TERME>+repo:<owner>/<repo>"`)
4. Toujours divulguer l'affiliation en premier, ne jamais deviner le code sans voir l'interface réelle du projet cible
5. `gh issue create` avec le message rédigé

## Commandes utiles
- Dev local : `npx --yes wrangler pages dev . --port 8788`
- Déploiement : automatique via git push sur main (Cloudflare Pages)
- Tests : `./tests/run-tests.sh` (existe, jamais utilisé pendant cette session — vérifier son contenu avant de s'y fier)
- SEO : `python3 daily_seo.py`
- Lint OpenAPI : `npx --yes @redocly/cli lint openapi.json`
