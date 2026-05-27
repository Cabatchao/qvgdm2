export type LeadFormData = {
  city: string;
  personalContribution: string;
  hasRestaurantExperience: 'Oui' | 'Non';
  hasEntrepreneurExperience: 'Oui' | 'Non';
  openingTimeline: '0-3 mois' | '3-6 mois' | '6-12 mois' | 'plus de 12 mois';
  localStatus: 'Oui' | 'Non' | 'En recherche';
  motivation: string;
};

export function scoreLead(data: LeadFormData) {
  let score = 0;
  const contribution = Number(data.personalContribution.replace(/[^\d]/g, ''));
  if (contribution >= 50000) score += 25;
  else if (contribution >= 30000) score += 18;
  else if (contribution > 0) score += 10;

  if (['lille', 'dunkerque'].includes(data.city.trim().toLowerCase())) score += 20;

  if (data.hasRestaurantExperience === 'Oui') score += 15;
  if (data.hasEntrepreneurExperience === 'Oui') score += 10;

  if (data.openingTimeline === '0-3 mois') score += 10;
  else if (data.openingTimeline === '3-6 mois') score += 7;
  else if (data.openingTimeline === '6-12 mois') score += 4;

  if (data.localStatus === 'Oui') score += 10;
  else if (data.localStatus === 'En recherche') score += 5;

  if (data.motivation.trim().length > 20) score += 10;

  const status =
    score >= 80 ? 'Profil prioritaire' : score >= 60 ? 'Profil intéressant' : score >= 40 ? 'Profil à compléter' : 'Profil non prioritaire';

  return { score: Math.min(score, 100), status };
}
