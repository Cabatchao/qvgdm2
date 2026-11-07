# Pizza Zio — préparation du déploiement privé

Vérification du 7 novembre 2026. Cette note distingue la configuration préparée des opérations réellement exécutées.

## Dernier état — version privée 10 publiée

La consultation statique existante est désormais déployée en version **10**, à l'adresse https://pizza-zio-apercu-prive-octobre.maxatemax.chatgpt.site. Le déploiement `appgdep_6aef3419862c8191a037916505bd963b` a terminé avec le statut `succeeded`, depuis le commit source Sites `32c1a3cb2c07838df68761a774c88d1418af441e`. La relecture confirme un seul utilisateur autorisé, le propriétaire, sans groupe ni visiteur externe.

Le design, les six images du pack v2 et le film sont conservés. Le texte décrit désormais un seul responsable des candidatures, conformément à la consigne de Maxence. La compilation Next avec le pack privé et l'export des trois pages ont réussi. Les médias privés restent exclus du dépôt GitHub public.

Cette publication ne contient pas le serveur Next de candidatures. Elle ne collecte rien et ne prouve ni une écriture Google Sheets ni une notification réelle. L'ouverture dans le navigateur non authentifié affiche bien l'écran de connexion. Le navigateur de prévisualisation local était occupé par une autre application : il n'a pas été interrompu, et aucune nouvelle validation visuelle mobile ou Safari n'est annoncée.

La création Vercel demeure bloquée par le refus API 403 décrit plus bas. La tentative de connexion CLI a ensuite été arrêtée par une restriction réseau vers l'API Vercel ; elle n'a pas établi de session authentifiée. La reprise n'a pas tenté de contourner ce refus. Les sections suivantes conservent la chronologie de cette tentative serveur, distincte de la publication statique réussie.

## Boucle HTTPS réellement exécutée sur la version 10

La première passe de `scripts/check-private-preview.py` a réussi jusqu'au contrôle de la vidéo puis s'est arrêtée : le HEAD attendu devait préciser la taille, mais le serveur répondait 200, `video/mp4`, transfert chunked et sans Content-Length. La source et l'archive contenaient bien le même film de 2 211 390 octets. Le vérificateur a été corrigé pour accepter une preuve alternative bornée, sans ignorer une taille fausse : Range d'un octet, puis comparaison de la taille et du SHA-256 intégral si le serveur ignore Range et si le fichier ne dépasse pas 4 Mio.

La même recette complète a ensuite terminé avec le code 0 : **33 contrôles HTTPS réussis**. Le certificat a été vérifié, sans modification de la politique d'accès. Le jeton existant est resté en mémoire et n'a été envoyé qu'à l'origine du Site.

| Action | Attendu | Observé |
| --- | --- | --- |
| Lire les trois pages avec un accès autorisé | Pages actuelles, CSP statique stricte, noindex, aucun champ de collecte | 3 réponses 200, H1 attendus et script de présentation conforme au hash CSP |
| Demander sept chemins de sources ou secrets | Aucune source exposée | 7 réponses 404 |
| Envoyer un POST vide à `/api/lead` | Pas de collecte ni faux succès sur cet export | 404 |
| Lire les images référencées et les quatre polices | Octets identiques aux sources préparées | 16 comparaisons SHA-256 conformes |
| Vérifier le film après correction du test | Taille exacte et preuve bornée | Range ignoré avec 200 ; téléchargement limité, taille et SHA-256 intégral conformes |
| Lire les trois pages, l'image hero et le film sans authentification | Aucun contenu privé fourni | 5 réponses 401, sans suivre de redirection |

Ces contrôles concernent la consultation statique privée. Ils ne démontrent ni une réception Google Sheets, ni un email envoyé, ni le fonctionnement ou la sécurité du futur serveur distant de candidatures.

## Objectif vérifiable

Maxence doit pouvoir tester la réception des candidatures sur un serveur HTTPS, sans rendre la collecte accessible au public. Il reste le seul responsable humain ayant accès aux candidatures pour cette première phase. Un visiteur anonyme doit rencontrer la protection d'accès ; un testeur autorisé doit pouvoir ouvrir la recette. La première version couvre le site existant et son circuit de réception, sans nouveau design, domaine public ni service payant provisionné.

Avant toute ouverture, le test convenu est : une candidature fictive génère un seul dossier privé et un reçu cohérent ; la même tentative rejouée reste unique ; un incident ne produit jamais un faux succès. La validation de cet objectif exige aussi le tableau et la notification réellement raccordés. Une compilation ou un déploiement seuls ne suffisent pas.

## Cible identifiée

- Compte Vercel : `cabatchaos-projects` (`team_jH0YleITtPZu5kutLstL4W8e`).
- Le profil authentifié est `cabatchao`, propriétaire (`OWNER`) confirmé de cette équipe. Son plan est Hobby actif ; les champs `softBlock` et `featureBlocks` retournés ne signalent pas de blocage. L'API ne fournit pas ici de limite numérique de projets. Ces faits ne permettent pas d'expliquer le refus de création.
- Projet prévu : `pizza-zio-franchise-recette`, distinct de Homa Location.
- Dépôt reconnu par l'intégration Vercel : `Cabatchao/qvgdm2`, identifiant `1156433434`.
- Branche de travail : `codex/pizza-zio-recette-lancement` ; le commit final doit être arrêté après les tests, puis utilisé explicitement pour le déploiement.
- Lors de la première tentative Vercel, le Site privé existant `appgprj_6ae22bbef2208191bac38f7094c67504` était en version 9. Sa mise à jour ultérieure en version 10 est documentée ci-dessus.

