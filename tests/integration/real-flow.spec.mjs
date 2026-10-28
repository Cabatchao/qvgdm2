import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const settings = JSON.parse(readFileSync(process.env.PIZZA_FIXTURE_SETTINGS, 'utf8'));
const fixtureUrl = `http://127.0.0.1:${settings.fixturePort}`;
const sample = {
  firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.test', phone: '', city: 'Ville de test', department: '',
  localStatus: 'En recherche', format: 'Je ne sais pas encore', personalContribution: '30 000,00', estimatedBudget: '100 000',
  hasRestaurantExperience: 'Oui', hasEntrepreneurExperience: 'Non', openingTimeline: '6-12 mois', operatorModel: 'Oui',
  motivation: 'Projet fictif pour vérifier le parcours de candidature.', message: '', rgpd: true, website: '',
};
async function control(request, data) {
  const response = await request.post(`${fixtureUrl}/control`, { headers: { Authorization: `Bearer ${settings.controlToken}` }, data });
  expect(response.status()).toBe(200);
  return response.json();
}
function records() {
  const database = new DatabaseSync(settings.database, { readOnly: true });
  try { return database.prepare('SELECT submission_id, payload_json FROM leads').all().map(row => ({ id: row.submission_id, payload: JSON.parse(row.payload_json) })); }
  finally { database.close(); }
}
async function fillForm(page) {
  await page.goto('/#projet');
  await expect(page.locator('input[name="firstName"]')).toBeEnabled();
  for (const name of ['firstName', 'lastName', 'email', 'city', 'personalContribution', 'estimatedBudget', 'motivation']) await page.locator(`[name="${name}"]`).fill(sample[name]);
  for (const name of ['localStatus', 'format', 'hasRestaurantExperience', 'hasEntrepreneurExperience', 'openingTimeline', 'operatorModel']) await page.locator(`select[name="${name}"]`).selectOption(sample[name]);
  await page.locator('input[name="rgpd"]').check();
}
async function submit(page) {
  const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/lead') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Envoyer mon projet' }).click();
  return (await requestPromise).postDataJSON();
}
async function postLead(request, payload) {
  return request.post('/api/lead', { headers: { Origin: 'http://127.0.0.1:3220', 'Content-Type': 'application/json' }, data: payload });
}

test.beforeEach(async ({ request }) => { await control(request, { reset: true }); });

test('navigateur → API → HTTP → SQLite durable → ACK → reçu, montants distincts', async ({ page }) => {
  await fillForm(page);
  const sent = await submit(page);
  await expect(page.getByRole('status')).toContainText(sent.idempotencyKey);
  const saved = records();
  expect(saved).toHaveLength(1);
  expect(saved[0].id).toBe(sent.idempotencyKey);
  expect(saved[0].payload.application.personalContribution).toBe(30_000);
  expect(saved[0].payload.application.estimatedBudget).toBe(100_000);
  expect(saved[0].payload.qualification.requiresHumanReview).toBe(true);
  expect(saved[0].payload.privacy.acknowledged).toBe(true);
});

test('perte de réponse après COMMIT puis réessai même UUID : un seul dossier', async ({ page, request }) => {
  await control(request, { mode: 'drop-ack-once' });
  await fillForm(page);
  const first = await submit(page);
  await expect(page.locator('#projet').getByRole('alert')).toContainText('réception');
  expect(records()).toHaveLength(1);
  await expect(page.locator('[name="email"]')).toHaveValue(sample.email);
  const retry = await submit(page);
  expect(retry.idempotencyKey).toBe(first.idempotencyKey);
  await expect(page.getByRole('status')).toContainText(first.idempotencyKey);
  expect(records()).toHaveLength(1);
  expect((await control(request, {})).deliveries).toBe(2);
});

test('la même clé avec un dossier modifié est refusée avant le récepteur', async ({ request }) => {
  const idempotencyKey = randomUUID();
  const first = await postLead(request, { ...sample, idempotencyKey });
  expect(first.status()).toBe(201);
  const changed = await postLead(request, { ...sample, city: 'Autre ville de test', idempotencyKey });
  expect(changed.status()).toBe(409);
  expect((await changed.json()).ok).toBe(false);
  expect(records()).toHaveLength(1);
  expect((await control(request, {})).deliveries).toBe(1);
});

for (const mode of ['webhook-error', 'redis-error']) {
  test(`${mode} : aucun faux reçu, aucune ligne et saisie conservée`, async ({ page, request }) => {
    await control(request, { mode });
    await fillForm(page);
    await submit(page);
    await expect(page.locator('#projet').getByRole('alert')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.locator('[name="email"]')).toHaveValue(sample.email);
    expect(records()).toHaveLength(0);
  });
}

test('limite email exécutée par Redis réel : quatrième tentative refusée', async ({ request }) => {
  for (let index = 0; index < 3; index++) expect((await postLead(request, { ...sample, idempotencyKey: randomUUID() })).status()).toBe(201);
  const limited = await postLead(request, { ...sample, idempotencyKey: randomUUID() });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()['retry-after'])).toBeGreaterThan(0);
  expect(records()).toHaveLength(3);
  expect((await control(request, {})).deliveries).toBe(3);
});

test('limite réseau réelle : sixième tentative refusée malgré des emails différents', async ({ request }) => {
  for (let index = 0; index < 5; index++) expect((await postLead(request, { ...sample, email: `camille${index}@example.test`, idempotencyKey: randomUUID() })).status()).toBe(201);
  const limited = await postLead(request, { ...sample, email: 'camille5@example.test', idempotencyKey: randomUUID() });
  expect(limited.status()).toBe(429);
  expect(records()).toHaveLength(5);
  expect((await control(request, {})).deliveries).toBe(5);
});

test('sur mobile le même parcours produit un reçu et une ligne durable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fillForm(page);
  const sent = await submit(page);
  await expect(page.getByRole('status')).toContainText(sent.idempotencyKey);
  expect(records()).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('deux POST simultanés avec le même UUID produisent un seul dossier', async ({ request }) => {
  const payload = { ...sample, idempotencyKey: randomUUID() };
  const replies = await Promise.all([postLead(request, payload), postLead(request, payload)]);
  expect(replies.map(response => response.status())).toEqual([201, 201]);
  const receipts = await Promise.all(replies.map(response => response.json()));
  expect(receipts.every(receipt => receipt.submissionId === payload.idempotencyKey)).toBe(true);
  expect(records()).toHaveLength(1);
  expect((await control(request, {})).deliveries).toBe(2);
});
