# Pizza Zio — Landing Page Franchise

Landing page de recrutement franchisés pour Pizza Zio, orientée conversion vers le CTA principal **Tester mon éligibilité**.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Installation
```bash
npm install
npm run dev
```

## Commandes npm
- `npm run dev` : mode développement
- `npm run build` : build production
- `npm run start` : lancement production
- `npm run lint` : lint Next.js

## Scoring lead
Le scoring interne (non affiché au candidat) est implémenté dans `lib/scoreLead.ts` sur 100 points avec 4 statuts: Profil prioritaire, intéressant, à compléter, non prioritaire.

## Prochaines étapes
- connecter Supabase
- connecter Airtable
- envoyer un email automatique
- ajouter un chatbot FAQ franchise
- ajouter analytics
- ajouter A/B testing
