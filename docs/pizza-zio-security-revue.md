# Pizza Zio — revue de sécurité et tests adversariaux

Contrôle du 28 octobre 2026 sur le code repris depuis le commit `b0a849403124242d1cc69de59afc558f6422355d`. Les résultats ci-dessous portent sur le code et une instance Redis locale isolée. Les contrôles du déploiement HTTPS sont consignés séparément dans la recette en ligne.

## Résultat

**15 cas adversariaux et 8 scénarios exécutés sur le véritable moteur Redis réussissent.** Le lanceur Node compte 24 nœuds de tests, car il compte également le groupe des huit scénarios Redis. Aucun nouveau défaut applicatif exploitable n’a été reproduit dans ce périmètre. Cela ne constitue ni un audit exhaustif ni une garantie absolue de sécurité.

Aucun candidat réel n’a été utilisé. Les appels du formulaire dans les 15 cas adversariaux passent par des adaptateurs de test ; ils ne contactent pas de CRM. Les huit scénarios supplémentaires exécutent réellement le script `RATE_LIMIT_SCRIPT` dans Redis 8.10.3, compilé depuis le dépôt officiel, tag `8.10.3`, commit `1a2574ce1551d3de6e0b4a56756c0fdbc6659e4f`. Cette instance écoute uniquement sur `127.0.0.1:6392`, ne sauvegarde rien sur disque et est arrêtée après les contrôles. Le test vérifie son PID avant toute remise à zéro afin de ne jamais effacer un autre Redis.

## Contrôles adversariaux

| Scénario | Observation |
| --- | --- |
| Corps JSON fragmenté, multioctets, faux `Content-Length` | Refus 413 avant appel externe lorsque la taille réelle dépasse la borne |
| UTF-8 invalide ou JSON interrompu | Refus 400 avant appel externe |
| Valeurs JSON scalaires, tableaux, clés `__proto__` et `constructor` | Refus 422 ; aucune pollution du prototype observée |
| Champs ajoutés comme `score`, `approved`, `recipient`, `webhookUrl` | Refus 422 ; aucun pouvoir de modifier la destination ou l’approbation |
| Origine vide, `null`, ressemblante ou multiple | Refus 403 |
| MIME trompeur, formulaire classique ou multipart | Refus 415 |
| En-têtes IP forgés hors Vercel | Même compteur conservateur ; aucune confiance accordée à l’en-tête client |
| Liste d’IP ou IP malformée dans l’en-tête de confiance | Compteur conservateur partagé |
| Même nom en Unicode composé/décomposé, email avec casse différente | Même empreinte du dossier et même clé de quota email |
| Réponse du limiteur malformée ou excessive | Aucun transfert de candidature et aucun faux succès |
| Texte HTML et contrôle de type injection | Le contenu reste du texte JSON ; il n’est pas reflété dans la réponse de succès/erreur |
| Contrôles ASCII et CRLF dans l’identité | Refus avant transmission |
| Types de champs malformés | Erreur contrôlée, pas d’exception exposée ni d’appel externe |
| URL de configuration interne littérale, credentials embarqués, token avec saut de ligne | Configuration refusée |

Les tests de réflexion décodent les réponses JSON puis inspectent récursivement leurs clés et leurs chaînes, y compris dans les tableaux, pour rechercher les charges et leurs canaris HTML, CRLF, NUL et ESC. Les guillemets ou octets de contrôle échappés par JSON ne peuvent ainsi masquer une réflexion. Ce contrôle vérifie l’absence de ces valeurs dans les réponses de l’API ; il ne vérifie pas leur exécution dans un navigateur ni la sûreté d’un CRM tiers : le récepteur doit conserver les valeurs comme du texte et ne pas les interpréter comme HTML, SQL ou formules de tableur.

## Quotas réellement exercés dans Redis

1. Une demande acceptée crée les compteurs et l’empreinte avec expiration.
2. La sixième tentative pour une même IP est bloquée, même avec un email différent.
3. La quatrième tentative pour un même email est bloquée, même avec une IP différente.
4. Le plafond global s’applique à des IP et emails indépendants.
5. Sur vingt tentatives simultanées pour une IP, exactement cinq sont acceptées et quinze bloquées.
6. Un identifiant réutilisé avec un contenu différent est refusé avant modification des compteurs ou de son empreinte.
7. Un compteur dont le TTL vaut zéro bloque encore le dépassement avec un délai minimal d’une seconde.
8. Un compteur sans expiration est réparé et reste soumis à la limite.

Les limites sont des réglages techniques initiaux. Ce contrôle n’est pas un test de charge du site ni une preuve de résistance à un déni de service distribué.

## Reproduire

Tests sans infrastructure externe :

```bash
node --conditions=react-server --import tsx --test tests/security.test.ts
```

Tests supplémentaires avec un binaire Redis vérifié et son `redis-cli` dans le même répertoire :

```bash
PIZZA_ZIO_REDIS_BIN=/chemin/vers/redis-server \
  node --conditions=react-server --import tsx --test tests/security.test.ts
```

Le port 6392 doit être libre. Le test refuse de nettoyer une instance qu’il n’a pas lui-même démarrée. Dans l’environnement de travail, les sockets Unix étaient interdits ; TCP loopback a donc été utilisé. Aucun contournement de collecte n’a été ajouté aux routes de production pour ces contrôles.

## Limites et validations avant ouverture

- L’origine autorisée réduit les soumissions depuis un navigateur tiers ; elle n’authentifie pas un client HTTP arbitraire capable d’écrire son propre en-tête `Origin`. Les quotas et protections d’hébergement restent nécessaires.
- La fiabilité de l’IP Vercel dépend de l’en-tête fourni par la plateforme. Sur un autre hébergeur, le compteur partagé actuel est volontairement plus restrictif jusqu’à définition d’un proxy de confiance.
- Le destinataire réel doit authentifier le webhook, stocker durablement et dédupliquer atomiquement les identifiants, y compris après perte d’ACK. Un récepteur simulé ne suffit pas à prouver cela.
- Les URL serveur sont de la configuration de confiance. Le contrôle des formes d’URL ne remplace pas la validation du domaine, du DNS, de la destination et des permissions du fournisseur.
- Les en-têtes, le certificat TLS, les fichiers publiquement accessibles, l’absence de secrets dans les fichiers JavaScript et le comportement réel du CDN doivent être contrôlés sur l’URL déployée.
- La durée de conservation, les droits d’accès et la suppression des dossiers ne sont pas démontrés par ces tests de transport.
- Aucune charge importante, extraction de données, recherche hors périmètre ou action sur le site historique n’a été menée.

## Références techniques primaires

Consultées le 28 octobre 2026 :

- [Vercel — Request headers](https://vercel.com/docs/headers/request-headers) : comportement des en-têtes IP fournis par la plateforme.
- [Redis — EVAL](https://redis.io/docs/latest/commands/eval/) : exécution du script côté serveur et arguments de clés.
- [Redis — source testée](https://github.com/redis/redis/tree/1a2574ce1551d3de6e0b4a56756c0fdbc6659e4f) : moteur utilisé uniquement pour la recette locale.
- [OWASP — REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) : validation des entrées, types de contenu, erreurs et en-têtes de sécurité.
