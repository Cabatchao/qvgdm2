import 'server-only';
import { createHash } from 'node:crypto';
import { JWT } from 'google-auth-library';
import { PRIVACY_NOTICE_VERSION } from '../data/launchConfig';
import type { ValidatedLead } from './leadValidation';

export type SheetDestination = { spreadsheetId: string; tabId: number; email: string; privateKey: string };
export const sheetHeaders = [
  'Référence', 'Empreinte', 'Reçu le (UTC)', 'Statut', 'Responsable', 'Prochaine action', 'Échéance',
  'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Département', 'Format', 'Calendrier',
  'Apport (€)', 'Budget (€)', 'Expérience restauration', 'Expérience entrepreneuriale', 'Exploitant',
  'Local', 'Projet', 'Question', 'Notice acceptée', 'Version de la notice',
];

function cell(value: string | number | null) {
  if (value === null || value === '') return {};
  return { userEnteredValue: typeof value === 'number' ? { numberValue: value } : { stringValue: value } };
}

type SheetsRequest = (operation: string, body: object) => Promise<unknown>;
type RangeResult = { valueRanges?: { valueRange?: { values?: string[][] } }[] };

export async function recordInSheet(lead: ValidatedLead, tabId: number, request: SheetsRequest) {
  const { idempotencyKey: id } = lead;
  const digest = createHash('sha256').update(JSON.stringify(lead)).digest('hex');
  // Resolve the actual columns before writing. Sorting complete rows is safe;
  // a changed header, missing tab or ambiguous receipt must fail closed.
  async function readGrid(range: object) {
    const result = await request('/values:batchGetByDataFilter', {
      dataFilters: [{ gridRange: { sheetId: tabId, ...range } }],
      valueRenderOption: 'UNFORMATTED_VALUE',
    }) as RangeResult;
    const values = result?.valueRanges?.[0]?.valueRange?.values;
    if (!Array.isArray(values)) throw new Error('Tracking sheet unavailable');
    return values;
  }
  const [header] = await readGrid({ startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: sheetHeaders.length });
  if (JSON.stringify(header) !== JSON.stringify(sheetHeaders)) throw new Error('Tracking sheet columns changed');
  const values = [
    id, digest, new Date().toISOString(), 'Nouveau', '', '', '', lead.firstName, lead.lastName, lead.email, lead.phone,
    lead.city, lead.department, lead.format, lead.openingTimeline, lead.personalContribution, lead.estimatedBudget,
    lead.hasRestaurantExperience, lead.hasEntrepreneurExperience, lead.operatorModel, lead.localStatus,
    lead.motivation, lead.message, 'Oui', PRIVACY_NOTICE_VERSION,
  ];
  // Both changes succeed together. Concurrent retries cannot create two named
  // ranges with the same ID, so they cannot append a second row either.
  const marker = 'Zio_' + id.replaceAll('-', '');
  try {
    const result = await request(':batchUpdate', { requests: [
      { addNamedRange: { namedRange: { namedRangeId: marker, name: marker, range: {
        sheetId: tabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1,
      } } } },
      { appendCells: { sheetId: tabId, rows: [{ values: values.map(cell) }], fields: 'userEnteredValue' } },
    ] }) as { replies?: { addNamedRange?: { namedRange?: { namedRangeId?: string } } }[] };
    if (result?.replies?.length === 2 && result.replies[0]?.addNamedRange?.namedRange?.namedRangeId === marker) return;
  } catch {
    // May have been committed before a timeout or have been written by a retry.
  }
  const rows = await readGrid({ startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 });
  const matches = rows.filter(row => row[0] === id);
  if (matches.length !== 1 || matches[0][1] !== digest) throw new Error('Persistence not confirmed');
}

export async function deliverToSheet(lead: ValidatedLead, config: SheetDestination) {
  const auth = new JWT({
    email: config.email, key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const signal = AbortSignal.timeout(12_000);
  await recordInSheet(lead, config.tabId, async (operation, body) => {
    const result = await auth.request({
      url: 'https://sheets.googleapis.com/v4/spreadsheets/' + config.spreadsheetId + operation,
      method: 'POST', data: body, signal, timeout: 8_000, retry: false,
    });
    return result.data;
  });
}
