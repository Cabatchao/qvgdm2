# Piste 03 — Pop italien

Une direction d’affiche et de convivialité : très grand « ZIO », ouverture orange, typographie compacte, collages photographiques légèrement décalés, aplats crème/olive/encre. L’inspiration est conceptuelle (l’énergie typographique de Nike, la convivialité de Big Mamma), sans reprise de leurs éléments graphiques ou de leurs contenus.

## Parcours

1. Offre franchise explicitement située dans le Nord (59), avec les deux formats et un accès au projet.
2. Histoire de la maison, formats à emporter / avec restaurant.
3. Conditions confirmées : 30 000 € TTC de droit d’entrée, distinct de l’investissement total ; redevance de 5 % du chiffre d’affaires mensuel HT ; contrat de 10 ans.
4. Trois bénéfices validés, huit restaurants et carte, FAQ, préparation du premier échange.

Le fragment réseau fourni dans `design-lab/network-fragment.html` est intégré à l’identique : coordonnées, adresses, six années connues et absence de dates pour Lesquin et Mérignies. Les huit restaurants ne sont pas présentés comme huit franchisés. Les critères d’entrée, modalités détaillées et données financières manquantes restent à confirmer par l’équipe Pizza Zio.

## Mouvement

- Arrivée typographique des lettres de « ZIO » à l’ouverture.
- Bandeau de mots défilant, sans flash ni défilement de page imposé.
- Léger mouvement du tampon décoratif ; arrivée des cartes et des rubriques au passage dans l’écran.
- Bouton commun `[data-motion-toggle]` dans la barre persistante, piloté exclusivement par `/lab-controls.js`.
- `motion.js` consulte `window.zioMotionEnabled()` et écoute `zio-motion-change` ; aucune collecte, requête réseau, stockage ou dépendance externe.
- `html[data-motion='off']`, la préférence `prefers-reduced-motion` et la page masquée arrêtent les mouvements. Tout le contenu est visible sans JavaScript. Les FAQ et le menu mobile reposent sur des éléments `details` natifs.

## Ressources et vérification

Photos et polices locales uniquement ; dimensions des images déclarées, chargement différé en dehors de la photo principale, variantes légères disponibles sur petit écran. Aucune nouvelle image ni prestation commerciale n’a été fabriquée. Les liens vers les restaurants et crédits de carte proviennent du fragment partagé ; ils ne chargent aucun service tiers dans la page.

Contrôles de cette passe : syntaxe JavaScript, présence et unicité des ancres, copie exacte du fragment réseau, huit repères/huit adresses, six années connues, conditions commerciales et absence de formulaire/iframe/script distant. La recette visuelle et le build commun sont assurés par le parent ; aucun navigateur, build, commit ou déploiement n’a été lancé dans cette passe.

Fichiers écrits : `index.html`, `style.css`, `motion.js`, `README.md`. Le helper `lab-controls.js` fourni par le parent n’est pas modifié.

Les flèches et les motifs étoilés sont des SVG locaux intégrés au HTML, masqués aux technologies d’assistance lorsqu’ils sont décoratifs. Leur rendu ne dépend pas de la couverture de caractères des polices.
