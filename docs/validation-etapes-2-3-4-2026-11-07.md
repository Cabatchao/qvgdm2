# Pizza Zio — réception, recette et préparation de publication

État du 7 novembre 2026. Le design principal est conservé et l’aperçu privé est publié en version 10. Les variantes visuelles ne sont pas réintroduites. Le serveur de candidatures reste à déployer et à raccorder ; la publication statique ne valide pas la réception réelle des dossiers ni des emails.

## Dernière boucle avant publication

Deux écarts ont été corrigés : le texte mentionnait encore le directeur alors que Maxence est le seul responsable initial ; le serveur acceptait deux anciens formats de livraison absents de l'offre actuelle. Les deux refus ont été testés en échec avant correction puis en réussite, avec HTTP 422 et aucun appel sortant. Les formats « À emporter », « Avec restaurant » et le choix indécis restent acceptés dans la recette isolée.

La passe intégrée après ces corrections compte **67 tests serveur/sécurité/réception/notification/export et 13 tests de composants réussis, zéro échec**. La compilation de production avec les médias conservés et l'export statique réussissent. Les essais Google et email restent simulés ; les résultats HTTP locaux des passes antérieures ci-dessous ne sont pas de nouveaux essais distants.

Les quatre scénarios HTTP de sécurité ont aussi été rejoués avec succès sur ce nouveau build local `3cTP6Q6rv4ATkHCwxeDPJ` : en-têtes et nonces serveur, refus de collecte/CORS, fichiers sensibles et scripts navigateur. Le serveur a été arrêté après les tests. Cette passe sur localhost est distincte des contrôles HTTPS du Site statique.

La version privée 10 a ensuite passé **33 contrôles HTTPS réels** : trois pages, sept chemins sensibles refusés, POST de collecte refusé, seize ressources identiques, film identique et cinq accès anonymes refusés en 401. Une première passe avait échoué sur l'absence d'en-tête de taille du film ; le vérificateur a été adapté pour comparer le fichier avec une lecture bornée, puis la même recette complète a réussi. Détails dans `docs/recette-deploiement-2026-11-07.md`.

## Objectif et résultat attendu

Un candidat dans le Nord présente son projet. Il doit recevoir une confirmation uniquement après l’enregistrement durable d’un dossier. Maxence est le seul responsable humain autorisé à consulter et traiter les candidatures dans cette première phase. Aucun accès au directeur ou à un autre collaborateur ne doit être ajouté sans nouvelle demande explicite. Une notification ne doit contenir que sa référence et le lien privé, jamais les coordonnées, le budget ou le texte du candidat.

La première version conserve le suivi humain. La collecte publique reste fermée tant que les informations légales, la réception réelle et l’accès des responsables ne sont pas validés. Aucun numéro, contact public ou renseignement juridique n’a été inventé pour contourner ce blocage.

Cas de référence : envoyer une candidature fictive, perdre la réponse, puis réessayer avec la même référence. Attendu : une seule ligne et une confirmation correspondant à cette ligne. Une panne avant écriture doit conserver la saisie sans annoncer un succès.

## Étape 2 — réception et notification

- Le tableau existant a été retrouvé par le connecteur Google Drive. Sa première ligne correspond exactement aux 25 colonnes attendues par l’adaptateur. Après la demande de liaison à l’adresse de notification, les permissions ont été relues : uniquement les deux comptes de Maxence, l’un propriétaire et l’autre éditeur. Aucun partage public, de domaine ou avec le directeur. Les adresses restent hors du dépôt public.
- Le destinataire privé des alertes a été confirmé par l’utilisateur. Son adresse n’est pas inscrite dans ce dépôt public, dans le site ou dans ce compte rendu.
- Défaut reproduit puis corrigé : l’obtention du jeton OAuth Google échappait au délai maximal. Le transport OAuth et Sheets partage maintenant un budget de 12 secondes, avec 8 secondes par requête, sans redirection ni réessai implicite. Les tests du vrai SDK avec HTTP simulé passent.
- Une notification liée au classeur est préparée dans `integrations/google-apps-script`. Ses 11 tests locaux passent, y compris les deux cas ajoutés après la contre-revue de sécurité : email accepté puis accusé perdu, et échec du journal après envoi. Ces cas restent à vérifier manuellement et ne sont pas renvoyés automatiquement. Le module nécessite une installation et une autorisation Google explicites avant d’être actif. Il ne constitue pas le raccordement du serveur au tableau.
- Aucun email réel n’a été envoyé et aucune nouvelle candidature n’a été ajoutée au tableau pendant cette passe. L’identité de service Google et le limiteur Redis de production restent à configurer dans l’hébergement retenu.

## Étape 3 — parcours complet de recette

La recette HTTP utilise une copie temporaire de Next.js compilée, un Redis authentifié et SQLite avec stockage durable. Les 15 scénarios passent, dont réponse perdue ou mensongère, double requête simultanée, conflit de contenu, pannes puis rétablissement, quotas et requêtes invalides. Les services et données fictives sont supprimés en fin de recette.

Les 13 tests du formulaire passent séparément. Ils utilisent JSDOM ; ils ne représentent pas un nouveau passage sur Safari ou un téléphone physique. Aucun de ces résultats ne prouve encore la réception par Google Sheets et l’email de production.

Le démarrage du navigateur local par l’outil de prévisualisation a échoué : celui-ci ajoute `--host` et `--strictPort`, que le serveur Next.js existant n’accepte pas. L’application n’a pas été modifiée pour contourner cette limite d’outillage. La recette navigateur de cette passe reste non exécutée.

## Étape 4 — sécurité et déploiement

- Compilation de production et TypeScript réussis.
- Passe finale intégrée : 64 tests serveur/sécurité/Sheets/notification/export et 13 tests du formulaire réussis. Les essais Google et MailApp de cette suite utilisent des transports simulés.
- 11 scénarios Redis réels réussis, dont concurrence, quota global, rotation IPv6 et expirations. Les compteurs et empreintes sont testés sans données réelles.
- Quatre scénarios HTTP de sécurité rejoués avec succès sur la compilation finale : CSP et nonce, fichiers sensibles, API fermée, CORS et scripts servis.
- Audit npm : aucune vulnérabilité connue signalée au moment du contrôle. Cela ne constitue pas une certification ni une garantie d’absence de faille.
- Création du projet Vercel dédié refusée par l’accès connecté : HTTP 403. Le compte est propriétaire de l’équipe, mais cette lecture n’explique pas la cause du refus. Le CLI était déconnecté ; une connexion officielle a été lancée pour poursuivre par cette voie. Aucun projet ni déploiement distant réussi n’est établi à ce stade.

## Conditions restant à vérifier réellement

1. Accès de déploiement fonctionnel, cible explicite et protection de la recette vérifiée avant transfert des sources.
2. Identité Google serveur dédiée, droits limités au tableau et Redis de production configurés sans secret dans le navigateur ou le dépôt.
3. Installation autorisée de la notification, puis candidature fictive reçue par le vrai tableau, email réellement reçu, second passage sans nouvel envoi.
4. Recette HTTPS et navigateur sur l’hébergement final, droits des responsables et procédure de fermeture vérifiés.
5. Informations légales, confidentialité et droits des médias approuvés avant collecte et publication publiques.

Les comptes rendus spécialisés détaillent les actions, attentes, observations et reprises : `recette-reception-2026-11-07.md`, `recette-parcours-2026-11-07.md`, `recette-securite-2026-11-07.md` et `recette-deploiement-2026-11-07.md`.
