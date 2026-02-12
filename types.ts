
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: number; // 1 to 15
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
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  BOUTIQUE = 'BOUTIQUE',
  WINNER = 'WINNER'
}

export type LifelineType = '50:50' | 'BANK' | 'SWITCH';

export interface LifelineState {
  type: LifelineType;
  isUsedInCurrentGame: boolean;
  isPaid: boolean;
}
