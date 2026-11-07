# Pizza Zio — sécurité des étapes 2, 3 et 4

Contrôle du 7 novembre 2026, sur la branche de préparation au lancement. Les observations ci-dessous concernent le code présent dans cette recette, pas une certification du site ni une preuve de raccordement en production.

## Résultat attendu avant les essais

Un candidat fictif peut transmettre son projet uniquement lorsque les informations publiques et la configuration serveur ont été validées. Une confirmation correspond à un dossier conservé. Le réessai d'une transmission incertaine conserve sa référence et ne crée pas un deuxième dossier. La candidature, les secrets serveur et l'adresse privée de notification ne sont pas publiés dans les ressources navigateur.

La notification doit être déclenchée après la réception durable, sur une destination choisie côté serveur, avec uniquement la référence et un lien privé. Une panne de notification ne doit pas faire perdre une candidature enregistrée. Cette attente n'est pas encore une fonction vérifiée : aucune notification n'est implémentée dans le code de départ.

## Boucle 1 — état de départ

Commande exécutée :

```bash
node --conditions=react-server --import tsx --test tests/security.test.ts tests/lead.test.ts tests/sheet-receiver.test.ts tests/export-consultation.test.ts
```

Résultat : **47 tests réussis, zéro échec**, en environ 2,4 secondes. Aucun appel à un récepteur de production, aucune donnée réelle et aucun email envoyé par ces tests. Les réponses du limiteur et du récepteur Sheets sont simulées dans cette passe ; l'export utilise un serveur HTTP local isolé.

| Étape | Actions testées | Résultat observé |
| --- | --- | --- |
| 2 — réception | Mauvaises origines, champs inconnus, types erronés, textes de contrôle, corps fragmenté dépassant 16 384 octets | Rejet avant appel au récepteur ; aucun faux succès. |
| 2 — confidentialité | Vérification du contenu envoyé au limiteur, des erreurs et des réponses | Pas d'email ou d'IP en clair dans Redis ; pas de secret ou de saisie reflétés dans les erreurs testées. |
| 2 — tableur | Perte d'accusé de réception, rejeu du même dossier, contenu commençant par `=`, changement d'en-têtes | Un seul dossier dans le double de test, texte littéral, refus d'écrire lorsque les colonnes ne correspondent plus. |
| 3 — réessai | Référence identique avec contenu identique ou changé, confirmation manquante ou malformée | Réessai lié à la même référence ; conflit refusé ; réception incertaine explicitement signalée. |
| 3 — abus | Décisions du limiteur malformées, quotas dépassés, IP IPv6 équivalentes, faux en-têtes de proxy | Refus conservateur, respect du délai de réessai, regroupement par préfixe IPv6 ; aucune confiance aux en-têtes d'IP hors environnement prévu. |
| 4 — fermeture | Configuration métier non approuvée, secrets manquants ou réutilisés, collecte désactivée | Collecte fermée, pas de requête au récepteur et pas de faux succès. |
| 4 — export | Destination non vide et interruption de l'export | Refus de réutiliser des fichiers existants ; aucune publication partielle dans la destination finale. |

## Dépendances et exposition du code

`npm audit --json` a terminé avec le code de sortie 0 : **zéro vulnérabilité connue signalée**, 374 dépendances recensées. C'est l'état du registre consulté et de ce fichier de verrouillage à la date du contrôle, pas une preuve d'absence de toute vulnérabilité.

Un contrôle local des 95 fichiers suivis par Git n'a trouvé aucun motif correspondant à une clé privée PEM, un jeton GitHub ou une clé API Google. Les 10 fichiers JavaScript du build navigateur déjà présent n'ont montré aucune des clés de configuration serveur recherchées (`LEAD_WEBHOOK_TOKEN`, `UPSTASH_REDIS_REST_TOKEN`, `LEAD_HASH_SECRET`, paramètres privés Sheets et script du limiteur). Une recherche par motifs ne peut pas détecter tous les secrets possibles ; le build final doit être contrôlé à nouveau après les modifications.

## Boucle 2 — contre-vérification de la réception corrigée

