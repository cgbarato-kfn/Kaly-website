# KALY Website — V20 compacte

## Objectif
Réduire la longueur de la page sans supprimer les informations importantes.

## Changements
- Réduction des espacements verticaux entre les sections, sur ordinateur et mobile.
- Présentation des trois espaces TRACK, ANALYSES et EVOLUTION en colonnes sur grand écran.
- Parcours Tracker en grille compacte : 3 colonnes sur ordinateur et 2 colonnes sur mobile.
- Cartes « À qui s’adresse KALY ? » en grille plus compacte.
- Informations secondaires repliées dans des sections « Voir… » (projet, détails des espaces et professionnels).
- Les titres et les informations principales restent visibles ; les détails restent accessibles en ouvrant les sections.
- Traductions FR / ES / EN ajoutées pour les libellés des sections repliables.

## Fichiers à remplacer dans GitHub
Remplacer uniquement :
- `index.html`
- `css/style.css`
- `js/script.js`

Ne pas remplacer :
- `functions/api/contact.js`
- le dossier `assets`

Ces derniers ne sont pas modifiés dans cette version.

## Déploiement
Téléverser les trois fichiers aux chemins exacts ci-dessus sur la branche `main`, puis valider le commit. Cloudflare Pages doit ensuite lancer un déploiement automatique.

La version précédente reste sauvegardée dans la branche `backup-before-v19-2026-11-19`.
