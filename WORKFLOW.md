# Démarrage de session Presend

## Fichiers à lire, dans l'ordre
1. PROJECT_CONTEXT.md — identité, chiffres clés, leçons apprises, décisions business
2. STRUCTURE.md — architecture technique, liste des endpoints
3. ROADMAP.md — état réel des choses en cours (conversations actives, démarchage, divulgations)
4. Ce fichier (WORKFLOW.md)

## En tout début de session (avant toute chose)
Lancer `bash scripts/session-check.sh` -- une seule commande qui vérifie en un coup les chiffres clés (endpoints, outils, MCP) ET la liste à jour des cibles de démarchage avec leurs commentaires. Ne jamais re-démarcher une cible déjà présente dans cette liste. Si une cible affiche des commentaires non encore traités dans ROADMAP.md, les lire et y répondre avant de commencer une nouvelle tâche.

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

## En fin de session (avant de clore la conversation)
Sans cette étape, les fichiers de contexte se dégradent vite (exactement le problème corrigé le 25 sept. -- documentation qui ne reflétait plus la réalité du projet). Avant de terminer :
1. Mettre à jour **ROADMAP.md** : déplacer ce qui a été fait aujourd'hui vers "Fait récemment", ajouter toute nouvelle conversation GitHub active, retirer ce qui est résolu/périmé.
   - Mettre à jour les compteurs de référence dans **scripts/watch.txt** : nouvelles conversations actives (y compris les PR d'autres auteurs qui nous concernent), conversations closes retirées.
2. Si de nouveaux chiffres clés ont changé (endpoints, outils, langues...) : mettre à jour **PROJECT_CONTEXT.md** et/ou **STRUCTURE.md**, en les régénérant depuis la source de vérité (openapi.json, etc.) plutôt qu'en devinant.
3. Si une nouvelle divulgation de sécurité a été envoyée, ou qu'une existante a eu une réponse : mettre à jour **SECURITY_DISCLOSURES.md**.
4. Si une nouvelle leçon a été apprise (erreur trouvée et corrigée, limite technique découverte) : l'ajouter à la section correspondante de **PROJECT_CONTEXT.md**, pour ne pas la refaire plus tard.
5. Committer et pousser ces fichiers, puis vérifier avec `gh api "repos/presendapp/presend/contents/<fichier>" --jq '.sha'` comparé à `git rev-parse HEAD:<fichier>` que c'est bien en ligne avant de considérer la session terminée.

## Commandes utiles
- Dev local : `npx --yes wrangler pages dev . --port 8788` -- la 1re fois npx télécharge wrangler : attendre que le port réponde (boucle curl) plutôt qu'un `sleep` fixe
- Déploiement : automatique via git push sur main (Cloudflare Pages)
- Tests : `./tests/run-tests.sh` (existe, jamais utilisé pendant cette session — vérifier son contenu avant de s'y fier)
- SEO : `python3 daily_seo.py`
- Tests typosquat-check (obligatoires après toute modification de `POPULAR` ou `KNOWN_LEGIT`) : `node tests/typosquat/run.mjs && node tests/typosquat/top-pypi.mjs && node tests/typosquat/top-npm.mjs`
- Test maintainer-change-check (après toute modification de sa logique) : `node tests/maintainer-change/top-npm.mjs 200` (~3 min, respecte la limite de l'API de recherche npm ; doit afficher event-stream DETECTE)

## Pièges rencontrés
- **bash et `!`** : un `!` entre guillemets doubles déclenche l'expansion d'historique ("event not found", ou texte remplacé en silence, par ex. un `!s` de f-string Python devenu `grep`). Passer le code Python/JS par un heredoc entre apostrophes (`python3 - <<'EOF'`), jamais par `-c "..."`.
- **Modifier openapi.json** : ne pas le réécrire avec `json.dump` (reformate des centaines de lignes). Faire des remplacements textuels ciblés, puis valider avec `json.loads` et vérifier que `git diff --stat` ne montre que les lignes attendues.
- **Appels à la prod depuis Python** : `urllib` sans `User-Agent` explicite reçoit un 403 Cloudflare (leçon n°12).
- Lint OpenAPI : `npx --yes @redocly/cli lint openapi.json --max-problems 2000` -- **0 erreur attendue** depuis le 25 sept. (`"security": []` déclaré à la racine, exemples corrigés). Avertissements restants connus : `operation-operationId` et `operation-4xx-response` (dette de doc). Tout AUTRE avertissement ou erreur vient d'une modification récente.
