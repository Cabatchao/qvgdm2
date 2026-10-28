# Pizza Zio — vérification du 28 octobre 2026

Source de départ : `53db3978e72bd3b4d8cf13c5b0a93c5b31418743`, branche Pizza Zio du dépôt `Cabatchao/qvgdm2`. Les changements préparent la collecte ; ils ne prouvent pas la modification du site Vercel historique.

## Résultats obtenus

| Contrôle | Résultat |
| --- | --- |
| ESLint | Réussi, aucun avertissement toléré |
| TypeScript strict | Réussi |
| Tests serveur | 23 réussis |
| Tests UI isolée | 10 réussis |
| Tests navigateur | 16 réussis, bureau et mobile Chromium |
| Compilation de production propre | Réussie, Next.js 16.4.3 / React 19.3.1 |
| Audit npm de toutes les dépendances | 0 vulnérabilité signalée au moment du contrôle |
| Diff Git | Aucun problème d’espaces détecté |

Les 49 tests automatisés couvrent notamment : montants français et valeurs inconnues ; validation, origine et taille ; fermeture par défaut ; quotas et erreurs du service de limitation ; identifiants de tentative et accusés exacts ; panne réseau et conservation de saisie ; double soumission ; absence de collecte sans JavaScript ; navigation, liens, rendu réduit en animations et débordement entre 320 et 1440 pixels ; contrôles automatiques WCAG A/AA ; CSP avec nonce renouvelé ; refus HTTP explicite quand la collecte est fermée.

Les tests navigateur ont utilisé Chromium 153.0.8010.0 dans l’environnement de travail. Le téléchargement du navigateur standard de Playwright était indisponible ; un binaire isolé a été utilisé via `PLAYWRIGHT_EXECUTABLE_PATH`. Il n’est ni intégré au site ni requis en production. Le workflow GitHub installe le Chromium correspondant à sa version verrouillée de Playwright. Les tests sont limités à deux workers pour éviter une saturation du conteneur.

La revue a aussi exercé huit scénarios du script Lua avec une façade Redis déterministe. Ce contrôle ponctuel a confirmé le correctif d’expiration ; ce n’est pas une recette d’une base Redis réelle.

## Défauts corrigés pendant les boucles

- Confirmation locale sans envoi : remplacée par le traitement serveur et un ACK exact après persistance.
- Réponse de succès rattachée au mauvais identifiant : refusée côté navigateur.
- Argent ambigu et score inutilisé : parsing explicite en euros et qualification soumise à revue humaine.
- Limite dépassable lorsque le TTL Redis valait zéro : refus avec délai minimal et réparation d’expiration manquante.
- Formulaire sans hydratation : saisie et envoi désactivés ; aucune donnée en URL.
- Liens de marque : nom accessible dérivé du texte visible, sans remplacement incomplet par `aria-label`.
- Ancien outil Vite/Gemini et rewrite vers index.html : retirés de cette branche.
- Dépendance PostCSS vulnérable : mise à jour, puis audit complet sans signalement.

Un premier test UI a été interrompu lors d’une saturation mémoire observée dans le conteneur. La relance isolée puis la validation intégrée ont réussi sans modification ni assouplissement des assertions. Un cache de compilation invalide a été régénéré ; la compilation propre a réussi.

## Ce que ces résultats ne démontrent pas encore

Les récepteurs HTTP et Redis des tests sont simulés. Aucun candidat réel ni message n’a été envoyé. Il reste à tester le système destinataire réel : authentification, écriture durable, unicité du dossier, perte d’ACK, retour d’erreur, contrôle d’accès, conservation et suppression.

La recherche en lecture seule n’a identifié aucun projet Pizza Zio dans le compte Vercel accessible, ni de récepteur explicitement lié dans les connexions Supabase/n8n. Cela n’exclut pas un autre compte ou un système générique non identifié. Aucun de ces systèmes n’a été modifié.

La collecte reste fermée. Le formulaire ne devient disponible qu’après validation des informations publiques dans `data/launchConfig.ts` et de la configuration serveur. La cible proposée est un futur exploitant présent sur le terrain, ayant une expérience opérationnelle de restauration ou de commerce alimentaire, sur une seule zone confirmée disponible. Les conditions financières et la disponibilité de Lille/Dunkerque ne sont pas réaffirmées sans validation.

Aucun test automatique ne constitue une garantie absolue de sécurité ni une certification d’accessibilité. Le résultat est une base corrigée, vérifiée et préparée pour un raccordement contrôlé.