L'agent responsable de la réception a identifié un défaut qui n'était pas couvert par les tests initiaux : la demande de jeton OAuth précède la requête Sheets et n'héritait pas des bornes définies uniquement sur celle-ci. Les options du transport commun appliquent maintenant la borne temporelle, le refus des redirections et l'absence de réessais implicites à l'échange de jeton et aux requêtes Sheets.

Après relecture indépendante du diff, la commande de la boucle 1 a été rejouée : **53 tests réussis, zéro échec**, en environ 8,4 secondes. Le nouveau scénario OAuth sans réponse s'interrompt réellement en **8 007,6 ms**, avant toute requête au tableau. Un échec OAuth HTTP 503 produit un seul appel simulé ; une perte de réponse après écriture produit une écriture et une relecture de confirmation. Vingt tentatives concurrentes dans le récepteur simulé conservent une seule ligne. Les accusés absents, ambigus et associés à un contenu différent sont refusés.

Cette contre-passe utilise le SDK Google installé avec un transport HTTP simulé et une clé synthétique générée pour les tests. Elle ne prouve ni l'accès au projet Google de production, ni les droits réels d'une identité de service, ni l'envoi de notifications.

## Boucle 3 — surface HTTP du build fermé

Le fichier `tests/http-security.test.mjs` a été ajouté pour vérifier des réponses réellement servies par Next.js, sans navigateur. Il refuse toute cible autre qu'une origine HTTP de boucle locale et s'exécute ainsi contre une compilation de production fermée :

```bash
PIZZA_ZIO_SECURITY_BASE_URL=http://127.0.0.1:3247 node --test tests/http-security.test.mjs
```

| Action | Attendu | Observation et reprise |
| --- | --- | --- |
| Démarrer Next dans une exécution, appeler le serveur depuis une autre | Serveur joignable sur la boucle locale | Première tentative : refus de connexion dans les quatre scénarios. Le processus serveur était toujours vivant. Le lancement du serveur et celui des tests ont été réunis dans le même contexte d'exécution, puis les mêmes tests ont été rejoués. |
| Fournir des en-têtes `x-nonce` et CSP choisis par le demandeur | Politique stricte et nonce serveur indépendant, différent à chaque réponse | Réussi ; la valeur injectée ne figure ni dans la politique ni dans le HTML. Protection contre le framing, `nosniff`, absence de cache et absence de `X-Powered-By` vérifiées. |
| Envoyer au formulaire fermé, lire l'API et faire un préflight étranger | Refus 503 sans succès ; lecture 405 ; aucune autorisation CORS tierce | Réussi. Aucune candidature réelle utilisée, collecte fermée. |
| Demander les sept chemins de secrets, sources et métadonnées Git prédéfinis | Refus 403/404 | Réussi. Les éventuels contenus n'ont pas été affichés. |
| Charger les scripts réellement référencés par l'accueil | Scripts de même origine, sans marqueur de paramètres de réception ni source map annoncée | Réussi. |

Résultat après correction du contexte d'exécution : **4 scénarios HTTP réussis, zéro échec**, en environ 0,5 seconde. L'instance a été arrêtée à la fin. Cette passe porte sur le build local déjà présent (`61frc_kO976Gby_RmZXdi`), antérieur à la correction OAuth ; cette dernière est couverte par la boucle 2. Le contrôle HTTP devra être rejoué sur le build final puis adapté à l'hébergement retenu avant ouverture. Ce n'est pas un test TLS ni une preuve des réglages d'un CDN de production.

Après la compilation finale de la branche, ces **mêmes quatre scénarios HTTP ont été rejoués sur le build `eCjnVxQHrFWlYbL7h209_` : quatre réussites, zéro échec**, en environ 0,46 seconde. Cela inclut une nouvelle lecture des scripts effectivement servis par ce build. Le processus de test a été arrêté après cette passe. La vérification sur l'hébergement public retenu reste à effectuer.

## Boucle 4 — quotas avec le moteur Redis réel

Après mise à disposition par l'agent parcours d'un binaire Redis 8.10.2 compilé depuis les sources officielles, la suite sécurité a été relancée avec :

