# 05 / Studio

Piste graphique autonome pour comparer le design de la page franchise Pizza Zio. Direction produit : fond crème, typographie sans serif sobre, photographie panoramique arrondie, modules asymétriques et touches olive/orange. Les flèches sont des SVG décoratifs indépendants des glyphes de la police.

## Intention et cas de recette

Le visiteur envisage une franchise dans le Nord (59). Il doit comprendre les deux formats, les conditions et l’accompagnement, puis pouvoir préparer son projet. Cet aperçu n’accepte aucune candidature.

Parcours de référence : découvrir les formats → sélectionner « Avec restaurant » → lire les conditions → explorer une adresse sur la carte → préparer sa ville, son parcours et son calendrier. Le choix du format doit modifier la photo et la description, les montants doivent rester identiques et aucun envoi de données ne doit être proposé.

Cette version inclut la page complète, une comparaison des deux formats, la carte des huit restaurants, six questions fréquentes et l’état de préparation des candidatures. La réception des dossiers, les intégrations et les mesures de conversion ne font pas partie de cette piste.

## Fichiers

- `index.html` : contenu complet et sémantique, utilisable sans JavaScript.
- `style.css` : mise en page responsive, cartes, effets et variantes de réduction des animations.
- `motion.js` : amélioration progressive du sélecteur et entrées des composants.
- `lab-controls.js` : contrôle commun fourni par le laboratoire, chargé avant `motion.js`.

Les chemins `/images/`, `/fonts/` et `/lab-controls.js` supposent que les ressources partagées sont servies à la racine. Le lien « Les 5 pistes » pointe sur `/`. Le pied de page utilise des ancres présentes dans cet aperçu et ne suppose pas de pages juridiques absentes du build statique.

Le script commun `npm run build:design` prépare `out-design`. Ce build n’a pas été exécuté par l’agent de cette piste.

## Contenu de référence

Les informations proviennent de `data/franchiseData.ts` : droit d’entrée de **30 000 € TTC**, redevance de **5 % du chiffre d’affaires mensuel HT**, contrat de **10 ans**, formation complète, prix négociés auprès de fournisseurs centralisés et accompagnement au lancement. Le droit d’entrée est clairement distingué de l’investissement global, qui reste à confirmer avec l’apport personnel.

Le fragment réseau fourni dans `../network-fragment.html` est intégré à l’identique. Il conserve les huit adresses, les liens officiels, l’attribution du fond de carte et les six années confirmées, dont Saint-André en **2004**. Aucune année n’est ajoutée à Lesquin ou Mérignies. Les huit établissements ne sont pas présentés comme huit franchisés.

## Ressources privées

Les photographies `zio-dining-v2.webp` et `zio-terrace-v2.webp` sont des ressources de présentation déjà préparées par le projet, disponibles localement mais ignorées par Git. Le sélecteur utilise également `zio-service.webp`. Le fond de carte est `zio-network-map.svg?v=20261107-dark`. Les deux polices locales sont `ProximaNova-Regular.woff2` et `ProximaNova-Semibold.woff2`. Aucune ressource de rendu n’est chargée sur un domaine tiers ; les liens sortants du fragment réseau ouvrent les sources et restaurants officiels.

## Sélecteur et animations

Sans JavaScript, les deux panneaux restent visibles et le sélecteur est masqué. Les FAQ reposent sur `details` / `summary` natifs. Avec JavaScript, le sélecteur utilise `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` et un focus mobile dans la liste d’onglets. Les touches gauche/droite bouclent entre les formats ; Début/Fin sélectionnent le premier/dernier. Le panneau actif reste accessible au clavier et son changement est annoncé dans une zone discrète `aria-live`.

Les entrées se déclenchent avec `IntersectionObserver`. À défaut de cette API, le contenu reste visible. Le contrôle commun fournit `window.zioMotionEnabled()` et l’événement `zio-motion-change` avec `detail.enabled`. Désactiver les animations annule la transition active, révèle tous les composants et conserve le format sélectionné. `html[data-motion='off']` et `prefers-reduced-motion` désactivent aussi les effets CSS. Le sélecteur reste utilisable dans tous ces cas.

Aucun suivi, stockage navigateur, formulaire, appel réseau métier ou backend n’est ajouté.

## Vérifications effectuées

- `node --check design-preview/motion.js` : réussi.
- CSS analysé avec PostCSS : syntaxe valide.
- 14 contrôles DOM locaux réussis : fragment exact, identifiants uniques/ancres, huit repères et huit adresses, six années publiées, contenu sans JavaScript, ressources locales, absence de formulaire/ressource embarquée tierce, CSS responsive et réduction des animations, initialisation ARIA, clic et contenu correspondant, clavier, pause, reprise, préférence système et événement direct de désactivation.
- Contrôles réalisés avec JSDOM, sans serveur ni navigateur. Ils ne constituent pas une validation visuelle de la mise en page.

Recette commune à faire dans le navigateur : largeur 320 px et grand écran, lisibilité de la carte, cadrage des photos, absence de débordement, barre commune avec son libellé long, navigation au clavier et taille des cibles. Vérifier le clic « Avec restaurant », revenir avec la flèche gauche, mettre les animations en pause, puis sélectionner à nouveau le restaurant : la bonne photo/description doit apparaître immédiatement, sans animation et sans perte de focus.
