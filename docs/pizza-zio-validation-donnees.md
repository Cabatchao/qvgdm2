# Pizza Zio — validations des données et notice

Dernière vérification documentaire : 28 octobre 2026. Cette liste aide à préparer la validation par les personnes responsables ; elle ne certifie pas à elle seule la conformité du dispositif.

## Configuration versionnée

`data/launchConfig.ts` contient uniquement des informations destinées à être publiques et les validations opérationnelles. Les clés API, jetons du destinataire, candidatures et identifiants privés n’y ont pas leur place.

`getLaunchReadiness` refuse les champs vides et les marqueurs « à confirmer ». `PUBLIC_COLLECTION_READY` exige également `approved`, au moins un territoire confirmé, un responsable de suivi écrit confirmé et une réception testée. Les pages `/mentions-legales` et `/confidentialite` présentent un état de préparation tant que les faits ne sont pas approuvés.

## Informations à obtenir

| Ensemble | Contenu à confirmer |
| --- | --- |
| Éditeur | Identité juridique complète adaptée au statut, siège, immatriculation, TVA applicable, email, téléphone, directeur de publication |
| Hébergement | Entité qui héberge effectivement cette version, adresse et téléphone |
| Responsable du traitement | Identité et adresse de l’organisme qui détermine les usages des candidatures |
| Données | Champs réellement transmis et nécessité de chacun, champs facultatifs, informations techniques de sécurité |
| Finalité et base légale | Étude de candidature et réponse ; base légale choisie et documentée pour ce traitement précis |
| Destinataires | Équipe habilitée, hébergeur et prestataires réellement utilisés, notamment CRM ou automatisation |
| Conservation | Durée ou critères concrets, point de départ, clôture, suppression et éventuel archivage justifié |
| Transferts | Localisation et accès réels ; garanties pertinentes s’il y a transfert hors EEE |
| Droits | Droits adaptés à la base légale et contact qui traite effectivement les demandes |
| Technique | Journaux, protections contre les abus, hébergeur, éventuels cookies/traceurs et leurs durées/conditions |

La lecture d’une notice n’est pas en elle-même un consentement publicitaire. Ne pas ajouter automatiquement un candidat à une newsletter. Le consentement n’est pas systématiquement la base légale appropriée à une demande de contact : le responsable doit retenir et documenter celle qui correspond à l’usage réel.

## Sources officielles consultées

- [CNIL — Informer les personnes](https://www.cnil.fr/fr/informer-les-personnes) : rendre l’information accessible et compréhensible, expliquer les usages, obligations et droits ; tenir compte des éventuels transferts ou traitements automatisés.
- [CNIL — Exemples de formulaire de collecte](https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel) : exemples à adapter à la situation réelle, notamment responsable, finalité, base légale, destinataires, conservation et contact.
- [Service Public Entreprendre — Mentions obligatoires sur le site internet d’une entreprise](https://entreprendre.service-public.gouv.fr/vosdroits/F37351?lang=fr), page vérifiée le 13 octobre 2026 : identification de l’entreprise et de l’hébergeur, obligations variant selon la situation et information sur les données personnelles.

L’identité de l’hébergeur ne se déduit pas du nom du dépôt GitHub. Le nom commercial Pizza Zio n’établit pas à lui seul la société éditrice ou le responsable de traitement.

## Historique d’approbation à compléter avant ouverture

- Date de validation : à confirmer par l’équipe Pizza Zio.
- Fonction responsable de la validation : à confirmer par l’équipe Pizza Zio.
- Territoire retenu : à confirmer par l’équipe Pizza Zio.
- Référence de la recette de réception : à confirmer par l’équipe Pizza Zio.
- Version de notice approuvée : à confirmer par l’équipe Pizza Zio.

Après modification de la finalité, des champs, du destinataire ou d’un prestataire, réexaminer la notice et augmenter `PRIVACY_NOTICE_VERSION`. Maintenir une trace de la version associée à chaque candidature selon la politique validée.
