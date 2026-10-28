# Pizza Zio — conduite du lancement

État de préparation au 28 octobre 2026. Ce document organise le travail ; il ne constitue pas une preuve de mise en production. La version GitHub de départ date du 27 mai 2026. Son lien avec le site Vercel historique doit être établi avant un remplacement de ce site.

## Décision actuelle

La collecte est fermée par défaut. Le serveur doit exiger la disponibilité métier (`PUBLIC_COLLECTION_READY`) et la disponibilité de son raccordement technique. Un paramètre technique seul ne doit jamais ouvrir le formulaire.

Les chiffres du fichier historique `data/franchiseData.ts` ne suffisent pas à établir leur actualité. Le nombre d’implantations, les conditions financières, la disponibilité territoriale et tout délai de réponse doivent être reconfirmés par l’équipe Pizza Zio avant réintroduction dans une campagne.

## Hypothèses de cible à valider

**Aucun segment n’est encore confirmé par des résultats de recrutement ou de campagne Pizza Zio.** Le message commun invite des porteurs de projet en activité, en reconversion ou déjà indépendants à présenter leur parcours et leur envie de préparer une pizzeria. Ce positionnement est une hypothèse de communication ; les critères d’admission restent à confirmer par l’équipe Pizza Zio.

Comparer des responsables de restauration ou de commerce alimentaire, des managers en reconversion venant d’autres secteurs et, si le réseau accepte ce type de projet, des indépendants. Le premier groupe reste une variante d’essai fondée sur la proximité supposée des tâches ; ce n’est pas une cible prouvée supérieure aux autres. Un horizon de préparation de six à douze mois reste également une hypothèse, pas une condition d’éligibilité.

Le message doit inviter à préciser le rôle souhaité dans l’établissement, le service, l’équipe et la préparation du projet. L’expérience sert à conduire un échange humain ; elle ne crée pas un droit automatique à une franchise et son absence ne déclenche pas un rejet automatique. Un manager salarié peut avoir dirigé une équipe sans avoir créé d’entreprise : encourager cette précision dans le champ de motivation, sans utiliser la création passée d’une entreprise comme prérequis.

La [note sur les preuves et la validation de la cible](pizza-zio-cible-preuves.md) distingue sources officielles, inférences métier et tests à conduire. Les simulations logicielles ne valident pas une demande commerciale réelle.

Commencer sur **une seule zone réellement ouverte**, validée par le réseau. Lille et Dunkerque figurent dans le document historique ; leur disponibilité n’est pas établie. Aucun seuil d’apport personnel n’est inventé. Un montant d’investissement total ne doit pas être présenté comme l’apport exigé.

## Les validations nécessaires pour ouvrir

| Responsable à désigner | Validation concrète | Preuve attendue |
| --- | --- | --- |
| Direction du réseau | Territoire et profil réellement recherchés | Zone écrite dans `launchConfig.operations.availableTerritories` |
| Direction / responsable légal | Identité de l’éditeur, contacts, immatriculation, TVA applicable, directeur de publication, hébergeur | Mentions complètes et validées |
| Responsable des données | Finalité, base légale adaptée, données minimales, destinataires, durée, transferts, droits et traitement technique | Notice complète dans `launchConfig.privacy` et validation consignée |
| Responsable candidatures | Qui traite les demandes, par quel canal écrit, et qui le remplace | Responsable opérationnel et procédure de remplacement convenus |
| Référent technique | Raccordement, protection, limitation du débit, confirmation après enregistrement, gestion des doublons | Recette complète sur un environnement de test |
| Décideur du lancement | Accord sur les contenus et la disponibilité du traitement | `launchConfig.approved = true` seulement après validations précédentes |

Une valeur « à confirmer », un simple écran de confirmation ou un HTTP 200 isolé ne valent pas validation. Les mentions non applicables (par exemple une information fiscale selon la situation réelle) doivent être documentées comme telles après vérification ; ne pas les supprimer artificiellement pour franchir la garde.

## Traitement écrit d’une candidature

