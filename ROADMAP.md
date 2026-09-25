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
- **rennf93/fastapi-guard #137 -> rennf93/guard-core #119** : note de conception publiée le 25 sept. (https://github.com/rennf93/guard-core/issues/119) + commentaire de suivi sur #137. **Changement de cap assumé** : après lecture du code, le design ne passe PAS par l'API Presend -- check natif `ThreatListCheck` + `ThreatListRefreshCheck` qui télécharge `drop_v4.json`/`drop_v6.json` directement chez Spamhaus (1 710 + 91 CIDR, ~110 Ko), comparaison locale, calqué sur la paire cloud (`CloudIpRefreshCheck`/`CloudProviderCheck`). Config `block_threat_lists` (frozenset, opt-in) + `threat_list_refresh_interval` (défaut 86400, min 3600). État dans un singleton handler (rien dans le protocole middleware), Redis optionnel pour un seul téléchargement par déploiement, fail-open, sync généré par `make sync`. **4 questions en attente** (forme de config, décorateur par route, type d'événement, liste périmée). On s'est proposés pour écrire le PR. Clone lecture seule : `github-contributions/guard-core`.
- **bunkerity/bunkerweb #3941** : mainteneur dit que la demande revient souvent, va "brainstormer" en interne. Rien à faire de notre côté, attendre leur retour.
- **intelowlproject/IntelOwl #4014** : un contributeur (`AnshSinghal`) construit activement un PR pour `Presend_AddressRisk` (le seul des 4 endpoints pitchés qui n'était pas redondant avec leurs intégrations directes existantes). Rien à faire sauf répondre si questions.
- **neomatrix369/tripwire #143** : feu vert du mainteneur. Fork `presendapp/tripwire` cloné dans `github-contributions/tripwire`. Le 25 sept., commentaire posté (https://github.com/neomatrix369/tripwire/issues/143#issuecomment-5838814495) : `vulnerability-check` retiré (doublon de DepShield), corrections qualité annoncées, et **4 questions en attente de réponse** : (1) OK pour un 1er adaptateur HTTP malgré ADR-0005 (sous-processus CLI) ? (2) budget temps : DEPSHIELD 110 + CARGO_AUDIT 40 + OSSPREY 90 = SCAN_TIMEOUT 240 déjà saturé, où prendre ~20 s (proposé : OSSPREY 90->70) ? (3) actif par défaut ou opt-in (confidentialité des noms de paquets) ? (4) slice stub n°78 vague R ou le mainteneur l'insère lui-même ? **Ne pas coder avant sa réponse.** Design prévu : `run_presend` + `_run_presend_group` en fin de `SCANNER_GROUPS` (`applies_to: both`), réutilise `_find_manifests`, findings `amber` uniquement, erreurs -> `unreachable`, pas de manifeste -> `not_applicable`, `urllib` stdlib, POST batch Presend, maintainer plafonné à 100 paquets (troncature signalée), addendum ADR-0017 + `scanner-output-adapters.md` + DECISIONS, **aucune mention README (règle trust-strip)**, couverture ≥ 95 %, `check-scanner-timeout-budget.sh` à mettre à jour. `partial-failed` est traité comme terminé par `guard/status.py` : une panne Presend ne bloque pas les agents.

## Démarchage GitHub : 48 cibles contactées (vérifié par session-check.sh le 25 sept.) depuis le 21 sept., objectif 100-200 sur plusieurs semaines
- Méthode éprouvée : `gh api "search/code?q=<CLE_API_CONCURRENT>+in:file"`, filtrer par étoiles/activité, vérifier l'usage exact avant de pitcher, ne jamais deviner le code sans voir l'interface réelle.
- **Leçon appliquée depuis le 24 sept.** : privilégier `maintainer-change-check`/`typosquat-check`/`address-risk`/`tx-decode`/`supply-chain-check` (vrais différenciateurs) plutôt que `ip-reputation`/`url-reputation`/`malware-check` (souvent redondants chez les outils de sécurité matures).
- Diversifier les termes de recherche à chaque session plutôt que d'épuiser un même filon (plusieurs lots faibles observés quand on insiste trop sur une même piste).

