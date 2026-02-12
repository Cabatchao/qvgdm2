
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: number;
}

export interface QuestionHistoryEntry {
  text: string;
  timestamp: number;
}

export interface UserStats {
  points: number;
  dailyAttempts: number;
  lastPlayedTimestamp: number;
  lastFreeLifelineTimestamp: number;
  language: 'fr' | 'en';
  questionHistory: QuestionHistoryEntry[];
}

export interface Reward {
  id: string;
  name: { fr: string; en: string };
  points: number;
  image: string;
  description: { fr: string; en: string };
  type: 'BONUS' | 'AVATAR' | 'REAL';
}

export enum GameStatus {
  HOME = 'HOME',
  PLAYING = 'PLAYING',
  LADDER = 'LADDER',
  CELEBRATION = 'CELEBRATION',
  WINNER = 'WINNER',
  GAMEOVER = 'GAMEOVER',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD',
  PROFILE = 'PROFILE'
}

export type LifelineType = '50:50' | 'BANK' | 'SWITCH';

export interface LifelineState {
  type: LifelineType;
  isUsedInCurrentGame: boolean;
  isPaid: boolean;
}
