# ROADMAP Presend (mis à jour le 25 septembre 2026)

## Fait récemment (session du 25 sept.)
- [x] 4 nouveaux endpoints créés, testés, déployés : iban-validate, link-metadata, vat-validate, cve-lookup
- [x] Exposés côté MCP (41 outils au total désormais)
- [x] Compteurs obsolètes ("42 endpoints") corrigés partout (site, README, OpenAPI, profil GitHub) — vrai chiffre : 48
- [x] 4ᵉ fiche RapidAPI (Developer Tools) ajoutée à la doc /api, qui manquait
- [x] Collection Postman réellement resynchronisée via l'API (pas juste le chiffre affiché)
- [x] Page de statut BetterStack découverte (déjà active) et intégrée au site
- [x] Correction Spamhaus propagée (13 issues GitHub + site + OpenAPI)
- [x] Bug de plateforme RapidAPI (corps JSON supprimé) diagnostiqué, signalé, corrigé sur les 4 fiches
- [x] Documentation projet (ce fichier + PROJECT_CONTEXT.md + STRUCTURE.md + WORKFLOW.md) entièrement réécrite après un premier jet incomplet/inexact

## Conversations GitHub actives — à suivre, ne pas re-pitcher
- **rennf93/fastapi-guard #137** : mainteneur intéressé, demande une intégration dans `guard-core` (pas ce repo). Prochaine étape **de notre côté** : ouvrir une note de conception dans guard-core. Pas encore fait.
- **bunkerity/bunkerweb #3941** : mainteneur dit que la demande revient souvent, va "brainstormer" en interne. Rien à faire de notre côté, attendre leur retour.
- **intelowlproject/IntelOwl #4014** : un contributeur (`AnshSinghal`) construit activement un PR pour `Presend_AddressRisk` (le seul des 4 endpoints pitchés qui n'était pas redondant avec leurs intégrations directes existantes). Rien à faire sauf répondre si questions.

## Démarchage GitHub : 46 cibles contactées depuis le 21 sept., objectif 100-200 sur plusieurs semaines
- Méthode éprouvée : `gh api "search/code?q=<CLE_API_CONCURRENT>+in:file"`, filtrer par étoiles/activité, vérifier l'usage exact avant de pitcher, ne jamais deviner le code sans voir l'interface réelle.
- **Leçon appliquée depuis le 24 sept.** : privilégier `maintainer-change-check`/`typosquat-check`/`address-risk`/`tx-decode`/`supply-chain-check` (vrais différenciateurs) plutôt que `ip-reputation`/`url-reputation`/`malware-check` (souvent redondants chez les outils de sécurité matures).
- Diversifier les termes de recherche à chaque session plutôt que d'épuiser un même filon (plusieurs lots faibles observés quand on insiste trop sur une même piste).

## Divulgations de sécurité en attente (volet recherche séparé, voir historique complet dans les transcripts de session si besoin de détail)
- RunOnFlux/flux : 3 findings envoyés (TOCTOU, SSRF repotag, sessions n'expirant jamais), aucune réponse confirmée
- qrypt.chat, GitLab Runner (namespace overwrite), Next.js/Vercel (VDP, pas de bounty payant) : envoyés, sans réponse confirmée
- HenriGrimm/Minnow #1222 : ouverte, pas de contact privé obtenu
- Countly/countly-server PR #8041, unjs/ipx PR #336 : contributions de code réelles, en attente de review mainteneur
- Cosmos SDK (Immunefi) : audit x/bank et x/authz commencé, interrompu, pas repris depuis

## Prochaines étapes suggérées
- Continuer le démarchage (nouveaux termes de recherche à chaque session)
- Ouvrir la note de conception guard-core pour fastapi-guard
- Envisager d'étendre address-risk aux adresses Cosmos SDK (bech32) — cohérent avec le reste du catalogue, déjà demandé indirectement 2 fois
- Revoir la question des paliers payants RapidAPI une fois qu'il y a de vraies données d'usage
