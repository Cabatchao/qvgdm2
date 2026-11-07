import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { validateLead } from '../lib/leadValidation';
import { deliverToSheet, recordInSheet, sheetHeaders } from '../lib/sheetReceiver';
import { publicSearchOrigin } from '../lib/launchSeo';

const normalized = validateLead({
  firstName: 'Camille', lastName: 'Recette', email: 'recette@example.test', city: 'Lille',
  openingTimeline: 'À définir', motivation: '=1+1 exemple de saisie', rgpd: true,
  idempotencyKey: '0b462409-7f89-443a-8a01-466cefab8d20',
});
if (!normalized.ok) throw new Error('Invalid fixture');
const lead = normalized.data;
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const sheet = {
  spreadsheetId: 'synthetic-sheet-not-a-live-document', tabId: 0,
  email: 'test@synthetic-project.iam.gserviceaccount.com',
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
};

test('the Google OAuth token request shares the Sheets timeout and refuses redirects', async () => {
  const requests: { url: string; signal: AbortSignal | null | undefined; redirect: RequestRedirect | undefined }[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    requests.push({ url: String(url), signal: options?.signal, redirect: options?.redirect });
    if (String(url) === 'https://oauth2.googleapis.com/token') {
      return Response.json({ access_token: 'synthetic-token-no-external-access', token_type: 'Bearer', expires_in: 3600 });
    }
    const body = JSON.parse(String(options?.body));
    if (String(url).endsWith('/values:batchGetByDataFilter')) {
      return Response.json({ valueRanges: [{ valueRange: { values: [sheetHeaders] } }] });
    }
    return Response.json({ replies: [{ addNamedRange: { namedRange: { namedRangeId: body.requests[0].addNamedRange.namedRange.namedRangeId } } }, {}] });
  };
  await deliverToSheet(lead, sheet, fetcher);
  assert.equal(requests.length, 3);
  assert.equal(requests[0].url, 'https://oauth2.googleapis.com/token');
  for (const request of requests) {
    assert.ok(request.signal instanceof AbortSignal, `${request.url} must have an abort signal`);
    assert.equal(request.redirect, 'error', `${request.url} must refuse redirects`);
  }
});

test('Google OAuth outages do not retry invisibly or reach the candidate sheet', async () => {
  let attempts = 0;
  await assert.rejects(deliverToSheet(lead, sheet, async url => {
    attempts++;
    assert.equal(String(url), 'https://oauth2.googleapis.com/token');
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 });
  }));
  assert.equal(attempts, 1);
});

