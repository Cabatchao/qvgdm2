import type { ValidatedLead } from './leadValidation';

/** Operational facts for human review; no invented financial or territory threshold. */
export function qualifyLead(data: ValidatedLead) {
  const experience = (answer: 'Oui' | 'Non' | null) => answer === null ? null : answer === 'Oui';
  return {
    status: 'À étudier par l’équipe Pizza Zio',
    requiresHumanReview: true,
    experience: { restaurant: experience(data.hasRestaurantExperience), entrepreneurship: experience(data.hasEntrepreneurExperience) },
    operatorModel: data.operatorModel,
    openingTimeline: data.openingTimeline,
    localStatus: data.localStatus,
    contributionKnown: data.personalContribution !== null,
    budgetKnown: data.estimatedBudget !== null,
    territoryAvailability: 'À confirmer par l’équipe Pizza Zio',
    financialEligibility: 'À confirmer par l’équipe Pizza Zio',
  } as const;
}
