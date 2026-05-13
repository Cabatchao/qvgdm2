# Agent IA Web Pro - Kit de démarrage

Ce dossier fournit une base **directement exploitable en code** pour orchestrer un agent IA de création de sites web professionnels.

## Contenu

- `systemPrompts.ts`
  - Prompt système de l'agent principal.
  - Prompts système des sous-agents.
  - Questions de brief client.
  - Checklist QA.

## Utilisation

1. Importer les constantes dans votre orchestrateur d'agents.
2. Lancer le sous-agent `brief` en premier.
3. Bloquer l'étape suivante tant que les informations critiques restent manquantes.
4. Faire valider l'identité visuelle avant le développement.
5. Exécuter la checklist QA avant toute livraison.

## Note anti-hallucination

Toute donnée non fournie par le client doit rester sous forme de placeholder :
`[Information à fournir par le client]`.
