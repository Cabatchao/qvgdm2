# 01 / Cinéma

Une piste de recrutement pour un porteur de projet dans le Nord : comprendre les deux formats, les conditions et l’accompagnement, repérer les huit restaurants, puis préparer un premier échange. La composition privilégie des plans photographiques généreux, une typographie serif de grande taille et des respirations entre les chapitres. L’encre, l’olive, le crème et l’orange reprennent l’identité Pizza Zio.

## Parcours et périmètre

Navigation native vers Formats, Conditions, Adresses, Questions et Votre projet. Le droit d’entrée de 30 000 € TTC est distingué de l’investissement total ; les deux autres repères sont 5 % du chiffre d’affaires mensuel HT et un contrat de dix ans. Les trois bénéfices sont ceux de `data/franchiseData.ts`. Le fragment réseau fourni est intégré sans changer ses huit adresses, ses dates ou ses positions. Aucune date n’est ajoutée à Lesquin ou Mérignies.

C’est une maquette complète et indépendante, sans formulaire, collecte, envoi, intégration métier ni appel externe au chargement. La dernière section explique ce que le candidat peut préparer et indique clairement que les candidatures en ligne sont en préparation. Les liens sortants du réseau ouvrent uniquement les sources et les pages officielles déjà présentes dans le fragment fourni.

## Motion

Sur écran large, la photo du premier écran gagne une profondeur douce pendant le défilement. Les photographies des formats s’ouvrent par masque. Une seule scène photographique accompagne le défilement natif par un cadre qui s’ouvre et un titre qui se déplace légèrement. Les titres et blocs entrent subtilement dans le champ ; rien n’est caché dans l’état HTML/CSS initial.

La profondeur continue et la scène épinglée sont désactivées sur écran étroit (800 px et moins). Les petites entrées restent optionnelles. `prefers-reduced-motion` et le contrôle commun `data-motion-toggle` coupent toutes les animations, transitions et décalages, et rendent la scène statique. `/lab-controls.js` est chargé avant `motion.js` ; il fournit `zioMotionEnabled()` et l’événement `zio-motion-change`. Aucun défilement n’est intercepté, aucune introduction ne bloque l’accès, aucune vidéo n’est utilisée.

## Critères vérifiables

1. Depuis le premier écran, Formats rejoint les deux propositions et Conditions montre les trois valeurs et la distinction entre droit d’entrée et budget total.
2. Chaque numéro de la carte rejoint une adresse ; huit repères et huit établissements sont présents, dont Saint-André-lez-Lille en 2004.
3. Sans JavaScript, tout le contenu est visible, les ancres fonctionnent et les questions s’ouvrent avec les éléments `details` natifs.
4. À 320 px, la navigation est conservée, les colonnes deviennent une seule colonne et les étiquettes de carte sont remplacées visuellement par les numéros ; la liste complète reste lisible.
5. Avec réduction des animations ou contrôle désactivé, aucune parallaxe ni scène épinglée ne reste active.

## Vérification et limites

Contrôles statiques effectués : syntaxe JavaScript, unicité des identifiants, résolution de toutes les ancres, huit repères/adresses, absence de script/style distant et de formulaire. Le rendu à 320 px, les images et le contrôle global doivent être vérifiés dans l’aperçu assemblé par l’équipe ; ils ne sont pas déclarés validés visuellement ici. Les médias et les polices sont des ressources locales existantes servies à la racine. Cette piste n’altère pas le site actuel.
