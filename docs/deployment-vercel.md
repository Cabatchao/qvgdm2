
# Déploiement Web (Vercel)

## Étapes de déploiement

1. **GitHub** : Poussez votre code sur votre dépôt.
2. **Vercel** : Importez le projet. Vercel détectera automatiquement le preset **Vite**.
3. **Variables d'environnement** :
   - Ajoutez `API_KEY` (clé Gemini).
4. **Déployer**.

## Spécificités Web
L'application est une **Single Page Application (SPA)**. Le fichier `vercel.json` est configuré pour rediriger toutes les routes vers `index.html`, ce qui est crucial pour le bon fonctionnement de React en production.

L'anti-triche repose sur l'API `Page Visibility` du navigateur. Si l'utilisateur change d'onglet, la partie s'arrête.