1. Le candidat reçoit une confirmation uniquement après l’accusé de réception conforme du système destinataire. En cas d’erreur, conserver sa saisie et afficher une possibilité de réessai ; ne pas prétendre qu’un dossier est enregistré.
2. Le système destinataire conserve le dossier, sa référence technique, la date, la version de notice et les informations utiles à l’étude. L’identifiant d’idempotence évite qu’un réessai crée un second dossier.
3. Le responsable consulte les nouvelles demandes chaque jour ouvré selon une organisation à confirmer. Cette cadence est interne et ne constitue pas une promesse publiée.
4. Il vérifie la zone, l’expérience opérationnelle, la présence prévue dans l’établissement, le calendrier et les informations budgétaires déclarées. Il répond d’abord par écrit. Le téléphone n’est pas demandé pour imposer un appel.
5. Il attribue un statut humain : `à étudier`, `informations manquantes`, `échange engagé`, `en pause` ou `clos`. Chaque statut doit avoir une prochaine action, un responsable et une échéance interne.
6. Il ne demande pas de pièce d’identité, de justificatif bancaire ou d’information sensible par ce formulaire initial. Les étapes documentaires ultérieures nécessitent un canal adapté et une nécessité établie.
7. Il applique la conservation et la suppression réellement approuvées. Aucun dossier ne reste conservé indéfiniment par défaut.

La première version n’a pas besoin de chatbot, d’enrichissement automatique ou de décision par IA pour démarrer. Une file fiable et un responsable disponible sont prioritaires.

## Recette avant communication

| Scénario | Résultat attendu |
| --- | --- |
| Configuration métier incomplète | Formulaire fermé et refus côté serveur |
| Raccordement absent ou indisponible | Aucun faux succès, aucune perte de saisie côté navigateur |
| Demande valide | Un seul dossier durable, confirmation uniquement après ACK attendu |
| Double clic ou réessai réseau | Pas de doublon chez le destinataire |
| Montants comme `30k` ou format ambigu | Explication claire ; pas de conversion silencieuse en un autre montant |
| Champs obligatoires absents, taille excessive, valeurs non admises | Rejet contrôlé et message exploitable |
| Origine étrangère, robot, rafale | Protection effective sans fuite d’informations |
| Navigation clavier, téléphone, mouvement réduit | Formulaire et navigation utilisables ; libellés/erreurs accessibles |
| Responsable absent | Remplacement opérationnel ou arrêt de la collecte et des campagnes |

Les tests de démonstration n’utilisent que des identités fictives. Ne pas envoyer de faux dossiers dans une vraie file d’exploitation. Après branchement, faire une recette coordonnée et supprimer la donnée de test selon la procédure convenue.

## Première campagne et boucle d’amélioration

Les canaux et le budget restent à valider. Une expérience de départ possible : un seul canal, une seule zone, deux textes qui distinguent l’intention du candidat. Commencer par une diffusion organique sur les comptes possédés et autorisés ; une campagne payante vient après la recette et la disponibilité du responsable.

Une enveloppe optionnelle de 300 € sur dix jours est un test, pas une prévision de résultats. Aucune dépense n’est autorisée par ce document. Si une campagne est créée, employer un plafond total lorsque l’outil le permet : un budget journalier moyen de 30 € ne garantit pas un plafond strict de 300 €.

À chaque cycle : constater → corriger un problème prioritaire → retester → comparer. Arrêter immédiatement l’acquisition en cas de perte de dossier, panne de réception ou absence de traitement. Réexaminer ensuite la qualité des demandes avant d’augmenter le budget. Ne pas optimiser seulement le nombre de formulaires envoyés.

## Mesures utiles

| Indicateur | Source / calcul | Décision permise |
| --- | --- | --- |
| Demandes durablement reçues | Accusés de réception / dossiers dédupliqués | Vérifier la réception réelle |
| Échecs de transmission | Compteurs techniques agrégés, sans contenu du formulaire | Corriger disponibilité ou contrat d’API |
| Demandes étudiées | Statut attribué par le responsable | Vérifier la capacité de traitement |
| Projets compatibles avec la zone | Vérification humaine | Ajuster le ciblage territorial |
| Échanges écrits engagés | Réponse utile reçue du candidat | Mesurer la qualité du contact |
| Coût par échange utile | Dépense réelle / échanges utiles ; non calculable si zéro | Décider du test suivant |

Ne jamais transmettre nom, email, téléphone, message, ville saisie librement ou montant à un outil publicitaire par URL, événement ou journal. Les métriques envisagées ne sont pas déjà installées. L’ajout ultérieur de traceurs demande sa propre décision et les mécanismes requis ; pas de pixels publicitaires par défaut.

## Suite ordonnée

1. Finaliser les validations et raccorder la réception.
2. Tester un parcours réel de bout en bout sans campagne.
3. Confirmer l’environnement destiné au public, le domaine et la possibilité de retour arrière.
4. Ouvrir la collecte, contrôler le premier dossier et sa prise en charge.
5. Publier les textes validés, puis exécuter la première boucle de mesure.
