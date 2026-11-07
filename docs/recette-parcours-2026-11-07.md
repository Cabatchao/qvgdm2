# Recette du parcours candidat — 7 novembre 2026

## Objectif et périmètre

Un candidat prépare un projet dans le Nord (59). Il doit pouvoir renseigner son projet, accepter l’information sur ses données et recevoir une référence uniquement après un enregistrement durable. Maxence et le directeur doivent retrouver un seul dossier dans le tableau privé. La notification de ce dossier est un circuit distinct à vérifier sur la destination approuvée.

La première version comprend le dépôt, le reçu, la prévention des doublons et le suivi humain. La génération de PDF et les relances commerciales automatiques ne font pas partie de cette recette.

Cas de référence : Camille Exemple, `camille@example.test`, projet à emporter à Lille, calendrier « À définir », apport 30 000,00 € et budget total 100 000 €. Après un envoi, la référence du reçu doit correspondre à une seule ligne, l’apport et le budget doivent rester distincts, et l’expérience non renseignée doit rester inconnue. Aucune vraie donnée de candidat n’est utilisée dans les tests locaux.

## Vérifications exécutées dans cette passe

| Action | Résultat attendu | Résultat observé |
| --- | --- | --- |
| Exécuter les tests de validation, configuration, réception et sécurité | Les refus précèdent les appels sortants ; aucun faux reçu ; les secrets restent côté serveur | Première passe : 46/47 tests réussis, avec le test rouge OAuth ajouté en parallèle par l’agent réception. Il révélait une absence de signal d’annulation sur la demande de jeton Google. |
| Rejouer la même commande après la correction OAuth, avec les nouveaux cas réception | Délai et refus de redirection appliqués aussi à OAuth ; réessais/concurrence vérifiés | 51/51 tests réussis. Les appels externes sont simulés dans cette suite : ce n’est pas une preuve de raccordement Google réel. |
| Tester le formulaire avec JSDOM | Reçu attaché au bon UUID, double clic limité, erreurs compréhensibles, saisie conservée après panne | 13/13 tests réussis. Ce sont des tests de composants, pas une session sur téléphone. |
| Vérifier la syntaxe des scripts de recette HTTP | Les trois scripts se chargent syntaxiquement | `node --check` réussi pour le lanceur, le récepteur et la nouvelle suite HTTP. |
| Préparer Redis pour la recette HTTP complète | Disposer d’un moteur Redis local isolé | Aucun binaire initialement disponible ; les paquets système échouent avec « Unable to locate package ». Correction de l’environnement : source officielle Redis stable téléchargée, Redis 8.10.2 compilé dans un dossier temporaire, sans installation globale. |
| Exécuter la nouvelle recette HTTP avec Next compilé, Redis réel et SQLite durable | Un seul dossier, reçus exacts, refus sûrs, récupération après panne et protections HTTP actives | **15/15 scénarios réussis** le 7 novembre à 14:46 UTC. Les processus de recette sont arrêtés et le dossier temporaire de données est supprimé par le lanceur. Aucun service extérieur contacté par les tests. |

Commandes exécutées :

```bash
node --conditions=react-server --import tsx --test tests/lead.test.ts tests/security.test.ts tests/sheet-receiver.test.ts
node --import tsx --test tests/lead-form-ui.test.tsx
node --check tests/integration/run.mjs
node --check tests/integration/http-flow.test.mjs
node --check tests/integration/fixture-server.mjs
```

Les 51 + 13 résultats décrivent l’état observé pendant la passe unitaire, pas les éventuels nouveaux tests ajoutés ensuite par d’autres agents. Les 15 scénarios HTTP suivants constituent une preuve distincte avec services réels locaux.

## Recette HTTP sans navigateur ajoutée

`tests/integration/run.mjs --http` réutilise la copie temporaire compilée de Next.js, le limiteur Redis réel et le récepteur HTTP SQLite existants. Il lance maintenant un client HTTP Node à la place du navigateur. Le code de production n’a pas reçu de contournement et les indicateurs de lancement sont inchangés.