## Configuration préparée

| Réglage | Valeur attendue | Motif |
| --- | --- | --- |
| Framework | Next.js | Conserver l'application serveur existante. |
| Runtime | Node.js 24 | Version retenue pour la recette. À confirmer dans la relecture du projet créé. |
| Région des fonctions | `fra1` | Exécution en Europe ; cela ne remplace pas la vérification des autres sous-traitants. |
| Sources Vercel visibles publiquement | `false` | Ne pas exposer les fichiers par le déploiement. Cela ne modifie pas la visibilité du dépôt GitHub. |
| Protection Vercel Authentication | `ssoProtection.deploymentType = all` | Protéger aussi un éventuel premier déploiement affecté à production. |
| Collecte | `LEAD_INTAKE_ENABLED=false` | Fermeture tant que la recette et les informations légales ne sont pas validées. |
| Indexation | `LEAD_INDEXING_ENABLED=false` | Ne pas indexer la recette. |
| Médias privés additionnels | `PIZZA_ZIO_VISUAL_PACK=0` | Ne pas transférer le pack privé dans une publication non vérifiée. |

Aucun secret Google, Redis, email ou autre ne figure dans cette note. Ils doivent être enregistrés dans les variables serveur du projet retenu et ne jamais être préfixés par `NEXT_PUBLIC_`.

## Résultat réel de la tentative

| Action | Attendu | Observé |
| --- | --- | --- |
| Chercher un projet Pizza Zio dans l'équipe connectée | Retrouver une cible existante ou confirmer son absence | Aucun projet Pizza Zio trouvé. |
| Vérifier l'intégration GitHub | Dépôt exact accessible à Vercel | `Cabatchao/qvgdm2` retrouvé par la recherche de dépôt. |
| Créer le projet de recette avec la protection de toutes les publications et les interrupteurs fermés | Projet créé, puis relecture de sa protection avant tout déploiement | Refus API HTTP 403 : « You don't have permission to create the project ». |
| Vérifier le fallback CLI proposé par l'API | Utiliser un accès CLI authentifié si disponible | Aucune commande initialement installée. La version `65.12.1`, obtenue depuis le registre npm, a ensuite répondu `Logged out` à `whoami` (code de sortie 1). Aucun flux de connexion ni déploiement temporaire n'a été lancé. |
| Rechercher le projet après le refus | Établir si une création partielle a eu lieu | Aucun projet `pizza-zio-franchise-recette` trouvé. |

Le refus ne prouve ni que le compte entier est inutilisable, ni qu'une reconnexion le résoudrait. Il concerne la création de ce projet via l'accès actuel. Le connecteur propose un fallback CLI pour la même opération et la même équipe, avec les propres identifiants du CLI ; ceux-ci ne sont pas disponibles. Aucune seconde tentative identique, aucun changement d'équipe et aucun abaissement de protection n'ont été effectués.

**État de la tentative Vercel : aucun projet créé et aucun déploiement serveur lancé.** Il n'existe donc pas encore d'URL Vercel de recette à annoncer. Homa Location reste inchangé. La publication statique Pizza Zio ultérieure est décrite en tête de cette note.

## Reprise et boucle à exécuter

1. Obtenir un droit de création Vercel pour cette équipe ou fournir un projet Pizza Zio existant administrable. Relire alors la cible et la protection avant l'envoi des sources.
2. Ne pas considérer « preview » comme une garantie suffisante : vérifier la protection de toutes les URLs, notamment si le premier déploiement est affecté à production. Si la protection requise n'est pas disponible sans option payante, arrêter cette voie avant de publier.
3. Fixer le commit testé, configurer Node.js 24 et la région, conserver les interrupteurs fermés, puis déployer exactement ce commit.
4. Attendre `READY`, relire les réglages et vérifier en HTTPS qu'un visiteur anonyme n'obtient pas le contenu protégé. En cas d'écart, corriger l'accès avant toute donnée de recette.
5. Avec un accès de test légitime, rejouer les contrôles de headers, CSP, API fermée, fichiers sensibles et absence de secrets dans le navigateur. Le test local `tests/http-security.test.mjs` est volontairement limité à localhost ; ne pas le lancer tel quel contre Internet.
6. Après raccordement réel Google/notification/limitation et approbation des informations légales, effectuer une recette distincte du dépôt de candidature avec données fictives. Relire le dossier, le reçu et la notification, puis supprimer les données de recette selon le protocole prévu.
7. Garder l'indexation fermée jusqu'à la mise en ligne publique explicitement validée et vérifier la fermeture d'urgence de collecte après bascule de son interrupteur.

## Documentation officielle consultée

- [Protection par Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).
- [Création d'un déploiement par l'outil Vercel](https://vercel.com/docs/agent-resources/vercel-mcp/tools/deployments/create_deployment).
- [Affectation du premier déploiement lors d'une initialisation](https://vercel.com/docs/networking/bring-your-own-cloud/deploy-with-cli).

Ces références étayent le protocole ; elles ne constituent pas une preuve d'exécution de la recette distante.
