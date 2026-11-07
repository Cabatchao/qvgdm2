# Réception privée des candidatures — 7 novembre 2026

## But et première version

Un candidat au réseau Pizza Zio dans le Nord transmet son projet. Maxence et le directeur doivent retrouver un seul dossier privé et recevoir une notification interne. Le candidat ne doit voir une confirmation qu'après la persistance de son dossier. La réception dans Sheets est implémentée ; les identifiants et le raccordement de production restent à valider. Le module de notification Apps Script est désormais préparé et testé localement ; il n'est pas déployé, autorisé ou activé dans Google.

## Boucle de correction de la réception

| Action effectuée | Résultat attendu | Résultat observé et correction |
| --- | --- | --- |
| Exécuter le vrai SDK Google avec son transport HTTP remplacé par une simulation, puis observer l'échange OAuth et les requêtes Sheets | Chaque requête bénéficie d'un délai maximal et refuse les redirections | Le test initial échoue : la requête OAuth n'a aucun signal d'annulation. Le délai de la seule requête Sheets ne couvre pas le jeton demandé auparavant. |
| Rejouer exactement le même test après correction | OAuth, vérification des en-têtes, écriture et éventuelle relecture restent bornés | Test réussi après ajout des options au transport partagé : budget global de 12 secondes, délai individuel de 8 secondes, redirections interdites, aucune relance automatique cachée. |
| Simuler OAuth indisponible | Aucun dossier transmis, aucun réessai invisible | Un seul échange OAuth ; aucune requête Sheets. |
| Simuler un jeton OAuth qui ne répond jamais | Annulation effective avant écriture | Le signal annule effectivement la requête au délai individuel ; aucun appel Sheets. |
| Simuler une perte de réponse après l'écriture | Relire le reçu, sans effectuer une seconde écriture | Une écriture puis relecture confirmée par référence et empreinte. |
| Envoyer 20 tentatives concurrentes de la même référence, puis changer son contenu | Un seul dossier ; refus du contenu différent | Un seul enregistrement dans le modèle atomique du récepteur ; conflit refusé. |
| Retourner un reçu absent, plusieurs lignes de même référence ou une empreinte différente | Aucune confirmation de persistance | Les trois cas sont refusés. |

## Vérification et limites

Les tests de `tests/sheet-receiver.test.ts` utilisent des données fictives. Les tests SDK exécutent réellement `google-auth-library`, la génération du JWT et la sérialisation HTTP, mais le transport HTTP est simulé : aucun service Google, compte email ou destinataire réel n'est contacté. La concurrence de l'écriture atomique est simulée, elle ne constitue pas un nouveau test de concurrence contre Google Sheets. Le test d'expiration utilise le vrai signal d'annulation et son vrai délai.

La vérification TypeScript a réussi après la modification du transport. La contre-revue sécurité est effectuée séparément par un autre agent. Les garde-fous d'ouverture, les valeurs légales et le design ne sont pas modifiés.

## Notification et raccordement restant à effectuer

Le contenu recommandé pour la notification est une référence de candidature et un lien vers le tableau privé, sans recopier le projet ni les coordonnées du candidat. La destination est fixée côté serveur, après confirmation de l'adresse privée par Maxence ; elle ne peut pas être fournie par le formulaire public.

Le module retenu est `integrations/google-apps-script/Code.gs`, lié au classeur privé, avec `MailApp` et un déclencheur temporel de cinq minutes. L'envoi est indépendant du reçu candidat et porte seulement sur une référence déjà dans Sheets. Un journal séparé conserve l'intention d'envoi avant l'appel mail ; un envoi incertain passe en `a_verifier` sans renvoi automatique. Il ne promet pas l'envoi exactement unique malgré une panne. Le quota est contrôlé avant de marquer une nouvelle intention. Aucun service d'email de production n'est actuellement activé ou validé.

La première passe des tests de notification a réussi neuf scénarios. La contre-revue indépendante a demandé de compléter les tests par une perte de confirmation après acceptation réelle simulée du mail et une panne de flush après envoi. Les deux cas supplémentaires passent : un seul mail accepté dans le double, statut `a_verifier`, aucun second mail au passage suivant. Les onze tests de notification utilisent une VM et des doubles des services Google ; aucun email réel n'est envoyé. L'installation ignore l'historique, n'envoie rien, conserve un seul déclencheur pour son opérateur et ne modifie aucun partage. Le destinataire est uniquement configuré dans les propriétés privées du script.

Avant ouverture : choisir l'hébergement effectif et sa protection contre les abus, configurer l'identité de service Sheets dédiée et le classeur privé, confirmer le destinataire interne et la voie d'envoi, puis tester une candidature de bout en bout sur l'environnement retenu. Il faut vérifier la ligne réelle, le reçu candidat, la notification effectivement reçue et les droits de lecture des deux responsables. Les informations légales et la politique de confidentialité doivent aussi être complétées avant d'ouvrir la collecte.
