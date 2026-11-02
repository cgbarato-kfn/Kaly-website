# KALY website — version 11

## Fichiers à déployer
- `index.html`
- `css/style.css`
- `js/script.js`
- `functions/api/contact.js`
- `assets/` (logo, mascotte et icône)

## Déploiement Cloudflare Pages
Conserver cette arborescence à la racine du dépôt GitHub. Cloudflare Pages déploie le site et la fonction `/api/contact` depuis le dossier `functions/`.

Ne pas lancer `npx wrangler deploy` pour ce projet Pages.

## Configuration du formulaire
Dans les variables d’environnement Cloudflare Pages, configurer `RESEND_API_KEY` (secret). `RESEND_FROM` est facultatif si une valeur par défaut est définie dans la fonction.

Le formulaire envoie les demandes à `contact@kalyfn.com`.
