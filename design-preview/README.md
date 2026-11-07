# 06 — Anatomie

Nouvelle étude de direction visuelle après retour sur les premières pistes : mettre le produit au centre et créer une interaction spécifique, au lieu d’accumuler des effets d’entrée.

## Pour qui, parcours et première version

Pour une personne qui envisage d’ouvrir une franchise Pizza Zio dans le Nord. Elle découvre la marque, explore une pizza illustrative, lit les conditions, les deux formats et l’accompagnement, puis consulte les huit adresses. La présentation conserve les données validées dans `data/franchiseData.ts` et ne recueille pas de candidature.

Cette première version comprend une composition photographique interactive, le survol avec retour à la position de départ, des commandes tactiles/clavier, un curseur d’écartement, un mode sans mouvement, puis les informations de franchise. Une véritable modélisation volumétrique, une recette officielle et le circuit de candidature ne sont pas inclus.

## Cas attendu et résultat

- Entrer avec la souris dans la scène : écartement cible 1, quatre couches et leurs labels visibles. Sortir : retour exact à 0, inclinaisons à 0.
- Cliquer ou appuyer sur Entrée sur une commande : fixer ouvert/fermé. Un clic de fermeture prime sur le survol. Échap libère la vue et la referme.
- Déplacer le curseur : écartement intermédiaire. Début donne 0 ; Fin donne 100.
- Mettre les animations en pause : transformations instantanées, sans inclinaison ; l’exploration reste possible.

Contrôles de navigateur réalisés dans Chrome : survol (1.00000), sortie (0.00000, inclinaisons 0), Entrée, Échap, pause et curseur Début. Largeurs 1363 et 340 px CSS contrôlées sans débordement horizontal. La largeur étroite est obtenue par zoom, sans téléphone physique. Le rendu de la pizza assemblée et éclatée a été observé. Le moteur comporte également 21 contrôles isolés avec simulation de survol/tactile, pause, réduction des mouvements, changement de préférence, visibilité et arrêt de RAF.

Contrôles structurels : identifiants uniques, ancres valides, huit repères, fragment réseau strictement identique à la référence, syntaxe CSS/JS et construction réussies. Pas de formulaire, CDN, suivi ou appel métier. CSP restrictive.

La prévisualisation locale a subi une interruption après les essais. L’accès au déploiement privé demande une connexion ChatGPT ; la recette au-delà de cet écran dans le navigateur hébergé reste distincte des essais locaux. Safari, téléphone physique, mesure de conversion et audit de production ne sont pas couverts.

## Visuel et véracité

`assets/pizza-layers.png` est un atlas transparent généré pour cette maquette, utilisé en quatre cadrages CSS alignés : pâte, tomate, mozzarella et basilic. Le fichier original est conservé, sans retouche ni extraction raster. Le visuel n’atteste pas la recette, les ingrédients ou le produit réel Pizza Zio. La mention illustrative apparaît près de la scène. Le prompt est dans `ASSET-PROMPT.md`.

## Exécution

`npm run build:design` produit `out-design` avec les ressources locales. Cette commande ne modifie pas les routes applicatives du site actuel. Le lien de galerie pointe vers `/` dans le déploiement comparatif. Le prototype et son atlas sont enregistrés sur leur branche autonome.

## Mouvement

`motion.js` est autonome, chargé avec `defer`, sans bibliothèque ni contrôle commun externe. Il écrit `--spread`, `--rx`, `--ry`, `data-expanded`, l’état des boutons et du curseur. Amortissement exponentiel monotone, inclinaison maximale ±2°, RAF arrêté au repos et lorsque l’onglet est caché. La préférence système de réduction des mouvements est prioritaire. Les couches restent visibles sans JavaScript.