```bash
PIZZA_ZIO_REDIS_BIN=/tmp/pizza-zio-redis-runtime/redis-stable/src/redis-server \
  node --conditions=react-server --import tsx --test tests/security.test.ts
```

Résultat : **28 nœuds de tests réussis, zéro échec**, en environ 4 secondes. Ce total compte les 16 cas adversariaux, les 11 sous-scénarios exécutés sur Redis et leur groupe. Il ne représente pas 28 nouveaux scénarios en plus des précédents.

La rotation de 100 adresses IPv6 appartenant au même préfixe `/64` a produit cinq admissions et 95 refus, puis le candidat du réseau indépendant a été accepté. Vingt tentatives concurrentes pour une même IP ont produit cinq admissions et quinze refus. Les essais refusés n'ont pas épuisé le quota global pour les autres candidats. Le quota email, les rejeux identiques, le plafond global, le conflit de contenu pour une même référence et les expirations ont également respecté les attentes.

Le véritable script Lua du projet a tourné sur une instance Redis isolée en boucle locale, port 6392. La suite vérifie le PID de son instance avant toute remise à zéro. L'instance a été arrêtée et son répertoire temporaire supprimé en fin de test. Aucun Redis distant ni dossier candidat réel n'a été utilisé.

## Boucle 5 — contre-revue des notifications préparées

Le module lié au tableau, `integrations/google-apps-script/Code.gs`, a été relu indépendamment. Le manifeste demande l'accès au seul classeur lié, l'envoi de messages et la gestion du déclencheur. Il ne demande ni accès à la boîte Gmail, ni requêtes réseau arbitraires. Le destinataire est lu dans une propriété privée du script ; il n'apparaît pas dans le dépôt. Les messages contiennent une référence validée et le lien privé, sans nom, adresse email de candidat, budget ni texte du projet. Le script n'écrit pas dans l'onglet des candidatures.

La première contre-passe a validé les neuf tests proposés. Elle a aussi identifié un manque de preuve : le double de panne email levait son erreur avant d'avoir accepté le message. Deux cas ont été ajoutés par l'agent réception, puis rejoués indépendamment :

| Action | Attendu | Observation après complément de la recette |
| --- | --- | --- |
| Accepter le mail dans le double puis perdre son accusé de réception | Une seule acceptation, statut `a_verifier`, aucun renvoi au passage suivant | Réussi. |
| Accepter le mail puis échouer pendant l'application du statut final du journal | Une seule acceptation, statut `a_verifier`, aucun renvoi au passage suivant | Réussi. |

Commande : `node --conditions=react-server --import tsx --test tests/email-notification.test.ts`. Résultat final : **11 tests réussis, zéro échec**, en environ 0,32 seconde. Les autres scénarios vérifient notamment l'historique ignoré, l'installation répétée, le verrou, le lot de cinq notifications, le quota épuisé, les destinataires invalides, le journal manquant et les en-têtes modifiés. Les exceptions de service sont remplacées par des codes dépourvus de données personnelles dans les cas testés.

**État réel : préparé, non installé et non activé dans Google.** La VM Node utilise le vrai fichier `Code.gs` avec des doubles de services ; aucun email réel n'a été envoyé. La persistance effective du journal Google, les permissions accordées, le déclencheur réel et la réception dans la boîte privée restent à vérifier. Il n'existe pas de transaction atomique entre un envoi email et une écriture Sheets : le choix est de suspendre les envois ambigus pour vérification humaine, pas de promettre une livraison exactement une fois.

