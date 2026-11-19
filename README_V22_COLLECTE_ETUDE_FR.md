# KALY V22 — Connexion de la collecte de l’étude

## Fichiers ajoutés / modifiés
- Ajout : `functions/api/study-submit.js` — réception et insertion des réponses dans D1.
- Modification : `study/study.js` — envoi à l’API à la fin du questionnaire ; affichage d’un succès uniquement après confirmation du serveur.
- Modification : `study/translations.json` — messages d’envoi, de succès et d’erreur en français et en espagnol.

## Configuration Cloudflare requise
1. Dans Pages > `kaly-website` > Paramètres > Fonctions, vérifier que la liaison D1 porte exactement le nom `DB`.
2. Vérifier qu’elle cible la base `kaly-study-test` (ou la base choisie pour l’environnement concerné).
3. Redéployer le projet après l’ajout des fichiers.

## Schéma D1 attendu
La fonction utilise la table `study_responses` déjà créée avec les colonnes :
`response_id`, `respondent_type`, `language`, `country`, `answers_json`, `schema_version`, `submitted_at`.

## Comportement
- Route : `POST /api/study-submit`.
- Profils autorisés : `user`, `pro`. Langues : `fr`, `es`. Version : `V0.3`.
- Les réponses sont stockées dans `answers_json`. Aucune création de compte n’est effectuée.
- La réponse à la question 28 reste une simple réponse Oui/Non. Aucun nom ni e-mail n’est envoyé à cette API. Le formulaire de contact pilote doit rester séparé.
- Les champs facultatifs restent facultatifs.
- L’API limite la taille de la requête et vérifie le format des données.

## Tests après déploiement
1. Faire un envoi test avec le profil utilisateur et un autre avec le profil professionnel.
2. Vérifier dans D1 > Explorer les données : `SELECT respondent_type, language, country, schema_version, submitted_at FROM study_responses ORDER BY submitted_at DESC LIMIT 10;`
3. Vérifier les réponses : `SELECT response_id, json_valid(answers_json) AS json_ok FROM study_responses ORDER BY submitted_at DESC LIMIT 10;`
4. Vérifier qu’un échec réseau affiche un message d’erreur et ne montre pas le message de succès.

## Important avant ouverture publique
Cette version technique ne remplace pas les validations RGPD. Avant d’ouvrir la collecte au public, compléter et afficher l’information relative au responsable du traitement, aux finalités, à la base légale, à la durée de conservation, aux destinataires, aux droits et au contact pour exercer ces droits. Vérifier également si certaines réponses peuvent révéler des données de santé et adapter le dispositif en conséquence. Ne pas annoncer la collecte comme anonyme sans avoir vérifié les journaux et paramètres de la plateforme.
