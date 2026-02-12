
import { Reward } from './types';

export const POINTS_LADDER = [
  10000, 20000, 30000, 40000, 50000, 
  75000, 100000, 200000, 300000, 500000, 
  750000, 1000000, 2500000, 5000000, 10000000
];

export const SAFETY_TIERS = [4, 9]; // Index 5 (50k) et Index 10 (500k)

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
    type: 'REAL',
    image: 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Valable sur tout le site Amazon.fr', en: 'Valid on Amazon.com' } 
  },
  { 
    id: '2', 
    name: { fr: 'Amulette de Mana', en: 'Mana Amulet' }, 
    points: 400, 
    type: 'BONUS',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcmF2p8oho7R0k58xEUaojB28aNCEFRgL5R1MNNw13zM9OgDb75nZVWImu0SSy1TuHl8KmheQ-OfeWEWFiuUsxkv02Uu_AgtrNiHF7IQAcizXM3gcJoCBgbZ6yeLH0x744n1TC60uUhqHXu2I2PDU8HoEI64LieYtZUSL4XngJ-tDqqa5OYBhFX3tkdPY80HWJQ-an5rCt3N-ZZF6XyAhnuypijs-jATyAeren1QyoMapeggDrT9BqLeHV43se5sW7xNdDkTkNmQn9', 
    description: { fr: 'Doublez vos gains XP pendant 1 heure.', en: 'Double XP gains for 1 hour.' } 
  },
  { 
    id: '3', 
    name: { fr: 'Vahine de Moorea', en: 'Moorea Vahine' }, 
    points: 5000, 
    type: 'AVATAR',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPvaAipZLyJuSyiBEhz7m5wPhHY_MD5u1CM7Vt2mC6CACIUdgWHY20pMHSwF7AyyLt028lZFj-NRcTvzTNE4WVQiAGCI63PU1DQXpO7HYsT4fxwIVLSqhfta_FPMMkvw_kl7ci9fHJ35Gojg0sNQHUW3szCbp9jasw5S2PgNbRO0STcC6BOm5z7oGbTlAQpTb69cLONXPUVcZ6npFwzHQrcdejqnrzCP8IJJMyTBSvemtEPUKuAyl4w_lo2HgB87f1zLApgRhtP_tr', 
    description: { fr: 'Avatar exclusif pour votre profil.', en: 'Exclusive profile avatar.' } 
  },
  { 
    id: '4', 
    name: { fr: 'PlayStation 5 Slim', en: 'PlayStation 5 Slim' }, 
    points: 5000000, 
    type: 'REAL',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=300&q=80', 
    description: { fr: 'Console Edition Standard', en: 'Standard Edition Console' } 
  }
];

export const MAX_DAILY_ATTEMPTS = 2;
export const QUESTION_TIMER = 10;
