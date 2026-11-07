import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead } from '../lib/leadValidation';
import { recordInSheet, sheetHeaders } from '../lib/sheetReceiver';
import { publicSearchOrigin } from '../lib/launchSeo';

const normalized = validateLead({
  firstName: 'Camille', lastName: 'Recette', email: 'recette@example.test', city: 'Lille',
  openingTimeline: 'À définir', motivation: '=1+1 exemple de saisie', rgpd: true,
  idempotencyKey: '0b462409-7f89-443a-8a01-466cefab8d20',
});
if (!normalized.ok) throw new Error('Invalid fixture');
const lead = normalized.data;

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
