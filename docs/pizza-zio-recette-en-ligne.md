# Pizza Zio — préparation de recette HTTPS et aperçu statique

Préparation du 28 octobre 2026. **Les 22 contrôles de cette suite n’ont pas été exécutés sur un déploiement public Next.js.** La création de cette prévisualisation n’a pas été possible avec les accès d’hébergement disponibles. La préparation de tests ne constitue pas une validation.

Un [aperçu statique privé](https://pizza-zio-apercu-prive-octobre.maxatemax.chatgpt.site) est publié sur Sites à partir du rendu HTML de l’application Next.js 16.4.3 compilée, avec `scripts/export-consultation.mjs`. Publication confirmée le 28 octobre 2026, version source de l’aperçu `2e3e1a2daf1d00571745e20315ab9b531243057a`. Il ne contient ni JavaScript applicatif, ni collecte de candidature ; la FAQ utilise les éléments natifs `details` et la navigation repose sur des liens. Cet aperçu de consultation ne constitue pas un déploiement de l’application Next.js de production.

Les contrôles navigateur locaux de cet export, sur `http://terminal.local:4173`, ont confirmé le rendu visuel, l’ouverture de la question de FAQ sur le budget et les liens vers les pages de confidentialité et de mentions légales. Le navigateur non connecté affiche bien la demande de connexion ChatGPT sur le lien publié. Aucun résultat mobile sur un site déployé n’est revendiqué. Les résultats du serveur Next.js, de sa CSP, de son API ou de la recette SQLite/Redis ne sont pas automatiquement transférables à cet aperçu.

## Contrôles réellement exécutés sur l’aperçu HTTPS

Le script `scripts/check-private-preview.py` a interrogé exclusivement l’origine privée publiée, avec vérification TLS active. Il utilise l’accès de service existant fourni par Sites, transmis en entrée masquée et uniquement à cette origine. Aucun jeton n’est enregistré dans le dépôt ou dans les résultats. Huit requêtes de contrôle ont réussi :

| Contrôle | Résultat observé |
| --- | --- |
| Accueil, confidentialité, mentions légales | HTTP 200 pour chacune ; contenu attendu ; aucun script ni formulaire ; CSP restrictive présente dans le HTML |
| `/.env`, `/.git/config`, `/lib/leadHandler.ts` | HTTP 404 pour chaque chemin ; aucun fichier source exposé |
| `POST /api/lead` avec objet vide | HTTP 404 ; aucun service de collecte dans l’export |
| Accès anonyme à l’accueil | HTTP 401 ; contenu privé non accessible |

Ces contrôles ne prouvent pas les protections du futur serveur Next.js, ni tous les en-têtes de la plateforme, ni sa résistance à la charge. Ils valident les points observés sur cette publication statique. Aucune protection de connexion n’a été désactivée et aucun nouveau jeton n’a été créé pour les tests HTTP.

Le modèle de serveur Vinext envisagé pour cet aperçu a été abandonné après détection de dépendances vulnérables dans son installation. Aucun de ses paquets ou exécutables n’est présent dans l’archive statique publiée. Le dépôt Next.js principal reste à zéro vulnérabilité connue signalée par `npm audit` au contrôle du 28 octobre 2026.

## Périmètre

La suite prévue cible l’application Next.js réellement servie en HTTPS, avec deux formats de navigateur : ordinateur et mobile Chromium. Elle couvre le réseau et les erreurs JavaScript, la navigation, les liens légaux, le clavier, la FAQ sans JavaScript, l’absence de débordement, les contrôles automatiques d’accessibilité, les en-têtes et la CSP, et le refus explicite de candidature lorsque la collecte est fermée. Trois scénarios supplémentaires vérifient les fichiers sensibles non servis, les méthodes/CORS de l’API et les ressources publiques sans configuration serveur ni traceur tiers. Cela représente onze scénarios à exécuter sur deux formats de navigateur. Cette suite n’est pas une recette de l’export statique, qui ne comporte pas l’API Next.js.

Elle n’envoie aucune candidature réelle. Le seul POST de cette suite est un objet vide vers l’API fermée, dont le résultat attendu est un refus HTTP 503 sans reçu. Les tests ne visitent ni ne scannent le site historique ou des tiers.

## Exécution

```bash
PIZZA_ZIO_PREVIEW_URL=https://ORIGINE_EXACTE_AUTORISEE \
  npx playwright test --config=playwright.online.config.ts
```

`PLAYWRIGHT_EXECUTABLE_PATH` peut désigner un Chromium déjà installé. Si la prévisualisation est protégée, utiliser uniquement un secret d’automatisation autorisé via `VERCEL_AUTOMATION_BYPASS_SECRET`, jamais dans une URL ni dans un rapport. Les traces en ligne sont désactivées pour ne pas conserver d’en-têtes d’authentification. Les captures d’échec restent des éléments de contrôle internes.

## Limites à distinguer

Une application Next.js déployée dont la collecte est fermée permet de vérifier sa navigation et sa fermeture effective. L’aperçu statique permet seulement de consulter les contenus et de vérifier leur navigation ; il ne comporte aucun parcours d’envoi. Aucun des deux cas ne permet de conclure que le système métier de réception fonctionne. Le succès complet doit être exercé dans une application de recette isolée, réutilisant le véritable formulaire et le véritable traitement serveur, avec des identités fictives `example.test`, une écriture durable et une contrainte d’unicité sur l’identifiant de tentative.

Cette application de recette doit rester hors des routes de production. La recette locale réelle est décrite dans [pizza-zio-integration.md](pizza-zio-integration.md) : elle a exercé HTTP, Redis et SQLite avec une copie temporaire du formulaire et du traitement serveur. Elle est distincte de la présente suite HTTPS. Une recette locale réussie ne confirme pas le raccordement futur à un CRM ou à un opérateur réel.
