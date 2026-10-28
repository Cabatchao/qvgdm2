# Pizza Zio — recette complète avec services réels

Exécutée le 28 octobre 2026. **Neuf scénarios réussis**, après compilation de production d’une copie temporaire de l’application. La dernière passe navigateur a duré 13,6 secondes, hors compilation.

## Ce qui a été exercé

Le navigateur utilise le vrai composant `LeadForm`. La requête atteint une application Next.js compilée, qui appelle le vrai gestionnaire `handleLeadRequest`. Celui-ci effectue de vrais appels HTTP vers deux services locaux : un adaptateur REST vers Redis et un récepteur qui enregistre les dossiers dans un fichier SQLite. Le récepteur ne confirme l’enregistrement qu’après `COMMIT`.

Aucun `fetch` n’est remplacé par un double de test dans cette recette. Redis 8.10.3 exécute le vrai script Lua de limitation. SQLite utilise le journal WAL, `synchronous=FULL` et une clé primaire unique sur `submission_id`. Les tests relisent le fichier via une autre connexion SQLite ouverte en lecture seule.

| Scénario | Preuve obtenue |
| --- | --- |
| Candidature depuis un navigateur de bureau | Reçu lié au bon UUID et exactement une ligne SQLite |
| Apport `30 000,00` et budget `100 000` | Valeurs distinctes enregistrées : 30 000 et 100 000 euros |
| Réponse coupée après le `COMMIT` | Le formulaire affiche une incertitude, conserve la saisie ; une ligne existe déjà |
| Réessai après cette coupure | Même UUID, deux passages au récepteur, toujours une seule ligne et reçu final |
| Même UUID avec contenu modifié | HTTP 409 avant le récepteur, aucune deuxième ligne |
| Panne contrôlée du récepteur | Aucun reçu de succès, aucune ligne et saisie conservée |
| Panne contrôlée du service de limitation | Aucun reçu de succès, aucune ligne et saisie conservée |
| Quota email avec Redis réel | Trois demandes reçues ; quatrième refusée avec HTTP 429 et `Retry-After` |
| Quota réseau avec des emails différents | Cinq demandes reçues ; sixième refusée avec HTTP 429 |
| Parcours mobile, largeur 390 pixels | Reçu et ligne SQLite ; aucun débordement horizontal détecté |
| Deux POST simultanés, même UUID et contenu | Deux confirmations valides, une seule ligne grâce à l’unicité du récepteur |

Ces contrôles sont répartis dans neuf tests ; le premier vérifie aussi les montants, et le scénario de coupure vérifie le réessai.

## Isolation de la recette

Les fichiers `app/` du dépôt ne contiennent aucun mode de contournement ajouté pour ces tests. Le lanceur crée un répertoire temporaire, copie le code et remplace uniquement dans cette copie la configuration du formulaire et de sa route. Cette copie n’est pas destinée à être publiée. Le contrôle d’ouverture métier reste inchangé dans le code de production.

Les trois services écoutent uniquement sur l’interface de boucle locale : application 3220, services de test 3221 et Redis 6391. Le récepteur refuse les noms autres que l’exemple prévu et les emails hors du domaine synthétique `example.test`. Aucun email, CRM ou service extérieur n’est contacté.

Chaque exécution génère des secrets de test aléatoires. Redis exige une authentification avant toute commande. Le lanceur attend que **son propre processus Redis** soit prêt ; si le port est occupé, il interrompt la recette au lieu d’utiliser une instance existante. Les remises à zéro concernent uniquement cette instance authentifiée et la base SQLite temporaire. Les processus et les fichiers de travail sont supprimés à la fin, y compris en cas d’échec.

## Relancer

Prérequis : Node.js 24, dépendances du projet installées, Chromium Playwright disponible, binaires locaux `redis-server` et `redis-cli`. Le lanceur ne provisionne aucun service extérieur et ne modifie pas l’installation système.

```bash
REDIS_SERVER_PATH=/chemin/redis-server \
REDIS_CLI_PATH=/chemin/redis-cli \
node tests/integration/run.mjs
```

Pour un Chromium déjà disponible, ajouter `PLAYWRIGHT_EXECUTABLE_PATH=/chemin/chromium`. La passe exécutée ici utilisait Chromium 153.0.8010.0 et un seul worker. Le lanceur compile Next.js avec deux workers pour limiter la mémoire de la recette.

Fichiers : `tests/integration/run.mjs`, `fixture-server.mjs`, `playwright.config.mjs`, `real-flow.spec.mjs`.

## Limites exactes

Cette preuve porte sur une réception locale réelle et isolée, avec un récepteur SQLite de test qui respecte le contrat attendu. Elle ne prouve pas encore le bon raccordement d’un CRM, d’un service d’email, d’une base hébergée ou d’un opérateur humain. Elle n’évalue pas leur politique de conservation, leurs droits d’accès, leurs sauvegardes ou leur reprise après sinistre.

La configuration est injectée dans la copie de recette pour permettre les adresses HTTP locales ; les contrôles HTTPS et l’ouverture métier de la production sont vérifiés séparément. Le trafic de cette recette n’emprunte ni Internet ni une terminaison TLS. Les essais sur le lien déployé ont donc une portée complémentaire, et leurs résultats ne doivent pas être confondus avec cette chaîne de réception locale.

La première boucle a révélé une ambiguïté de sélecteur entre l’alerte du formulaire et l’annonceur de route Next.js. Le test cible désormais l’alerte de la section de candidature. Aucun contrôle n’a été désactivé et aucun défaut applicatif n’a été masqué.