Le README précise qu'un opérateur de confiance installe le déclencheur et que les éditeurs du classeur peuvent modifier son script lié. Les documents officiels Google consultés confirment le fonctionnement d'un script lié depuis un déclencheur, l'exécution du déclencheur sous le compte de son créateur et le périmètre d'envoi de MailApp sans accès à la boîte de réception : [scripts liés](https://developers.google.com/apps-script/guides/bound), [déclencheurs installables](https://developers.google.com/apps-script/guides/triggers/installable), [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app).

## Points ouverts avant la production

Après les corrections finales de formats et de responsable, les quatre scénarios de `tests/http-security.test.mjs` ont été rejoués sur le build `3cTP6Q6rv4ATkHCwxeDPJ` : **4 réussites, zéro échec**, en environ 0,48 seconde, avec Next en boucle locale puis arrêté. Ce résultat ne concerne pas le futur hébergement du serveur de candidatures.

1. **Circuit réellement raccordé** : le compte de service Google, le tableau privé, les droits nominatifs, la notification et la boîte destinataire doivent être configurés puis vérifiés avec un dossier fictif. Les tests simulés ne remplacent pas cette preuve.
2. **Hébergement** : hors Vercel, le code regroupe volontairement les requêtes dans un quota réseau conservateur partagé (cinq demandes admises en quinze minutes). Une mise en ligne ailleurs doit définir et vérifier le proxy de confiance ; accepter simplement `X-Forwarded-For` serait un affaiblissement de la protection.
3. **Ouverture** : les champs légaux et de confidentialité, la validation du destinataire et l'indicateur de recette restent nécessaires. Aucun de ces contrôles ne doit être contourné pour réussir un test.
4. **Configuration et surface publique** : vérifier sur l'hébergement retenu le certificat, les en-têtes, la CSP, les réponses de fermeture, les fichiers sensibles et les ressources effectivement servies. Le Site privé de consultation ne remplace pas le serveur de réception.
5. **Exploitation** : accès réels de l'équipe, suppression d'un dossier et de son marqueur d'idempotence, sauvegarde/restauration et suivi d'une notification en échec restent à démontrer.

## Limites de cette passe

Les 47 tests de départ et les 53 tests de contre-vérification de la réception n'incluaient pas le moteur Redis réel, indisponible au début de la passe. Il a ensuite été exercé séparément dans la boucle 4. Aucun test de charge externe, navigateur automatique indépendant, candidat réel ou action sur le site historique n'a été effectué ici.

La publication Sites retenue est une consultation statique privée : elle ne déploie pas le serveur Next.js, Sheets, Redis ni les notifications. Son refus attendu de `POST /api/lead` est 404/405 (ou 403 de protection), distinct du 503 de fermeture de l’API Next.js locale.
Le vérificateur `scripts/check-private-preview.py` contrôle le H1 actuel, le poster et les six images v2 par comparaison aux sources, l’unique script de présentation et son hash CSP, puis la vidéo par HEAD. Si la taille HEAD est absente, un seul GET demande l’octet 0 : une réponse 206 doit confirmer la taille totale et cet octet ; si le serveur ignore Range avec 200, la lecture est bornée à la taille locale + 1 octet, plafonnée à 4 Mio + 1, puis la taille exacte et le SHA-256 complet sont comparés. Une taille HEAD présente mais fausse reste un échec ; le résultat indique explicitement si le hash distant a été vérifié. Le contrôle exige aussi le refus ou la redirection de l’accès anonyme aux pages et médias sans transférer le jeton hors de l’origine.
Vérification locale du vérificateur : syntaxe correcte, trois pages synthétiques valides acceptées et huit variantes altérées refusées ; pour le repli vidéo, trois branches valides acceptées et 21 cas invalides ou trop grands refusés, sans réseau. La réussite HTTPS de la version publiée reste à établir par une exécution séparée ; ces essais isolés ne constituent pas une recette du déploiement.

La passe distante a ensuite été exécutée par root sur la version 10 : première interruption sur l'en-tête de taille vidéo absent, correction bornée décrite ci-dessus, puis **33 contrôles HTTPS réussis**, code de sortie 0. Le serveur ignore Range ; la vidéo de 2 211 390 octets a donc été comparée intégralement par SHA-256, avec lecture plafonnée. Les cinq accès anonymes aux trois pages, à l'image hero et au film ont renvoyé 401. Les sept chemins sensibles et le POST de collecte ont renvoyé 404. Ce résultat prouve la recette de l'export privé, pas celle du serveur de réception. La chronologie complète figure dans `recette-deploiement-2026-11-07.md`.
