
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchQuestions(
  difficulty: number, 
  lang: 'fr' | 'en' = 'fr', 
  excludedTexts: string[] = []
): Promise<Question[]> {
  const languageName = lang === 'fr' ? 'français' : 'anglais';
  
  // On limite la liste d'exclusion pour ne pas saturer le prompt, en prenant les plus récentes si besoin.
  const exclusionContext = excludedTexts.length > 0 
    ? `\nIMPORTANT: Ne génère ABSOLUMENT PAS de questions similaires à celles-ci (déjà posées récemment): ${excludedTexts.slice(-20).join(', ')}.`
    : '';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Génère 5 questions de culture générale inédites et originales en ${languageName} de niveau de difficulté ${difficulty}/15 pour un jeu type "Qui veut gagner des millions". 
    ${exclusionContext}
    Le format doit être un tableau JSON d'objets avec les propriétés: text (string), options (tableau de 4 strings), et correctAnswer (index entier 0-3).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.INTEGER },
          },
          required: ["text", "options", "correctAnswer"],
        },
      },
    },
  });

  try {
    const rawQuestions = JSON.parse(response.text);
    return rawQuestions.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      difficulty
    }));
  } catch (e) {
    console.error("Failed to parse questions", e);
    return [];
  }
}
