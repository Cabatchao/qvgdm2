# 04 / Atelier

Piste de design autonome pour la franchise Pizza Zio. Un fond olive profond, une grille à filets fins, des titres pleins et en contour, des photographies cadrées comme des planches d’atelier. Le crème apporte de la respiration aux formats et aux questions ; l’orange indique un repère ou une interaction.

## Parcours vérifiable

1. **Pour qui et dans quel but ?** Une personne qui envisage d’ouvrir un Pizza Zio dans le Nord doit comprendre les formats, les conditions et l’état actuel des candidatures.
2. **Que peut-elle faire ?** Lire l’introduction, accéder aux deux formats, consulter les conditions, localiser les huit restaurants, ouvrir les questions fréquentes et consulter les éléments à préparer pour son projet. Les liens de carte rejoignent les adresses correspondantes ; les liens officiels ouvrent un nouvel onglet annoncé.
3. **Première version.** La page présente uniquement les informations validées. La réception des candidatures reste fermée : aucun formulaire, aucune transmission de données, aucun service externe chargé. L’investissement global, l’apport et les modalités détaillées de l’accompagnement restent à confirmer par l’équipe Pizza Zio.
4. **Cas de test.** Une personne sur mobile choisit « Conditions ». Elle doit trouver 30 000 € TTC de droit d’entrée, 5 % du CA mensuel HT, un contrat de 10 ans et la distinction avec le budget total. Le point « 3 » de la carte doit mener à Saint-André-lez-Lille, avec l’année 2004. Le chapitre « Votre projet » doit annoncer que les candidatures ne sont pas encore ouvertes, sans champ de saisie.

## Mouvement et accessibilité

- Les filets se dessinent à leur entrée dans la fenêtre ; les photos glissent dans leur cadre sans déplacement de la mise en page.
- Une progression verticale accompagne les chapitres sur grand écran. Sur mobile, les liens de chapitre restent accessibles dans une barre compacte.
- Les repères de carte et les adresses se mettent en évidence au focus clavier et au survol ; les ancres restent natives.
- Le contenu reste visible sans JavaScript. Le défilement n’est pas intercepté. Les FAQ utilisent les éléments natifs `details` et `summary`.
- `/lab-controls.js` précède `motion.js` et pilote le bouton `data-motion-toggle`, `window.zioMotionEnabled()` et l’événement `zio-motion-change`.
- `html[data-motion='off']` et `prefers-reduced-motion: reduce` suppriment les transitions CSS. Le script respecte ces états et annule les animations en cours quand les mouvements sont désactivés.
- Les titres en contour retrouvent une couleur pleine dans les modes de couleurs forcées. Les liens possèdent des états de focus visibles.

## Fichiers et données

Les quatre fichiers de ce dossier sont la seule modification nécessaire. Les polices, photos et le fond cartographique sont servis depuis `/fonts/` et `/images/` par la galerie commune. Aucune dépendance distante n’est chargée.

Les chiffres, formats et bénéfices proviennent de `data/franchiseData.ts`. La section du réseau est intégrée à l’identique depuis `../network-fragment.html` à la racine du laboratoire de design. Les dates inconnues de Lesquin et Mérignies sont omises. L’année de Saint-André-lez-Lille est 2004, confirmée par le responsable du projet.

## Vérification locale

Contrôles statiques : syntaxe JavaScript, ancres internes, identifiants uniques, présence des huit repères et des huit adresses, inclusion exacte du fragment réseau, existence des ressources locales et absence de formulaire ou de chargement externe.

La mise en page comporte des adaptations à 1 150, 850, 600 et 360 pixels. La vérification visuelle dans le navigateur et les essais d’animation réels sont à effectuer par l’intégrateur de la galerie ; aucun navigateur partagé, build, commit ou déploiement n’a été utilisé pour cette piste.
