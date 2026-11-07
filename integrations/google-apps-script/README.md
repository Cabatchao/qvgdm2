# Notifications privées Pizza Zio

**État : préparé et testé localement ; non déployé, non autorisé, non activé dans Google. Aucun email réel envoyé.** Ce module complète la réception Sheets ; il ne raccorde pas le serveur au tableau et n'ouvre pas le formulaire public.

## Installation unique, sans terminal

1. Avec le compte propriétaire du tableau privé, ouvrir le classeur de candidatures puis **Extensions → Apps Script**. Le script doit être lié à ce classeur, pas créé comme projet autonome.
2. Copier `Code.gs`. Dans les paramètres du projet, afficher le manifeste puis recopier `appsscript.json`.
3. Dans **Paramètres du projet → Propriétés du script**, créer `LEAD_NOTIFICATION_EMAIL` avec l'adresse privée destinataire déjà confirmée. Ne jamais placer cette adresse dans le code public. Ne pas créer ni modifier les propriétés internes `ZIO_*`.
4. Vérifier que l'onglet `Candidatures` est bien celui destiné au site, avec les 25 en-têtes attendus dans leur ordre. L'onglet `Notifications` est réservé à ce module.
5. Exécuter explicitement **`installNotifications`** et autoriser les permissions affichées : classeur lié, envoi d'emails et gestion du déclencheur. Cette exécution marque les références déjà présentes comme `historique_ignore` et **n'envoie aucun email**. Elle active ensuite un déclencheur toutes les cinq minutes. Une seconde installation par le même compte ne crée pas de second déclencheur et ne réinitialise pas l'historique.
6. Effectuer le test de réception complet ci-dessous avant de déclarer le circuit opérationnel.

Un seul opérateur de confiance installe le déclencheur : le propriétaire du classeur. Les éditeurs du classeur peuvent aussi modifier son script lié : limiter ces accès aux responsables autorisés. Les emails partent avec le compte d'exécution du déclencheur. Le destinataire peut être un autre compte ; recevoir l'alerte ne lui donne aucun droit sur le tableau. Utiliser le compte propriétaire pour consulter le lien tant qu'aucun partage nominatif supplémentaire n'a été décidé. Ce code ne modifie aucun partage et ne lit aucune boîte Gmail.

## Parcours vérifiable

Après installation, soumettre une candidature **fictive** par le futur site de recette raccordé au tableau. Résultat attendu : une seule candidature persistée, confirmation du site portant la même référence, puis un email privé contenant uniquement cette référence et le lien du tableau. Après un second passage du déclencheur et un réessai du dépôt, le tableau et la boîte destinataire ne doivent contenir qu'un dossier et qu'une notification pour cette référence. Vérifier la réception réelle ; un retour positif de `MailApp` ne prouve pas la présence en boîte de réception.

L'automatisation lit les 25 en-têtes, puis seulement les références de la colonne A. Elle ne copie ni nom, ni email candidat, ni budget, ni texte du projet dans les notifications ou le journal. Elle ne modifie jamais l'onglet `Candidatures`.

## Erreurs et exploitation

- **Quota épuisé** : aucune intention d'envoi n'est enregistrée pour les nouvelles références ; elles seront reprises quand le quota revient.
- **`en_cours`** : intention enregistrée et appliquée avec `SpreadsheetApp.flush()` avant envoi. Si une exécution est interrompue, le passage suivant transforme ce statut en `a_verifier`.
- **`envoye`** : le service d'envoi a répondu et le journal a été mis à jour. Cela ne garantit pas la délivrabilité en boîte de réception.
- **`a_verifier`** : ne pas renvoyer automatiquement. Rechercher manuellement la référence dans la boîte destinataire et vérifier l'historique d'exécution. Une reprise manuelle n'est envisagée qu'après vérification de l'absence d'envoi ; ne jamais effacer tout le journal.
- **Arrêt** : passer `LEAD_NOTIFICATIONS_ENABLED` à `false` dans les propriétés du script. Les passages suivants n'envoient rien. Une nouvelle exécution explicite de `installNotifications` réactive le module.
- **Erreur `ZIO_*`** : corriger la configuration, les en-têtes ou le journal avant reprise. Un journal absent après installation est refusé, jamais recréé silencieusement.

Un verrou empêche deux passages simultanés. Chaque passage envoie au maximum cinq notifications et lit au maximum 10 000 références et 10 000 lignes de journal ; au-delà, le traitement s'arrête pour révision. Les déclencheurs installés par d'autres comptes ne sont pas visibles par le compte courant : ne pas répéter l'installation avec un autre compte. Le verrou et le journal restent une seconde protection.

**Limite assumée :** un email et une mise à jour Sheets ne sont pas une transaction atomique. Une panne après l'envoi mais avant sa confirmation impose une vérification humaine. Le module ne promet pas un envoi « exactement une fois » et privilégie l'absence de renvoi automatique ambigu. Les références du journal restent des identifiants de candidatures : appliquer la politique de conservation également à ce journal, après avoir retiré les candidatures concernées.

## Tests et preuves

`tests/email-notification.test.ts` exécute le vrai `Code.gs` dans une VM Node avec des doubles de Sheets, MailApp, propriétés, verrous et déclencheurs. Les scénarios couvrent historique ignoré, installation répétée, payload minimal, absence de doublon, panne mail, interruption, flush défaillant, verrou, lot de cinq, quota, destinataire invalide et en-têtes modifiés. Aucun réseau Google ou service de messagerie n'est contacté.

Commande locale : `node --conditions=react-server --import tsx --test tests/email-notification.test.ts`.

Sources officielles : [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app), [déclencheurs installables](https://developers.google.com/apps-script/guides/triggers/installable), [quotas](https://developers.google.com/apps-script/guides/services/quotas), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service). Les écritures par l'API Sheets ne déclenchent pas `onEdit` : le déclencheur est donc temporel. Les quotas Google restent à surveiller après activation.
