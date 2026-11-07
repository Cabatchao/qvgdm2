# Pizza Zio — préparation du déploiement privé

Vérification du 7 novembre 2026. Cette note distingue la configuration préparée des opérations réellement exécutées.

## Objectif vérifiable

Maxence et le directeur doivent pouvoir tester la réception des candidatures sur un serveur HTTPS, sans rendre la collecte accessible au public. Un visiteur anonyme doit rencontrer la protection d'accès ; un testeur autorisé doit pouvoir ouvrir la recette. La première version couvre le site existant et son circuit de réception, sans nouveau design, domaine public ni service payant provisionné.

Avant toute ouverture, le test convenu est : une candidature fictive génère un seul dossier privé et un reçu cohérent ; la même tentative rejouée reste unique ; un incident ne produit jamais un faux succès. La validation de cet objectif exige aussi le tableau et la notification réellement raccordés. Une compilation ou un déploiement seuls ne suffisent pas.

## Cible identifiée

- Compte Vercel : `cabatchaos-projects` (`team_jH0YleITtPZu5kutLstL4W8e`).
- Le profil authentifié est `cabatchao`, propriétaire (`OWNER`) confirmé de cette équipe. Son plan est Hobby actif ; les champs `softBlock` et `featureBlocks` retournés ne signalent pas de blocage. L'API ne fournit pas ici de limite numérique de projets. Ces faits ne permettent pas d'expliquer le refus de création.
- Projet prévu : `pizza-zio-franchise-recette`, distinct de Homa Location.
- Dépôt reconnu par l'intégration Vercel : `Cabatchao/qvgdm2`, identifiant `1156433434`.
- Branche de travail : `codex/pizza-zio-recette-lancement` ; le commit final doit être arrêté après les tests, puis utilisé explicitement pour le déploiement.
- Le Site privé existant `appgprj_6ae22bbef2208191bac38f7094c67504` et sa version 9 n'ont pas été modifiés dans cette étape.

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

**État : aucun projet créé et aucun déploiement lancé.** Il n'existe donc pas encore d'URL Vercel de recette à annoncer. Homa Location et le Site Pizza Zio conservé restent inchangés.

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
