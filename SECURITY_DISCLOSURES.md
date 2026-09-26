# Journal des divulgations de sécurité (volet recherche, séparé du produit Presend)

Contexte : recherche de vulnérabilités menée sous les pseudonymes Presendapp/Presend, motif récurrent : vérifier la fraîcheur d'un projet → lire le code → distinguer gap de test (PR publique) vs vraie vulnérabilité (divulgation privée proportionnée à la gravité).

## Divulgations privées en attente de réponse

### RunOnFlux/flux — finding #1 : TOCTOU
- Fichier : `requestWithValidatedRedirects` (côté validation de redirections)
- Faille : fenêtre TOCTOU entre validation et connexion effective
- Canal : email chiffré PGP à security@runonflux.io (clé F324 4FFC 7207 DB2C AA35 5DF5 0613 9DA3 A0B1 3EC1), programme de récompenses jusqu'à 10 000 FLUX
- Statut : envoyé, SLA 24h annoncé mais dépassé, relance non chiffrée envoyée

### RunOnFlux/flux — finding #2 : SSRF via repotag
- Fichier : `ImageVerifier`
- Faille : SSRF direct via le paramètre repotag, plus grave que #1
- Canal : même destinataire, email PGP
- Statut : envoyé, sans réponse confirmée

### RunOnFlux/flux — finding #3 : sessions n'expirant jamais
- Fichiers : `ZelBack/src/services/verificationHelperUtils.js`, `idService.js`
- Faille : `idService.js` calcule et stocke `expireAt` (14 jours ; 2h pour app-owner) à la création de session dans `loggedUsers`, mais aucune fonction de vérification (`verifyUserSession`, `verifyFluxTeamSession`, `verifyNodeOperatorOrFluxTeamSession`, `verifyAppOwnerSession`) ne relit ce champ. Pas d'index TTL MongoDB sur `loggedUsers` contrairement aux autres collections sensibles.
- Impact : un token `zelidauth` volé reste valide indéfiniment, y compris pour les endpoints admin (`NODE_OPERATOR_OR_FLUX_TEAM`)
- Canal : même destinataire, email PGP
- Statut : envoyé, sans réponse confirmée

### qrypt.chat — webhook dispatcher jamais revalidé
- Faille : persistante, pas de fenêtre temporelle (pas un TOCTOU classique)
- Canal : email standard security@qrypt.chat
- Statut : envoyé, sans réponse confirmée

### GitLab Runner (gitlab-org/gitlab-runner) — regex non ancrée
- Fichier : `executors/kubernetes/overwrites.go`, fonction `overwriteRegexCheck`
- Faille : utilise `regexp.MatchString()` (substring match) au lieu d'un ancrage `^...$`. La doc officielle recommande elle-même l'exemple non ancré `namespace_overwrite_allowed = "ci-.*"`, permettant à un job CI de définir `KUBERNETES_NAMESPACE_OVERWRITE=kube-systemci-x` et de passer la validation
- Impact : évasion de namespace Kubernetes sur cluster partagé
- Canal : issue confidentielle GitLab (ticket MIN-916), security@gitlab.com fermé
- Confirmé éligible bounty (scope HackerOne de GitLab)
- Statut : posté, sans réponse confirmée

### Next.js (vercel/next.js) — SSRF via DNS rebinding
- Fichier : `packages/next/src/server/image-optimizer.ts`, fonction `fetchExternalImage`
- Faille : `isPrivateIp()` valide les IPs résolues via `lookup()`, mais `fetch(href)` refait sa propre résolution DNS indépendante (pas de pinning de connexion) → fenêtre TOCTOU exploitable par DNS rebinding (TTL court)
- Canal : email à responsible.disclosure@vercel.com (VDP, pas de bounty financier — HackerOne Vercel exige un PoC actif fonctionnel que Claude ne peut pas construire)
- Statut : envoyé, sans réponse confirmée

