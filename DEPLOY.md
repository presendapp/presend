# Déployer Presend — guide en 10 minutes

Objectif : mettre les 2 outils actuels en ligne, gratuitement, sans backend. Après ça, on
observe avant de construire le 3e outil (cf. principe "publier vite, observer ensuite").

## Étape 1 — Mettre le code sur GitHub (5 min)

1. Va sur [github.com/new](https://github.com/new) et crée un dépôt (ex. `presend`), public, sans README (on en a déjà un).
2. Sur ton ordinateur, dans le dossier `microtools` extrait du zip :

```bash
cd microtools
git init
git add .
git commit -m "Initial commit: EXIF Remover + PDF Metadata Remover"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/presend.git
git push -u origin main
```

## Étape 2 — Déployer sur Netlify (5 min)

Pourquoi Netlify plutôt que Vercel : son tier gratuit autorise l'usage commercial dès le départ
(dons compris), contrairement à Vercel Hobby. Cloudflare Pages est une alternative tout aussi
valable si tu préfères (bande passante illimitée en gratuit).

1. Va sur [app.netlify.com](https://app.netlify.com) et connecte-toi avec ton compte GitHub.
2. "Add new site" → "Import an existing project" → choisis le dépôt `presend`.
3. Aucune configuration de build nécessaire : le site est 100% statique.
   - Build command : (laisser vide)
   - Publish directory : `.` (racine du dépôt)
4. "Deploy site". Après 30-60 secondes, ton site est en ligne sur une URL du type
   `random-name-123.netlify.app`.
5. (Optionnel) Renomme le sous-domaine dans "Site settings" → "Change site name" pour quelque
   chose de plus propre, ex. `presend.netlify.app`.

## Étape 3 — Vérifier que tout fonctionne

- Ouvrir le site en ligne (pas juste en local) et tester les deux outils avec un vrai fichier.
- Vérifier sur mobile (juste avec ton téléphone, pas besoin d'outil spécial).
- Vérifier que le lien "All tools" et les deux cartes sur la page d'accueil fonctionnent.

## Étape 4 — Checklist de publication (reprise du README, étapes 8-9)

- [ ] Soumettre l'URL à Google Search Console (indexation)
- [ ] Partager le lien dans 1-2 communautés pertinentes (ex. un forum de freelances/journalistes, un subreddit adapté)
- [ ] Noter la date de publication quelque part (pour savoir quand commencer à mesurer)

## Étape 5 — Observer avant de construire la suite

Pas d'outil d'analytics à installer dans l'immédiat (ça ajouterait une dépendance non
nécessaire) — Netlify et Cloudflare Pages fournissent déjà un compteur de visites basique dans
leur tableau de bord, suffisant pour le Niveau 1 ("est-ce que c'est utilisé ?"). On y revient
dans quelques jours/semaines pour décider, selon la règle des 3 critères, si PDF Compress est
vraiment le bon 3e outil ou si les deux premiers outils indiquent autre chose.

## Optionnel — nom de domaine (Option B du plan, pas obligatoire)

Si tu veux un nom de domaine propre (~15 CHF/an) une fois que tu as un peu de traction :
Netlify permet de le connecter directement dans "Domain settings", sans changer d'hébergeur.
