
import { Reward } from './types';

export const POINTS_LADDER = [
  100, 200, 300, 500, 1000, 
  2000, 4000, 8000, 16000, 32000, 
  64000, 125000, 250000, 500000, 1000000
];

export const SAFETY_TIERS = [4, 9]; // Indexes of 1000 and 32000

export const LIFELINE_PRICES = {
  '50:50': { points: 5000, xpf: 150, usd: 1.50 },
  'BANK': { points: 15000, xpf: 300, usd: 3.00 },
  'SWITCH': { points: 10000, xpf: 250, usd: 2.50 },
};

export const REWARDS: Reward[] = [
  { 
    id: '1', 
    name: { fr: 'Carte Cadeau Amazon 10€', en: '10€ Amazon Gift Card' }, 
    points: 100000, 
    image: 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Valable sur tout le site Amazon.fr', en: 'Valid on Amazon.com' } 
  },
  { 
    id: '2', 
    name: { fr: 'Netflix 1 mois', en: 'Netflix 1 month' }, 
    points: 75000, 
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Abonnement Standard HD', en: 'Standard HD Subscription' } 
  },
  { 
    id: '3', 
    name: { fr: 'PlayStation 5 Slim', en: 'PlayStation 5 Slim' }, 
    points: 5000000, 
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Console Edition Standard', en: 'Standard Edition Console' } 
  },
  { 
    id: '4', 
    name: { fr: 'iPhone 15 Pro', en: 'iPhone 15 Pro' }, 
    points: 10000000, 
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Titane Naturel - 128 Go', en: 'Natural Titanium - 128 GB' } 
  },
  { 
    id: '5', 
    name: { fr: 'Virement 50€ Cash', en: '50€ Cash Transfer' }, 
    points: 500000, 
    image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Directement sur votre compte', en: 'Directly to your bank account' } 
  },
];

export const MAX_DAILY_ATTEMPTS = 2;
export const QUESTION_TIMER = 10;