### HenriGrimm/Minnow — vulnérabilité webhook
- Faille (reconstituée le 26 sept. : le détail d'origine n'avait jamais été consigné) : fenêtre de DNS rebinding dans `server/webhooks/emit.js` (`postWebhook`). `validateWebhookUrl()` (`server/webhooks/ssrf.js`) résout et valide les IP, puis renvoie l'URL d'origine ; `http(s).request` refait sa propre résolution DNS. Code inchangé depuis le 27 juillet.
- Gravité revue à **faible** (et non modérée) : création d'abonnement protégée par le jeton par démarrage (`server/runtime/auth-middleware.js`, depuis le 6 juillet, + validation `Host`), URL choisie par l'utilisateur, HTTPS seul vers l'extérieur (la vérification TLS échoue avant tout envoi vers un service interne), pas de redirections suivies. Reste une sonde de joignabilité via le journal des livraisons. Piste CSRF vérifiée et écartée (jeton exigé, même si `readJsonBody` ignore le Content-Type).
- Correctif suggéré : option `lookup` personnalisée sur `http(s).request` qui valide chaque IP résolue avec `isPrivateIpAddress()`, sans nouvelle dépendance. Rapport prêt : `archive/minnow_discord_2026-09-26.md`. Clone lecture seule : `github-contributions/minnow`.
- Canal : issue GitHub publique #1222 demandant un contact privé
- Statut : le 26 sept., Henri a demandé un contact sur Discord (@Henri_Grimm). Pas de compte Discord de notre côté : réponse sur l'issue (https://github.com/HenriGrimm/Minnow/issues/1222#issuecomment-5844462026) proposant d'activer le signalement privé GitHub (désactivé au 26 sept.), un email, ou une publication directe dans l'issue vu la faible gravité. En attente de son choix, rien de technique publié.
- Leçon : consigner le détail technique de chaque finding (fichier, lignes, raisonnement, gravité) dans un fichier non public au moment de l'envoi. Sans ça, il a fallu tout reconstituer neuf jours plus tard, et la gravité notée s'est révélée surévaluée.

## Contributions de code réelles (pas des divulgations privées)

### Countly/countly-server — PR #8041
- 3 tests manquants ajoutés (NAT64 standard, IPv4 mappé décimal/hex), 17/17 tests exécutés avec succès
- Statut : ouverte, en attente de review mainteneur

### unjs/ipx — PR #336
- Épinglage de connexion via undici pour fermer le TOCTOU dans `blockPrivateIPs`
- Fix additionnel suite à review CodeRabbit : les 2 fallbacks de `getPinnedFetch()` retombaient silencieusement sur fetch non épinglée si `node:dns`/`undici` indisponibles → lèvent maintenant `IPX_IP_CHECK_UNAVAILABLE` (fail-closed)
- Statut : **fermée sans merge le 25 sept. par le mainteneur (pi0x)**. Le TOCTOU est reconnu et reproduit, mais jugé acceptable : `blockPrivateIPs` est opt-in (l'allowlist `domains` est le contrôle principal), impact limité à du SSRF aveugle (GET/HEAD). Ils documenteront la limite (proxy de sortie recommandé). Objections au correctif : dépendance runtime `undici` pour tous (deps limitées à `sharp`/`srvx`) + hausse du minimum Node ; erreur brute `fetch failed` (500) au lieu de `403 IPX_FORBIDDEN_IP` ; no-op silencieux sur les runtimes qui ignorent `dispatcher` (Bun) ; écrase un dispatcher global (proxy de sortie). Pas de relance.
- Leçon : avant de proposer un correctif de sécurité à une lib, vérifier sa politique de dépendances runtime, son mapping d'erreurs existant et le comportement sur tous les runtimes supportés. Pour une option opt-in de défense en profondeur, une PR de documentation peut être la contribution la plus adaptée.

## Piste interrompue

### Cosmos SDK (Immunefi)
- Programme : Cosmos (immunefi.com/bug-bounty/cosmos/), scope : Cosmos SDK, CometBFT, IBC, Cosmos EVM. Max bounty $50k, vault $80k
- Repo cloné : `~/Bureau/presend-project/github-contributions/cosmos-sdk`
- Modules ciblés : `x/bank` (transferts, impact financier direct), `x/authz` (délégation de permissions, proche des bugs GitLab Runner/Flux)
- Statut : audit commencé, interrompu avant conclusion, jamais repris
