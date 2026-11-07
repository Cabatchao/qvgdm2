# 02 / Éditorial — Le journal d’une maison

Une direction de magazine chaleureux pour présenter une maison de restauration et le projet de ceux qui la rejoignent. Fond crème dominant, très grands caractères Awesome Serif, corps Proxima Nova, filets olive, annotations orange. La photo de couverture est traitée en arche ; les images et les blocs de texte alternent dans une grille asymétrique, avec des marges et des légendes de publication. L’inspiration conceptuelle d’Aesop porte sur la retenue, le rythme éditorial et le rapport texte / image, sans reproduire son site.

## Parcours

Couverture avec franchise / Nord / deux formats → conditions → histoire → formats → accompagnement → huit restaurants et carte → questions → préparation du projet. Le montant de 30 000 € TTC est explicitement séparé de l’investissement total. Redevance de 5 % du CA mensuel HT, contrat de dix ans, trois bénéfices confirmés. Saint-André porte 2004 ; Lesquin et Mérignies restent sans année. Le fragment du réseau est intégré sans modifier son contenu.

## Motion

- Apparition douce des lignes et des chapitres à leur première entrée à l’écran.
- Dévoilement progressif des photographies par masque, en 1,35 seconde.
- Léger décalage des blocs comme des pages que l’on découvre ; aucun mouvement continu, aucune interception du défilement.
- Le bouton partagé est pris en charge par `/lab-controls.js`, chargé avant `motion.js`. Le script écoute `zio-motion-change` et consulte `window.zioMotionEnabled()`.
- Tout le contenu est visible sans JavaScript. L’animation démarre uniquement après l’observation d’un élément visible. La préférence système de réduction des mouvements et `html[data-motion="off"]` désactivent animations, transitions et défilement doux.

## Accessibilité et limites

Ancres natives, lien d’évitement, titres hiérarchisés, FAQ en `details`, focus visible, flèches SVG décoratives, labels accessibles du réseau conservés. Les points cartographiques ont des liens équivalents dans la liste. Mise en page prévue jusqu’à 320 pixels ; noms sur la carte masqués sous 380 pixels pour garder les numéros lisibles. Aucun formulaire, contact, traceur, bibliothèque distante ou backend ajouté.

Les fichiers utilisent des ressources locales partagées sous `/images/` et `/fonts/`. Le montage doit servir le dossier sous un chemin terminé par `/` pour les ressources `./style.css` et `./motion.js`. Le retour `/` vise le sélecteur des cinq directions. Le statut des candidatures reste « en préparation », sans calendrier promis.

Vérifications effectuées : syntaxe JavaScript, parsing CSS/HTML et correspondance des ancres internes. Aucun navigateur utilisé par cet agent ; le contrôle visuel et le test du bouton partagé sont à effectuer dans le montage commun.