## Divulgations de sécurité en attente (volet recherche séparé, voir historique complet dans les transcripts de session si besoin de détail)
- RunOnFlux/flux : 3 findings envoyés (TOCTOU, SSRF repotag, sessions n'expirant jamais), aucune réponse confirmée
- qrypt.chat, GitLab Runner (namespace overwrite), Next.js/Vercel (VDP, pas de bounty payant) : envoyés, sans réponse confirmée
- HenriGrimm/Minnow #1222 : ouverte, pas de contact privé obtenu
- Countly/countly-server PR #8041, unjs/ipx PR #336 : contributions de code réelles, en attente de review mainteneur
- Cosmos SDK (Immunefi) : audit x/bank et x/authz commencé, interrompu, pas repris depuis

## Fait aujourd'hui (25 sept., suite)
- [x] punkpeye/awesome-mcp-servers #14651 : badge de score Glama ajouté + compteur d'outils corrige (36 -> 41), mainteneur informe
- [x] Fiche Glama Connectors revendiquee (verification GitHub) : https://glama.ai/mcp/connectors/io.github.presendapp/presend-mcp

## Fait aujourd'hui (25 sept., soir) -- qualité supply-chain + tripwire
- [x] **typosquat-check** : 12 paquets npm très populaires sur 25 testés sortaient "suspects" (ms, qs à 1 édition de ws...). Seuil désormais proportionnel à la longueur (<=3 car. : pas de comparaison approx. ; 4-7 : 1 édition ; 8+ : 2). Résultat : 0 faux positif / 35 légitimes, 17/18 typosquats détectés (seul raté : electorn, car electron absent de la liste).
- [x] **maintainer-change-check** : 17 paquets sains sur 22 sortaient "suspects" (passations légitimes parfois de 2013). Désormais : seuls les événements des 365 derniers jours ; publieurs CI (GitHub Actions, *-bot...) et pré-versions rapportés à part sans lever le drapeau. Résultat : 0/25 suspects aujourd'hui, event-stream toujours détecté en rejouant au 2018-11-26. Timeout (8 s) couvre maintenant le corps de la réponse (typescript = 15,7 Mo).
- [x] **Mode batch POST** sur les deux endpoints (typosquat max 100, maintainer max 20 avec 6 fetchs simultanés), 1 unité de rate limit par lot. Validé en prod : 20 paquets lourds en 1,6 s sans erreur.
- [x] openapi.json + openapi-security-only.json (POST, descriptions, exemple lodash qui montrait à tort `suspicious: true`), README, commentaire de code corrigés.
- [x] Affirmation "event-stream, ua-parser-js, colors.js" corrigée dans **11 issues/PR** (note d'édition datée visible) + ligne du fichier dans la PR bureado #111. Au passage, 3 issues disaient encore maintainer-change-check "npm/PyPI" ou "crates.io-adjacent" (SkillSpector #602, devguard #3083, typomania #36) : corrigé.

## Piste d'amelioration produit identifiee (retour Glama TDQS, score C 2.6/5.0)
Retour independant sur la qualite des definitions d'outils MCP, pas urgent mais a garder en tete :
- Chevauchements ambigus pour un agent IA : email_validate vs email_verify, cve_lookup vs vulnerability_check, verifications individuelles vs versions combinees (security_scan, supply_chain_check)
- Incoherence de nommage : suffixes varies (check/lookup/validate/verify/scan), noms a un mot (base64, color, ip, password, uuid) qui rompent le motif
- 41 outils = trop charge pour un agent, utilitaires generiques melanges aux outils securite
- Piste : envisager de scinder le serveur MCP par domaine (comme les 4 fiches RapidAPI), ou renommer pour une convention plus coherente

## Prochaines étapes suggérées
- [x] **ip-reputation conforme aux conditions Spamhaus (25 sept.)** : copie globale dans KV (`spamhaus-drop:v4`) rafraîchie au plus toutes les 12 h, verrou KV d'1 h (`spamhaus-drop:v4:lock`) pour qu'un seul datacenter télécharge, cache mémoire 5 min, JSON au lieu de drop.txt, `list_date`/`attribution`/`terms`/`stale` dans la réponse, dernière copie servie si Spamhaus est injoignable (stale après 36 h). Testé (12/12, faux KV + fausse horloge, sans téléchargement réel) et vérifié en prod (clés présentes dans KV). Nom Spamhaus retiré des titres/descriptions d'openapi-security-only.json et des exports RapidAPI.
- **A FAIRE A LA MAIN** : réimporter `~/Bureau/presend-project/rapidapi-exports/presend-openapi.json` dans la fiche RapidAPI "Presend API" -- la version en ligne affiche probablement encore "IP reputation check (Spamhaus DROP)" (usage promotionnel interdit par la section 3.2).
- [x] ip-reputation IPv6 (25 sept.) : `drop_v6.json` avec sa propre copie KV + verrou (`spamhaus-drop:v6`), chargement paresseux, IPv4 encapsulée (::ffff:a.b.c.d) vérifiée contre la liste v4, parseur IPv6 testé sur 23 cas limites. Docs OpenAPI + description MCP + export RapidAPI mis à jour (réimport RapidAPI toujours à faire à la main, voir plus haut).
- **tripwire #143** : attendre la réponse aux 4 questions, puis coder l'adaptateur (voir design ci-dessus)
- **guard-core #119** : attendre la réponse du mainteneur aux 4 questions, puis forker et écrire le PR
- Resynchroniser la collection Postman (POST batch des 2 endpoints) ; ajouter des méthodes batch au client npm `presend-api`
- [x] Lint Redocly réparé (25 sept.) : `"security": []` à la racine (0 erreur au lieu de 52) + 9 exemples/schémas incohérents corrigés (champs `url`, `note`, `wildcard_rules_note` absents du schéma, `null` non déclarés, exemples de paramètres en texte). Reste : `operationId` manquants (52) et réponses 4xx non documentées (39) -- vérifier l'effet d'un `operationId` sur le réimport RapidAPI avant de les ajouter.
- [x] Audit rate limit (25 sept.) : 48 endpoints publics cohérents seuil/message sauf `url-clean` (seuil 30, message 60) -> seuil relevé à 60. Mécanisme commun : écriture KV échantillonnée 1/5 avec +5, donc limite effective = seuil `count >= N`.
- [x] **Quota d'écritures KV (25 sept.)** : `track.js` (appelé au chargement de 336 pages) faisait 2 écritures KV par page vue sans échantillonnage -- plan gratuit = 1 000 écritures/jour, espace KV partagé avec les rate limits de toute l'API (quota épuisé = rate limits désactivés en silence). Désormais échantillonné (rate limit 1/5 +5, visites 1/10 +10) : 303 écritures pour 1 000 pages vues simulées au lieu de 2 000, estimation des visites ~4 % d'erreur, KV en panne -> 200. Reste à vérifier dans le dashboard Cloudflare (Workers & Pages -> KV) le volume réel d'écritures et le plan du compte ; piste plus robuste à terme : Workers Analytics Engine pour les compteurs de visites.
- typosquat-check : enrichir la liste organisée (electron, etc.)
- Continuer le démarchage (nouveaux termes de recherche à chaque session)
- Ouvrir la note de conception guard-core pour fastapi-guard
- Envisager d'étendre address-risk aux adresses Cosmos SDK (bech32) — cohérent avec le reste du catalogue, déjà demandé indirectement 2 fois
- Revoir la question des paliers payants RapidAPI une fois qu'il y a de vraies données d'usage