Les 15 scénarios exécutés couvrent : enregistrement et montants distincts ; réponse perdue après écriture ; réponse HTTP positive avec ACK mensonger ; deux envois simultanés ; conflit de contenu pour le même UUID ; panne du récepteur puis récupération ; panne Redis puis récupération ; quota email ; quota réseau ; origines et types MIME étrangers ; valeurs invalides, destinataire injecté, honeypot et corps trop volumineux ; absence d’autorisation sur les services de test ; refus de données non synthétiques par le récepteur ; CSP, nonces renouvelés, anti-framing et absence de cache/indexation ; non-exposition des fichiers sensibles, absence de lecture publique de dossiers et absence de CORS étranger.

| Action HTTP exécutée | Résultat attendu | Résultat observé |
| --- | --- | --- |
| Envoyer le cas Camille avec calendrier « À définir » | HTTP 201, reçu lié à l’UUID, un dossier, montants distincts et expérience inconnue | Conforme après relecture SQLite depuis une connexion distincte. |
| Couper la réponse après le COMMIT, puis renvoyer exactement la même demande | Premier HTTP 503 sans reçu ; deuxième HTTP 201, même UUID et toujours une ligne | Conforme, deux passages au récepteur et une seule ligne. |
| Retourner HTTP 201 avec `persisted: false`, puis renvoyer la demande | Aucun faux succès malgré HTTP 201 du récepteur ; reçu correct au réessai | Conforme : HTTP 503 côté candidat, puis HTTP 201 avec une seule ligne. |
| Envoyer deux POST simultanément | Deux confirmations liées au même UUID, une seule ligne | Conforme. |
| Réutiliser un UUID avec une autre ville | HTTP 409, aucune nouvelle livraison ni modification du dossier | Conforme. |
| Provoquer une panne du récepteur ou du limiteur, puis les rétablir | Aucun dossier/reçu pendant la panne ; un dossier au réessai | Conforme pour les deux scénarios. |
| Répéter les envois au-delà des quotas email/réseau | Quatrième envoi email ou sixième envoi réseau refusé, sans livraison supplémentaire | HTTP 429 et nombre de lignes inchangé ; `Retry-After` présent pour le quota email. |
| Envoyer depuis une origine étrangère, avec un mauvais type ou une saisie invalide | Rejet avant livraison | HTTP 403/415/422/413 selon le cas, zéro livraison et zéro ligne. |
| Consulter les pages compilées et les chemins sensibles | Nonce différent à chaque réponse, CSP stricte, fichiers serveur inaccessibles et aucune lecture de dossiers | Conforme sur cette compilation locale ; HTTPS public non exercé. |

```bash
REDIS_SERVER_PATH=/chemin/redis-server \
REDIS_CLI_PATH=/chemin/redis-cli \
node tests/integration/run.mjs --http
```

Cette commande doit être exécutée avec des binaires locaux validés. Les ports 3220, 3221 et 6391 sont réservés à cette recette et doivent être libres. Le moteur Redis propre au test doit démarrer avant toute remise à zéro. Les services écoutent en boucle locale et utilisent des secrets de test aléatoires. Le récepteur refuse les identités qui ne sont pas « Camille Exemple » et les adresses hors `example.test`. La suite n’envoie aucun email et ne touche aucun tableau Google.

La passe exécutée utilisait Node 24.22.1, Next.js 16.4.3 et Redis 8.10.2. Redis a été obtenu depuis `https://download.redis.io/redis-stable.tar.gz`, puis compilé avec `make -C src -j2 MALLOC=libc redis-server redis-cli`, selon la [documentation officielle de compilation](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-from-source/). L’archive téléchargée avait pour SHA-256 `430eb3e07c77678b6d6907593474fd3d2b2de524e51a2f84cbe5afda86f81a0f`. Il s’agit de l’empreinte calculée localement, pas d’une attestation de comparaison à un manifeste tiers. Aucune modification système de la mémoire ou installation globale n’a été effectuée.

## Parcours navigateur à vérifier dans CUA

