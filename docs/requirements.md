# Exigences fonctionnelles (v2 validée)

## 1) Règles de jeu

- Le jeu reprend le principe de "Qui veut gagner des millions".
- La récompense est en **points** au lieu des euros.
- Une partie se joue **jusqu'à élimination** : une mauvaise réponse termine la partie.
- Progression des gains en points alignée sur la logique de l'émission d'origine.
- Paliers de sécurité identiques au format original.

## 2) Jokers

Le jeu propose 3 jokers :

1. **50:50**
   - Supprime 2 mauvaises réponses.
2. **Sécurisation des gains**
   - Permet de sécuriser les gains en cours, même sans avoir atteint un palier.
   - En cas de mauvaise réponse ensuite, le joueur est éliminé mais conserve les gains sécurisés.
3. **Changement de question**
   - Remplace la question en cours par une nouvelle question de même niveau de difficulté.

Règles économiques des jokers :
- **1 joker gratuit par jour** (non cumulable).
- Les **2 autres jokers sont payants**.
- Achat des jokers payants **à l'unité** et via **packs**.

## 3) Limitation des parties

- Le joueur a **2 tentatives gratuites par jour**.
- Au-delà de 2 parties perdues dans la journée, il doit :
  - soit **payer** pour rejouer,
  - soit **attendre 24 heures**.

## 4) Protection anti-triche

- Chaque question doit être répondue en **10 secondes maximum**.
- Si le délai est dépassé, la question est considérée comme perdue.
- Le timer est contrôlé **côté serveur** (source de vérité anti-triche).
- Si le joueur quitte l'application/le site pendant une partie, la partie est considérée comme perdue.
- En cas de perte réseau, la partie n'est pas perdue immédiatement (tolérance minimale à définir techniquement).
- Journalisation des comportements suspects (quits répétés, automation, etc.).
- Politique disciplinaire : **1 avertissement**, puis **bannissement à vie** en cas de récidive.

## 5) Plateformes cibles

- Le jeu doit être disponible :
  - en application **iOS**,
  - en application **Android**,
  - sur un **site web**.

## 6) Comptes, sécurité et conformité

- Inscription/connexion par **email + téléphone**.
- **Double authentification** obligatoire.
- Règle métier : **1 compte par personne**.
- Conformité légale : cadre français et **RGPD**.
- Pour les gros cadeaux : vérification d'identité (pièce d'identité + selfie).

## 7) Boutique et récompenses

- Chaque bonne réponse rapporte des points.
- Les points sont cumulables.
- Les points expirent à chaque rotation de boutique (1 fois par mois).
- Les cadeaux sont affichés en boutique avec un coût fixe en points (exemples : carte cadeau, argent, PS5).
- La boutique est administrée par le client et ses collaborateurs.
- Le mode invité n'a pas accès à la boutique.

## 8) Paiements

- Monnaies supportées : **XPF** et **USD**.
- Canaux de paiement :
  - Apple in-app purchase,
  - Google Play Billing,
  - paiement par SMS surtaxé.

## 9) Expérience utilisateur

- Langues au lancement : **français** et **anglais**.
- Ton produit : **fun**.
- Mode invité autorisé, limité à **2 connexions**, avec restrictions fonctionnelles.

## 10) Back-office & contenu

- Un back-office administrateur est requis dès le MVP.
- La base de questions doit être créée (thèmes variés, niveaux variés).
- Contrainte de contenu : un joueur ne doit pas voir deux fois la même question sur une période d'un an.