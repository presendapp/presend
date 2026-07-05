# Presend — système de production de micro-outils

Base de code minimale : vanilla HTML/CSS/JS, zéro build, zéro dépendance, zéro backend.

## Structure

```
/index.html          → page d'accueil, liste des outils
/style.css            → tokens de design partagés (couleurs, typo, composants)
/tools/*.html          → un fichier HTML autonome par outil
```

Chaque outil est un fichier `.html` unique et autonome dans `/tools/`. Il importe `../style.css`
pour l'apparence, mais toute sa logique JS est inline dans le fichier — pas de fichier JS partagé
pour l'instant, pour garder chaque outil réellement indépendant (Principe n°1).

## Checklist — créer un nouvel outil

1. Copier `tools/exif-remover.html` comme point de départ
2. Modifier le titre, la meta description, le H1 et le texte d'intro
3. Ajouter la logique de traitement (toujours 100% côté client)
4. Vérifier la licence de toute bibliothèque utilisée (si aucune n'est nécessaire, tant mieux)
5. Tester : fichier valide, fichier invalide, fichier trop gros, mobile, clavier seul
6. Déployer
7. Ajouter une entrée dans `tool-grid` sur `index.html`
8. Vérifier l'indexation Google (Search Console)
9. Partager dans 1-2 communautés pertinentes
10. Terminé

Règle : si une étape 3 prend plus de 2-3 jours, l'outil est trop gros — le découper.

## Principes

- Chaque outil fonctionne seul.
- Aucune base de données tant que ce n'est pas indispensable.
- Aucun compte utilisateur.
- Aucun backend tant que le traitement peut rester local.
- Aucune dépendance JS lourde si une solution simple suffit (ex : EXIF Remover n'utilise
  aucune librairie — un simple redraw sur `<canvas>` suffit à supprimer toutes les métadonnées).
- Réutiliser `style.css` entre tous les outils.
- Publier vite, améliorer ensuite.
- Un outil peu utilisé peut être retiré (principe de suppression).

## Déploiement

Ce dossier est un site 100% statique — n'importe quel hébergeur statique gratuit convient
(Netlify, Cloudflare Pages, GitHub Pages). Éviter Vercel Hobby si une monétisation, même
symbolique (dons), est envisagée : son tier gratuit interdit l'usage commercial.

## Tours de boucle

### Tour 1 — EXIF Remover
- **Outil** : EXIF Remover (images uniquement — JPG/PNG/WebP)
- **Dépendance** : aucune (redraw `<canvas>` suffit à supprimer toutes les métadonnées)
- **Hypothèse testée** : les gens veulent-ils supprimer les métadonnées d'une photo directement
  dans le navigateur, sans installer d'app ni créer de compte ?
- **Résultat** : à observer après publication.

### Tour 2 — PDF Metadata Remover
- **Outil** : PDF Metadata Remover
- **Dépendance** : [pdf-lib](https://github.com/Hopding/pdf-lib) (MIT, chargée via CDN jsdelivr,
  aucune install locale). Écrire un parseur PDF maison dépasserait largement la règle des 2-3
  jours — ici la "solution simple" du principe n°5 ne suffisait pas.
- **Limite assumée et affichée à l'utilisateur** : ce tool nettoie le dictionnaire d'information
  standard (titre, auteur, dates, logiciel utilisé), mais ne garantit pas encore la suppression
  du flux XMP séparé que certains PDF embarquent. Documenté honnêtement dans l'UI plutôt que
  de surpromettre.
- **Hypothèse testée** : ce deuxième outil suffit-il à faire revenir un même visiteur pour un
  deuxième usage (signal de parcours, cf. Niveau 2 du plan) ?
- **Résultat** : à observer après publication.
- **Prochain outil suggéré** (à confirmer selon la règle des 3 critères) : PDF Compress.

## Publication

- Publié le 5 juillet 2026 sur https://presendapp.netlify.app
- Outils en ligne : EXIF Remover, PDF Metadata Remover