test('a stalled Google OAuth exchange is actually aborted before any Sheets write', { timeout: 12_000 }, async () => {
  let attempts = 0;
  await assert.rejects(deliverToSheet(lead, sheet, async (url, options) => {
    attempts++;
    assert.equal(String(url), 'https://oauth2.googleapis.com/token');
    const signal = options?.signal;
    assert.ok(signal);
    return new Promise<Response>((_resolve, reject) => {
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }), error => error instanceof Error && /timeout|timed out/i.test(error.message));
  assert.equal(attempts, 1);
});

test('the Google SDK confirms a committed row after a lost write response without resending the write', async () => {
  let writes = 0;
  const rows: string[][] = [];
  const fetcher: typeof fetch = async (url, options) => {
    assert.ok(options?.signal instanceof AbortSignal);
    assert.equal(options?.redirect, 'error');
    if (String(url) === 'https://oauth2.googleapis.com/token') {
      return Response.json({ access_token: 'synthetic-token-no-external-access', token_type: 'Bearer', expires_in: 3600 });
    }
    assert.ok(String(url).startsWith('https://sheets.googleapis.com/v4/spreadsheets/' + sheet.spreadsheetId));
    const body = JSON.parse(String(options?.body));
    if (body.dataFilters) {
      const header = body.dataFilters[0].gridRange.startRowIndex === 0;
      return Response.json({ valueRanges: [{ valueRange: { values: header ? [sheetHeaders] : rows } }] });
    }
    writes++;
    const cells = body.requests[1].appendCells.rows[0].values;
    rows.push([cells[0].userEnteredValue.stringValue, cells[1].userEnteredValue.stringValue]);
    throw new Error('Synthetic lost write acknowledgement');
  };
  await deliverToSheet(lead, sheet, fetcher);
  assert.equal(writes, 1);
  assert.equal(rows.length, 1);
});

test('concurrent Sheets replays preserve a single row and reject a reused reference with changed content', async () => {
  const rows: string[][] = [];
  const markers = new Set<string>();
  const request = async (_operation: string, body: object) => {
    if ('dataFilters' in body) {
      const range = (body as { dataFilters: { gridRange: { startRowIndex: number } }[] }).dataFilters[0].gridRange;
      return { valueRanges: [{ valueRange: { values: range.startRowIndex === 0 ? [sheetHeaders] : rows } }] };
    }
    const { requests } = body as { requests: [{ addNamedRange: { namedRange: { namedRangeId: string } } }, { appendCells: { rows: { values: { userEnteredValue?: { stringValue?: string } }[] }[] } }] };
    const marker = requests[0].addNamedRange.namedRange.namedRangeId;
    if (markers.has(marker)) throw new Error('Named range already exists');
    const cells = requests[1].appendCells.rows[0].values;
    markers.add(marker);
    rows.push([cells[0].userEnteredValue!.stringValue!, cells[1].userEnteredValue!.stringValue!]);
    return { replies: [{ addNamedRange: { namedRange: { namedRangeId: marker } } }, {}] };
  };
  await Promise.all(Array.from({ length: 20 }, () => recordInSheet(lead, 0, request)));
  assert.equal(rows.length, 1);
  await assert.rejects(recordInSheet({ ...lead, city: 'Autre ville' }, 0, request), /Persistence not confirmed/);
  assert.equal(rows.length, 1);
});

test('Sheets never confirms an absent, ambiguous or mismatched stored receipt', async () => {
  for (const rows of [[], [[lead.idempotencyKey, 'wrong-digest']], [[lead.idempotencyKey, 'duplicate'], [lead.idempotencyKey, 'duplicate']]]) {
    await assert.rejects(recordInSheet(lead, 0, async (_operation, body) => {
      if ('dataFilters' in body) {
        const range = (body as { dataFilters: { gridRange: { startRowIndex: number } }[] }).dataFilters[0].gridRange;
        return { valueRanges: [{ valueRange: { values: range.startRowIndex === 0 ? [sheetHeaders] : rows } }] };
      }
      return { replies: [{}] }; // HTTP success alone is insufficient.
    }), /Persistence not confirmed/);
  }
});

test('Sheets confirms one durable row after a lost ACK and stores user text literally', async () => {
  const rows: string[][] = [];
  const request = async (operation: string, body: object) => {
    if ('dataFilters' in body) {
      const range = (body as {dataFilters:{gridRange:{startRowIndex:number}}[]}).dataFilters[0].gridRange;
      return {valueRanges: [{valueRange: {values: range.startRowIndex === 0 ? [sheetHeaders] : rows}}]};
    }
    assert.equal(operation, ':batchUpdate');
    const { requests } = body as { requests: [{addNamedRange:{namedRange:{namedRangeId:string}}},{appendCells:{ rows: {values: {userEnteredValue?:{stringValue?: string; formulaValue?: string}}[]}[]}}] };
    const cells = requests[1].appendCells.rows[0].values;
    const calendar = cells[sheetHeaders.indexOf('Calendrier')].userEnteredValue;
    assert.equal(calendar?.stringValue, 'À définir');
    assert.equal(calendar?.formulaValue, undefined);
    assert.equal(cells[21].userEnteredValue?.stringValue, lead.motivation);
    assert.equal(cells[21].userEnteredValue?.formulaValue, undefined);
    assert.ok(requests[0].addNamedRange.namedRange.namedRangeId.endsWith(lead.idempotencyKey.replaceAll('-', '')));
    if (!rows.length) rows.push([cells[0].userEnteredValue!.stringValue!, cells[1].userEnteredValue!.stringValue!]);
    throw new Error('Lost acknowledgement or duplicate marker');
  };
  await recordInSheet(lead, 0, request);
  await recordInSheet(lead, 0, request);
  assert.equal(rows.length, 1);
  await assert.rejects(recordInSheet({ ...lead, city: 'Autre ville' }, 0, request), /Persistence not confirmed/);
});

test('Sheets refuses to write after a changed header', async () => {
  const actions: string[] = [];
  await assert.rejects(recordInSheet(lead, 0, async op => {
    actions.push(op);
    return {valueRanges: [{valueRange: {values: [['autre']]}}]};
  }), /columns changed/);
  assert.deepEqual(actions, ['/values:batchGetByDataFilter']);
});

test('only the live, explicitly enabled and canonical origin can be indexed', () => {
  const origin = 'https://franchise.example.test';
  assert.equal(publicSearchOrigin(origin, 'franchise.example.test', 'true', 'production'), origin);
  assert.equal(publicSearchOrigin(origin, 'alias.example.test', 'true', 'production'), null);
  assert.equal(publicSearchOrigin(origin, 'franchise.example.test', 'true', 'preview'), null);
  assert.equal(publicSearchOrigin(origin, 'franchise.example.test', 'false', 'production'), null);
  assert.equal(publicSearchOrigin(undefined, 'franchise.example.test', 'true', 'production'), null);
});
