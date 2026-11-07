# Recette commune — 7 novembre 2026

Cette branche contient une maquette autonome de comparaison graphique. Aucun fichier de la page applicative actuelle n’a été modifié. Aucune candidature, donnée personnelle ou adresse privée n’est collectée ou affichée.

## Parcours de référence
Un candidat dans le Nord ouvre la page, découvre les deux formats, lit les conditions, explore les huit adresses, puis rejoint la préparation de son projet. Les informations confirmées doivent rester identiques dans les cinq directions. Le contrôle des animations doit permettre une lecture immobile.

## Résultats
- Construction `npm run build:design` réussie.
- Syntaxe JavaScript et CSS contrôlée ; identifiants uniques et ancres locales valides.
- Fragment réseau identique à la référence : huit points, huit adresses, années connues conservées, Saint-André 2004. Pas d’année inventée pour Lesquin ou Mérignies.
- Ressources de rendu locales ; CSP restrictive ; absence de formulaire et d’appel métier.
- Affichage de chaque direction observé dans Chrome à 1363 px ; contrôle du débordement horizontal réussi à 340 px CSS, obtenu par zoom navigateur. Ce n’est pas un test sur téléphone physique ou sur Safari.
- Le bouton de pause passe l’état commun à `off` dans les cinq directions. Les règles de réduction des animations sont présentes dans le code ; le réglage système n’a pas été manipulé.
- Studio : sélection des formats et changement de panneau vérifiés au clic et avec la flèche gauche du clavier.
- Pop : glyphes décoratifs non rendus repérés au premier passage ; remplacés par des SVG puis observés dans la variante étroite.
- Galerie vérifiée à 779 px avec cinq liens et cinq aperçus. La prévisualisation locale a connu des interruptions ; le déploiement privé de la galerie a réussi. L’accès hébergé demande la connexion du propriétaire et n’a pas été testé au-delà de cet écran dans le navigateur de recette.

## Exécution
`npm run build:design` produit `out-design`. Les ressources privées de présentation déjà préparées par le projet doivent être disponibles dans `public/` ; elles restent exclues de Git. Le build signale leur absence. La galerie privée contient le rendu complet pour la comparaison. Le lien « Les 5 pistes » pointe vers la racine de cette galerie.

## Limites
Maquette de design, sans validation des performances de conversion, test de charge, certification d’accessibilité ou audit de sécurité de production. Les candidatures restent en préparation. Aucune fusion ou publication sur le site actuel.
