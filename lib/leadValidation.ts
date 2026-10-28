export const EXPERIENCE_OPTIONS = ['Oui', 'Non'] as const;
export const TIMELINE_OPTIONS = ['0-3 mois', '3-6 mois', '6-12 mois', 'plus de 12 mois'] as const;
export const LOCAL_OPTIONS = ['Oui', 'Non', 'En recherche'] as const;
export const OPERATOR_OPTIONS = ['Oui', 'Non', 'À préciser'] as const;
export const FORMAT_OPTIONS = ['Livraison uniquement', 'Livraison + restaurant', 'Je ne sais pas encore'] as const;

export type ValidatedLead = {
  firstName: string; lastName: string; email: string; phone: string; city: string; department: string;
  personalContribution: number | null; estimatedBudget: number | null;
  hasRestaurantExperience: (typeof EXPERIENCE_OPTIONS)[number];
  hasEntrepreneurExperience: (typeof EXPERIENCE_OPTIONS)[number];
  openingTimeline: (typeof TIMELINE_OPTIONS)[number];
  localStatus: (typeof LOCAL_OPTIONS)[number];
  operatorModel: (typeof OPERATOR_OPTIONS)[number];
  format: (typeof FORMAT_OPTIONS)[number];
  motivation: string; message: string; rgpd: true; idempotencyKey: string;
};

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Euros only. Empty means unknown, never zero. Ambiguous shorthand is rejected. */
export function parseEuroAmount(input: unknown): number | null | undefined {
  if (typeof input !== 'string') return undefined;
  const value = input.trim().replace(/[\u00a0\u202f]/g, ' ');
  if (value === '') return null;
  if (!/^(?:\d{1,9}|\d{1,3}(?: \d{3}){1,2})(?:[,.]\d{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ''] = value.replace(/ /g, '').split(/[,.]/);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents / 100;
}

type ValidationResult = { ok: true; data: ValidatedLead } | { ok: false; fieldErrors: Record<string, string> };

export function validateLead(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, fieldErrors: { form: 'Le formulaire est invalide.' } };
  const source = input as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const allowed = new Set(['firstName', 'lastName', 'email', 'phone', 'city', 'department', 'personalContribution', 'estimatedBudget', 'hasRestaurantExperience', 'hasEntrepreneurExperience', 'openingTimeline', 'localStatus', 'operatorModel', 'format', 'motivation', 'message', 'rgpd', 'website', 'idempotencyKey']);
  if (Object.keys(source).some((key) => !allowed.has(key))) fieldErrors.form = 'Le formulaire contient des champs inconnus.';
  const text = (key: string, min: number, max: number, multiline = false) => {
    const raw = source[key] ?? (min === 0 ? '' : undefined);
    if (typeof raw !== 'string') { fieldErrors[key] = 'Ce champ est invalide.'; return ''; }
    const value = raw.trim().normalize('NFC');
    const invalid = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
    if (value.length < min || value.length > max || invalid.test(value)) fieldErrors[key] = min > 0 ? `Renseignez entre ${min} et ${max} caractères.` : `Utilisez au maximum ${max} caractères.`;
    return value;
  };
  function option<T extends readonly string[]>(key: string, options: T): T[number] {
    if (typeof source[key] !== 'string' || !options.includes(source[key] as string)) fieldErrors[key] = 'Sélectionnez une réponse dans la liste.';
    return source[key] as T[number];
  }
  const firstName = text('firstName', 1, 80);
  const lastName = text('lastName', 1, 80);
  const email = text('email', 3, 254).toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) fieldErrors.email = 'Renseignez une adresse email valide.';
  const phone = text('phone', 0, 32);
  const digits = phone.replace(/\D/g, '');
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) fieldErrors.phone = 'Renseignez un numéro valide ou laissez ce champ vide.';
  const city = text('city', 1, 100);
  const department = text('department', 0, 20);
  const personalContribution = parseEuroAmount(source.personalContribution ?? '');
  const estimatedBudget = parseEuroAmount(source.estimatedBudget ?? '');
  if (personalContribution === undefined) fieldErrors.personalContribution = 'Indiquez un montant en euros (ex. 30 000,00), sans « k », ou laissez vide.';
  if (estimatedBudget === undefined) fieldErrors.estimatedBudget = 'Indiquez un montant en euros (ex. 100 000), sans « k », ou laissez vide.';
  const hasRestaurantExperience = option('hasRestaurantExperience', EXPERIENCE_OPTIONS);
  const hasEntrepreneurExperience = option('hasEntrepreneurExperience', EXPERIENCE_OPTIONS);
  const openingTimeline = option('openingTimeline', TIMELINE_OPTIONS);
  const localStatus = option('localStatus', LOCAL_OPTIONS);
  const operatorModel = option('operatorModel', OPERATOR_OPTIONS);
  const format = option('format', FORMAT_OPTIONS);
  const motivation = text('motivation', 10, 2000, true);
  const message = text('message', 0, 2000, true);
  const idempotencyKey = text('idempotencyKey', 36, 36).toLowerCase();
  if (!UUID_PATTERN.test(idempotencyKey)) fieldErrors.form = 'Rechargez la page avant de réessayer.';
  if (source.rgpd !== true) fieldErrors.rgpd = 'Prenez connaissance de la notice relative aux données personnelles.';
  if (source.website !== undefined && source.website !== '') fieldErrors.form = 'La demande ne peut pas être acceptée.';
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, data: { firstName, lastName, email, phone, city, department, personalContribution: personalContribution ?? null, estimatedBudget: estimatedBudget ?? null, hasRestaurantExperience, hasEntrepreneurExperience, openingTimeline, localStatus, operatorModel, format, motivation, message, rgpd: true, idempotencyKey } };
}
