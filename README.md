# Pizza Zio — recrutement de franchisés

Site Next.js dédié à la présentation de l’enseigne et à la candidature d’un futur exploitant. Le code provient de la branche `codex/create-landing-page-for-pizza-zio-franchise` du dépôt `Cabatchao/qvgdm2`. Cette version ne prouve pas son raccordement au site Vercel historique.

## État de lancement

La collecte reste **fermée par défaut**. L’interface et l’API n’acceptent aucune candidature tant que les informations métier et légales ne sont pas validées **et** que les services de réception et de limitation ne sont pas configurés. Les pages sont `noindex` pendant cette préparation. Aucun traceur publicitaire n’est installé.

Les anciens fichiers du jeu Vite/Gemini ont été retirés de cette branche. Leur historique Git reste disponible. Aucune clé Gemini n’est nécessaire à Pizza Zio.

Un [aperçu privé de consultation](https://pizza-zio-apercu-prive-octobre.maxatemax.chatgpt.site) est publié, avec connexion ChatGPT. Il reprend le rendu HTML compilé des trois pages, sans JavaScript applicatif ni collecte. Il ne constitue pas le déploiement Next.js de production. Voir la [recette HTTPS et ses limites](docs/pizza-zio-recette-en-ligne.md).

La [refonte visuelle « La Carte »](docs/pizza-zio-refonte-visuelle.md) reprend la typographie de la landing historique et des photographies existantes, avec animations CSS progressives. Les images et polices sont locales ; leurs versions mobiles limitent le poids du rendu. Les 20 contrôles navigateur incluent leur chargement et la réduction des mouvements.

## Installation et vérification

Node.js 24 recommandé (`.nvmrc`). Les versions sont verrouillées dans `package-lock.json`.

```bash
npm ci
npm run dev
```

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

Les tests serveur utilisent des adaptateurs simulés et des identités fictives ; huit scénarios supplémentaires exécutent le script de limitation sur un Redis réel lorsque `PIZZA_ZIO_REDIS_BIN` est défini. Les tests UI montent le formulaire isolément ; aucun mode de contournement public n’est exposé. Les tests navigateur lancent le build de production local, collecte désactivée.

`npm run test:integration` lance une recette isolée avec navigateur, HTTP, Redis et SQLite réels : neuf tests couvrent réception durable, réessai après réponse perdue, envois simultanés et pannes. Les prérequis et la portée sont décrits dans [pizza-zio-integration.md](docs/pizza-zio-integration.md). La CI installe Redis et rejoue ces contrôles. `npm run test:online` est une suite séparée de 22 contrôles pour la future origine HTTPS Next.js, exigeant `PIZZA_ZIO_PREVIEW_URL` ; elle n’a pas encore été exécutée.

## Parcours de candidature

1. Le navigateur envoie un `POST /api/lead` JSON avec un UUID de tentative.
2. Le serveur vérifie l’ouverture, l’origine exacte, le type et la taille du corps, les champs et le piège à robots.
3. Un script Redis atomique applique les limites distribuées et lie l’UUID au contenu normalisé. Seules des empreintes HMAC, des compteurs et des expirations y sont stockés.
4. Le serveur transmet la candidature au récepteur HTTPS configuré, avec authentification et délai maximal.
5. Il exige un accusé **après enregistrement durable** et correspondant à l’UUID. Un HTTP 200 seul ne suffit pas.
6. Le navigateur n’affiche la confirmation qu’après cet accusé. Une erreur conserve la saisie dans la page, sans stockage dans le navigateur. Un réessai identique conserve l’UUID.

Les montants sont lus en euros, avec virgule ou point pour les centimes. `30 000,00` vaut 30 000 euros ; `30k` est refusé. Un montant absent reste inconnu. La qualification décrit le projet et impose une revue humaine, sans seuil de solvabilité inventé ni rejet automatisé.

## Configuration serveur

Copier `.env.example` dans `.env.local` pour le développement. Ne jamais committer les secrets, les placer dans le code client ou les préfixer par `NEXT_PUBLIC_`. En hébergement, utiliser les variables serveur du projet concerné.

| Variable | Attendu |
| --- | --- |
| `LEAD_INTAKE_ENABLED` | `false` par défaut ; `true` uniquement après recette et validations |
| `LEAD_ALLOWED_ORIGIN` | Origine HTTPS exacte du formulaire, sans chemin, query ni credentials |
| `LEAD_WEBHOOK_URL` | URL HTTPS du récepteur, sans query ni credentials |
| `LEAD_WEBHOOK_TOKEN` | Secret serveur aléatoire d’au moins 32 caractères |
| `UPSTASH_REDIS_REST_URL` | Origine HTTPS d’un Redis REST compatible avec la commande `EVAL` |
| `UPSTASH_REDIS_REST_TOKEN` | Jeton serveur limité à cette base technique |
| `LEAD_HASH_SECRET` | Secret aléatoire distinct d’au moins 32 caractères pour les empreintes |

`data/launchConfig.ts` contient uniquement les faits publics approuvés et le contrôle métier. Une activation technique ne peut pas contourner ce contrôle.

### Contrat du récepteur

L’adaptateur doit vérifier le jeton `Authorization: Bearer …`, contrôler son schéma entrant, stocker le dossier dans un système durable et imposer une contrainte d’unicité sur `submissionId`. Une répétition du même identifiant doit renvoyer la même confirmation sans créer un dossier supplémentaire. Un identifiant déjà associé à un autre contenu doit être refusé. Les valeurs libres doivent être traitées comme du texte, jamais comme HTML, SQL ou formule de tableur.

En-tête : `Idempotency-Key: <UUID>`.

```json
{
  "schemaVersion": 1,
  "submissionId": "UUID de la tentative",
  "receivedAt": "date ISO",
  "application": { "firstName": "…", "email": "…", "personalContribution": null },
  "qualification": { "requiresHumanReview": true },
  "privacy": { "noticeVersion": "2026-10-28-v1", "acknowledged": true, "acknowledgedAt": "date ISO" }
}
```

Le schéma complet est défini dans `lib/leadValidation.ts` et `lib/scoreLead.ts`. La réponse requise est HTTP 200 ou 201, `Content-Type: application/json` :

```json
{ "ok": true, "persisted": true, "submissionId": "même UUID" }
```

Une action d’email ou un webhook générique qui répond avant sa sauvegarde ne remplit pas ce contrat. Le récepteur n’est pas provisionné par ce dépôt ; son écriture, son contrôle d’accès, ses sauvegardes et la suppression des dossiers restent à raccorder et à vérifier.

### Limites et erreurs

Corps entrant : 16 Kio ; réponse externe : 4 Kio. Délais : 5 secondes pour Redis et 8 secondes pour le récepteur. Redirections externes refusées. Les limites courantes sont cinq tentatives par adresse réseau sur quinze minutes, trois par email sur une heure et cent au total sur quinze minutes. Ce sont des réglages techniques initiaux, à mesurer avant campagne.

Sur Vercel, l’adresse réseau vient de l’en-tête géré par la plateforme. Sur un autre hébergeur, toutes les requêtes partagent un compteur conservateur jusqu’à configuration vérifiée d’un proxy de confiance. Ne pas faire confiance à un `X-Forwarded-For` arbitraire.

Réponses : `422` champs invalides ; `403` origine refusée ; `413` corps trop grand ; `415` format refusé ; `409` réutilisation incohérente d’identifiant ; `429` limite atteinte ; `503` collecte fermée ou réception non confirmée. Aucune donnée de candidature ni secret n’est écrit dans les logs applicatifs.

## Déploiement et ouverture

1. Choisir le projet et le domaine exacts ; identifier le responsable légal et opérationnel. L’accès Vercel observé lors de la reprise ne permettait pas de retrouver le projet historique.
2. Utiliser le preset **Next.js**, Node 24, `npm ci`, `npm run build`. Aucun rewrite vers `index.html`.
3. Déployer d’abord une prévisualisation sans collecte. Vérifier les pages, liens, en-têtes et l’affichage mobile.
4. Raccorder un récepteur de recette et Redis, valider le contrat, le doublon et les pannes. Ne jamais tester par surprise dans une vraie file de candidatures.
5. Compléter les informations approuvées dans `data/launchConfig.ts`, faire une recette sur l’origine destinée au public et confirmer la prise en charge humaine.
6. Ouvrir la collecte seulement après cette preuve. Vérifier à cette étape l’indexation, l’URL canonique, le domaine, les secrets serveur et le retour arrière.

Une CSP avec nonce protège les scripts et styles ; le rendu HTML est dynamique pour renouveler ce nonce. Aucun script, image ou police externe n’est requis. Les en-têtes interdisent l’intégration en iframe et désactivent les fonctionnalités navigateur inutiles. Ces mesures et les tests automatisés ne remplacent pas la recette du système destinataire.

## Exploitation et communication

- [Plan de lancement, cible et recette](docs/pizza-zio-lancement.md)
- [Textes de communication à valider](docs/pizza-zio-communication.md)
- [Données à confirmer](docs/pizza-zio-validation-donnees.md)
- [Fondements et validation des hypothèses de cible](docs/pizza-zio-cible-preuves.md)

Le message commun accueille différents parcours : activité salariée, reconversion ou expérience d’indépendant. Les responsables de restauration ou de commerce alimentaire constituent un segment d’essai parmi d’autres ; aucune donnée de recrutement ou de campagne Pizza Zio ne confirme encore leur supériorité. L’expérience de management peut être présentée dans la motivation, même sans création d’entreprise antérieure. Les critères d’admission et le territoire réellement disponible restent à confirmer par l’équipe Pizza Zio. Aucune promesse de rendement, chiffre réseau non reconfirmé ou délai de réponse garanti n’est publié.

- [Résultats de vérification et limites](docs/pizza-zio-verification.md)
