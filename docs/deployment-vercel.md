# Déploiement Vercel (Corrigé)

## Étapes de déploiement

1. **GitHub** : Poussez votre code sur votre dépôt.
2. **Vercel** : Importez le projet. Vercel détectera automatiquement le preset **Vite**.
3. **Variables d'environnement** :
   - Allez dans les paramètres de votre projet sur Vercel.
   - Ajoutez une variable nommée `API_KEY`.
   - Collez votre clé API Google Gemini.
4. **Déployer** : Lancez le déploiement.

## Pourquoi c'était bloqué ?
Le fichier `vercel.json` précédent forçait un mode "statique pur" qui ignorait vos fichiers `.tsx`. Le nouveau système utilise Vite pour transformer votre code React en JavaScript compréhensible par tous les navigateurs (et par les webviews iOS/Android).

## Support Mobile
Pour transformer ce site en application iOS/Android, vous pouvez maintenant utiliser **Capacitor** ou simplement une **PWA** (Progressive Web App). Le code est structuré pour être compatible avec ces environnements.