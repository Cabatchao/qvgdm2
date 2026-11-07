# Pizza Zio · Recette du recrutement dans le Nord
3 novembre 2026

## État de la version

L’accueil reprend la présentation du 30 octobre, avec le film et son affiche, les deux formats confirmés et la zone Nord (59). Le dossier sera traité par Maxence avec le directeur de Pizza Zio. L’ouverture technique et l’indexation sont indépendantes et fermées par défaut. L’adresse personnelle de suivi n’est ni un champ public de configuration, ni un contact à publier. Un contact officiel de l’enseigne reste à valider pour les mentions publiques.

Les chiffres financiers et le nombre actuel de franchisés restent à valider auprès de l’enseigne. Les anciennes valeurs ne figurent plus dans les données publiques du site. Pour le candidat, les informations les plus utiles à obtenir sont les villes réellement ouvertes, l’apport indicatif et l’investissement total pour chaque format.

## Parcours et règle de vérification

Un candidat souhaite exploiter une pizzeria dans le Nord. Il découvre les formats, prépare sa ville, son calendrier et son projet, puis transmet ses coordonnées. L’équipe doit pouvoir retrouver un seul dossier et assigner un responsable. Le reçu affiché par le navigateur doit désigner ce dossier.

| Action | Attendu | Observation et correction |
| --- | --- | --- |
| Simuler une panne avant l’écriture | Message d’échec, saisie conservée, zéro dossier | Vérifié en intégration locale avec le navigateur et une base isolée. |
| Perdre la réponse après l’écriture et recommencer | Même référence, un dossier | Vérifié avec HTTP, Redis et SQLite réels en local. |
| Deux envois identiques vers Google Sheets | Un seul dossier privé | Vérifié sur un classeur Google réel avec les requêtes générées par l’adaptateur. La seconde écriture atomique a été refusée. La ligne relue correspondait à la référence et à l’empreinte initiales. La ligne fictive et son marqueur ont été retirés. L’identité Google utilisée pour cette opération était celle de la session de recette. |
| Une saisie commence par un signe égal | Texte littéral dans Sheets | Une candidature fictive commençant par ce caractère est revenue en texte brut à la relecture. |
| Un même expéditeur insiste après son quota | Un autre candidat peut encore déposer son projet | Avant correction, l’expéditeur bloqué épuisait le quota global. Après correction, le candidat suivant est accepté avec les mêmes paramètres. |
| Un candidat ignore encore certaines réponses | L’expérience inconnue reste inconnue | Quatre précisions secondaires devenues facultatives, sans transformer une absence de réponse en « Non ». |
| Un visiteur consulte la page sur téléphone | Pas de film chargé d’office | Vérifié avec Chromium sur la compilation avec médias. L’affiche reste visible et la lecture est volontaire. |
| Le lecteur d’écran annonce la commande vidéo | Le nom annoncé correspond au texte visible | Le premier test mobile a détecté une divergence. La commande utilise maintenant son texte visible. |

## Résultats de la recette technique

La compilation de production a passé 53 tests serveur, 10 tests du formulaire, 24 tests navigateur sur mobile et ordinateur et 9 scénarios d’intégration. Les 22 contrôles HTTPS supplémentaires ont été exécutés sur le serveur local de recette. Sur les pages légales, le navigateur interrompait une requête de préchargement. Après correction des liens, la navigation a réussi au même contrôle.

Sur trois chargements mobiles simulés à froid, le contenu principal s’est affiché en 1,55 à 1,70 seconde, avec un décalage visuel cumulé inférieur à 0,006 et sans téléchargement automatique de la vidéo. Ces mesures portent sur la compilation avec les médias privés. Le premier audit des dépendances de production n’a signalé aucune vulnérabilité connue. L’audit complet initial avait relevé onze entrées modérées dans les outils de développement.

## Contre-vérification du 3 novembre

| Test effectué | Écart observé | Résultat après correction |
| --- | --- | --- |
| Choisir un format depuis le premier écran | Aucun raccourci vers la comparaison sur mobile. | Le lien « Comparer les deux formats » amène aux cartes à 320, 390 et 1 440 px. |
| Ouvrir la rubrique projet sur un écran de 320 × 568 px | L’explication de fermeture débutait à 843 px du haut de l’écran de destination. | Le texte débute à 243 px et tient au premier écran après le clic. |
| Préparer une candidature à Lille puis consulter les pages légales | 17 champs utilisateur visibles et sortie du formulaire possible depuis le pied de page. | 8 champs visibles, 9 précisions dépliables. L’ouverture des deux pages légales au clavier préserve les informations dans l’onglet du formulaire. |
| Perdre la réponse après écriture, modifier la saisie puis réessayer | Une nouvelle référence pouvait créer deux dossiers. | En cas d’envoi incertain, le bouton de vérification reprend les valeurs et la référence initiales. Un dossier avant et après le réessai. |
| Envoyer depuis 100 adresses IPv6 du même sous-réseau, puis depuis un réseau indépendant | Le premier réseau épuisait le quota général. | Cinq essais du premier réseau ont été acceptés, 95 refusés. L’autre candidat a reçu une confirmation. |
| Exporter dans une destination contenant un fichier témoin ou interrompre l’export | Un ancien fichier pouvait être republié. | Une destination non vide est refusée. Une interruption laisse la destination finale vide. Le déploiement reprend uniquement les fichiers du nouvel export. |