Les tests navigateur automatisés existants restent destinés à leur environnement CI autorisé. Ils n’ont pas été lancés directement depuis cette session. Les largeurs 801, 820 et 1 100 px ont été ajoutées aux matrices E2E et en ligne ; leur ajout ne constitue pas une mesure réussie.

| Action à effectuer | Résultat attendu |
| --- | --- |
| Ouvrir la page conservée à 320, 390, 801, 820, 1 100 et 1 440 px | Pas de défilement horizontal ; menu, carte, liste des restaurants et CTA utilisables. |
| Rejoindre « Découvrir les deux formats », puis « Préparer mon projet » | Les bonnes sections deviennent visibles ; l’état de collecte fermé reste explicite tant que la configuration n’est pas approuvée. |
| Utiliser Tab/Entrée/Espace pour le saut au contenu et la FAQ | Focus visible, ordre cohérent, questions ouvrables et refermables au clavier. |
| Activer la réduction des animations et consulter toutes les sections | Contenu et liens présents, défilement immédiat, aucune animation nécessaire pour comprendre la page. |
| Ouvrir la page sur téléphone et observer le film | Affiche visible ; pas de téléchargement du film avant la commande volontaire. |
| Dans une recette isolée ouverte, envoyer le cas Camille | Reçu lié à l’envoi, une seule ligne de test visible dans la destination. |
| Faire un double clic, puis rejouer un envoi dont la réponse a été perdue | Une seule ligne et la même référence ; jamais de succès inventé. |
| Couper le récepteur, puis réessayer après rétablissement | Message d’échec/incertitude correct, saisie conservée, puis confirmation réelle. |
| Saisir une valeur invalide dans les précisions repliables | Résumé d’erreurs focalisé, rubrique ouverte et lien vers le bon champ ; correction possible. |
| Ouvrir les pages légales pendant la saisie | Nouveau contexte séparé, formulaire préservé, pas d’accès `window.opener`. |

## Ce qui ne peut pas être déclaré validé

La réception Google Sheets dans le futur environnement public, les permissions du directeur, une notification sur la boîte privée, Safari sur un iPhone physique, les performances du domaine final et la fermeture d’urgence sur cet hébergement restent à vérifier séparément. La recette HTTP réelle ci-dessus est locale : elle n’emprunte ni Internet ni une terminaison TLS et ne prouve pas les droits ou sauvegardes du futur hébergement. Les résultats locaux ne valent ni certification de sécurité ni validation de l’ouverture publique. Aucun mail réel n’a été envoyé par cette passe.

## Boucle avant déploiement — formats et responsable initial

La consigne d’accès a ensuite été précisée : Maxence est le seul responsable humain qui consulte les candidatures dans la première phase. Aucun accès au directeur n’est à créer ni à tester pour cette phase. Le texte de l’étape « Le premier échange » mentionne désormais une étude confidentielle par le responsable du recrutement, sans modifier le dessin, les conditions ni les indicateurs d’ouverture.

Deux anciens formats restaient acceptés par la validation serveur, alors qu’ils ne figurent plus dans les deux formats confirmés ni dans le formulaire. La boucle de régression a été exécutée avant puis après correction :

| Action | Attendu | Avant correction | Après correction |
| --- | --- | --- | --- |
| Envoyer le format « Livraison uniquement » au gestionnaire de candidature | HTTP 422, erreur sur le format et aucun appel externe | HTTP 201, test en échec | HTTP 422, aucun reçu, zéro appel externe simulé |
| Envoyer « Livraison + restaurant » | Même refus avant le limiteur et le récepteur | HTTP 201, test en échec | HTTP 422, aucun reçu, zéro appel externe simulé |
| Envoyer « À emporter », « Avec restaurant » ou « Je ne sais pas encore » | Choix conservé jusqu’au récepteur | Conforme | Conforme |
| Ne pas préciser le format | Projet accepté avec « Je ne sais pas encore » | Conforme | Conforme |

Les 30 tests ciblés de `tests/lead.test.ts` réussissent après correction, ainsi que TypeScript et la vérification du diff. Les transports sont simulés dans cette passe : aucun dossier Google ni email réel créé. La recette du déploiement HTTPS reste distincte.