Le nouvel audit npm a signalé zéro vulnérabilité connue après correction de `minimatch` pour les outils de développement. Le contournement par rotation IPv6 a été testé avec Redis local. Les pertes de confirmation et les doubles requêtes ont été testées avec un récepteur local persistant. Le scénario d’ajout dans Google Sheets a été vérifié séparément. Les essais navigateur automatisés utilisent Chromium. La conversion commerciale, Safari sur iPhone physique et les notifications de la future production restent à mesurer.

## Préparer l’environnement destiné au public

1. Confirmer le domaine, le projet d’hébergement et l’éditeur juridique. La marque a validé le Nord et les formats. Le site officiel identifie SARL AMM pour son propre site. L’identité juridique et l’hébergeur de cette nouvelle landing doivent être confirmés séparément.
2. Choisir un contact public de l’enseigne pour les droits et les mentions, les destinataires autorisés, la durée de conservation et une procédure de suppression. Renseigner les valeurs approuvées dans `data/launchConfig.ts`. Ne saisir aucun email personnel de suivi dans ce fichier.
3. Sur le projet serveur, choisir `LEAD_DESTINATION=google_sheets`. Configurer `LEAD_SHEET_ID`, le numéro exact de l’onglet dans `LEAD_SHEET_TAB_ID`, `LEAD_SHEET_CLIENT_EMAIL` et `LEAD_SHEET_PRIVATE_KEY` via le coffre de l’hébergeur. La clé appartient à une identité de service dédiée et n’est jamais transmise au navigateur. Activer l’API Google Sheets dans le projet Google correspondant. Limiter les droits d’écriture de cette identité au classeur dédié. Le tableur doit utiliser les 25 en-têtes de `lib/sheetReceiver.ts`, dans le même ordre. Son partage général reste restreint.
4. Définir l’origine HTTPS exacte, le Redis REST dédié, ses identifiants et le secret HMAC. Ne pas mélanger secrets de production et de recette. Sur une autre plateforme que Vercel, le limiteur utilise un quota réseau partagé jusqu’à adaptation et vérification du proxy de confiance.
5. Utiliser un environnement de recette avec tableau distinct et données fictives avant d’activer le domaine public. Depuis un téléphone, soumettre une fois, rejouer la même tentative et couper le récepteur. Vérifier les références, le nombre de lignes et les erreurs côté candidat. Vérifier que le responsable peut ouvrir le tableau. Valider séparément toute notification sur la boîte privée retenue. Supprimer les données de recette.
6. Après ces preuves, activer les indicateurs de validation et la collecte. Sur le domaine public uniquement, passer `LEAD_INDEXING_ENABLED` à `true`. Effectuer à nouveau le test convenu avec l'équipe. Pour fermer immédiatement la collecte, désactiver `LEAD_INTAKE_ENABLED` et appliquer la configuration sur l’hébergeur. Vérifier le retour HTTP 503 et l’absence de formulaire sur l’accueil.

## Exploitation à deux

Le tableau affiche le statut, le responsable, la prochaine action et son échéance. À chaque nouvelle candidature, une personne s’attribue le dossier, vérifie la ville et prépare un premier échange écrit. Le PDF pourra servir à un dossier présélectionné. Une alerte mail privée peut transmettre la référence et un lien interne après vérification de sa destination. L’application ne transmet pas de courriel dans cette version.

Conserver des accès nominatifs. Un tri porte sur la ligne entière. La colonne technique Empreinte doit rester intacte. Pour une suppression, retirer la ligne ainsi que la plage nommée associée `Zio_` suivie de l’UUID sans tirets, et appliquer la politique de conservation aux éventuelles copies. Le tableau doit être dédié aux candidatures. Éviter les cellules libres de calcul et les tableaux annexes dans l’onglet de réception.

Les premières mesures commerciales sont le nombre de dossiers reçus, les dossiers correspondant au territoire et les premiers échanges effectivement tenus. Tenir ces étapes dans le tableau permet de les mesurer sans traceur publicitaire. Le taux de conversion visite → candidature, les performances réelles des visiteurs et le coût d’acquisition restent à mesurer après ouverture.

## Médias et aperçu

La présentation peut être compilée avec les photographies publiques déjà présentes dans le dépôt. Pour reproduire exactement l’aperçu cinéma, copier depuis le répertoire `dist` du dépôt de l’aperçu privé les six WebP `images/zio-{hero,dining,terrace}-v2{,-mobile}.webp` vers `public/images`, et `video/zio-cuisine.mp4` vers `public/video`. Activer `PIZZA_ZIO_VISUAL_PACK=1` au build et à l’exécution. L’absence d’un fichier requis arrête le build. Les médias additionnels restent dans le projet privé. Les droits d’utilisation publique des médias et polices sont à confirmer avant la publication.

L’ancien domaine Vercel répondait en HTTPS pendant la recette. Son HTML contenait un formulaire distinct et son code de confirmation contrôlait uniquement que la réponse HTTP était positive. Il affichait également une promesse de réponse sous 48 heures. Le contrôle du projet historique n’a pas été retrouvé dans l’espace Vercel connecté. Ne pas y orienter une campagne avant d’en avoir vérifié le destinataire, les conditions et le raccordement.

## Sources

- [Page franchise de l’enseigne](https://pizza-zio.fr/devenir-franchise/)
- [Mentions du site historique de l’enseigne](https://pizza-zio.fr/mentions-legales/)
- [Modèles de mentions d’information de la CNIL](https://www.cnil.fr/fr/les-modeles-de-mentions-dinformation)
- [Écritures atomiques de Google Sheets](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)
