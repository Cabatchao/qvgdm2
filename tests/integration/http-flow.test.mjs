/** Real loopback HTTP/Redis/SQLite tests. Run only via run.mjs --http. */
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

if (!process.env.PIZZA_FIXTURE_SETTINGS) throw new Error('Use the isolated integration runner.');
const settings = JSON.parse(readFileSync(process.env.PIZZA_FIXTURE_SETTINGS, 'utf8'));
assert.equal(settings.origin, 'http://127.0.0.1:3220');
assert.equal(settings.fixturePort, 3221);
assert.equal(settings.redisPort, 6391);
const fixtureUrl = `http://127.0.0.1:${settings.fixturePort}`;
const sample = {
  firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.test', phone: '', city: 'Lille', department: '',
  localStatus: '', format: 'À emporter', personalContribution: '30 000,00', estimatedBudget: '100 000',
  hasRestaurantExperience: '', hasEntrepreneurExperience: '', openingTimeline: 'À définir', operatorModel: '',
  motivation: 'Candidature fictive pour vérifier la réception du projet.', message: '', rgpd: true, website: '',
};
async function control(data = {}) {
  const response = await fetch(`${fixtureUrl}/control`, {
    method: 'POST', headers: { Authorization: `Bearer ${settings.controlToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(10_000), redirect: 'error',
  });
  assert.equal(response.status, 200);
  return response.json();
}
function records() {
  const database = new DatabaseSync(settings.database, { readOnly: true });
  try {
    return database.prepare('SELECT submission_id, payload_json FROM leads').all()
      .map(row => ({ id: row.submission_id, payload: JSON.parse(row.payload_json) }));
  } finally { database.close(); }
}
async function post(payload, changes = {}) {
  return fetch(`${settings.origin}/api/lead`, {
    method: 'POST', headers: { Origin: settings.origin, 'Content-Type': 'application/json', ...changes },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000), redirect: 'error',
  });
}
async function expectReceipt(response, id) {
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), { ok: true, submissionId: id });
}
async function expectFailure(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, false);
  if (code) assert.equal(body.code, code);
  assert.equal(Object.hasOwn(body, 'submissionId'), false);
  const serialized = JSON.stringify(body);
  for (const secret of [settings.webhookToken, settings.redisToken, settings.controlToken, settings.hashSecret]) {
    assert.equal(serialized.includes(secret), false, 'Server responses must not expose fixture secrets.');
  }
}

beforeEach(async () => { await control({ reset: true }); });

test('HTTP → Next API → Redis → receiver → durable SQLite → exact receipt', async () => {
  const id = randomUUID();
  await expectReceipt(await post({ ...sample, idempotencyKey: id }), id);
  const saved = records();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, id);
  assert.equal(saved[0].payload.application.personalContribution, 30_000);
  assert.equal(saved[0].payload.application.estimatedBudget, 100_000);
  assert.equal(saved[0].payload.application.openingTimeline, 'À définir');
  assert.deepEqual(saved[0].payload.qualification.experience, { restaurant: null, entrepreneurship: null });
  assert.equal(saved[0].payload.qualification.requiresHumanReview, true);
  assert.equal(saved[0].payload.privacy.acknowledged, true);
  assert.equal((await control()).deliveries, 1);
});

for (const mode of ['drop-ack-once', 'bad-ack-once']) {
  test(`${mode}: no false success; replay returns same reference and one durable record`, async () => {
    await control({ mode });
    const payload = { ...sample, idempotencyKey: randomUUID() };
    await expectFailure(await post(payload), 503, 'DELIVERY_UNCONFIRMED');
    assert.equal(records().length, 1);
    await expectReceipt(await post(payload), payload.idempotencyKey);
    assert.equal(records().length, 1);
    assert.equal(records()[0].id, payload.idempotencyKey);
    assert.equal((await control()).deliveries, 2);
  });
}

test('two simultaneous POSTs use one UUID and persist one record', async () => {
  const payload = { ...sample, idempotencyKey: randomUUID() };
  const responses = await Promise.all([post(payload), post(payload)]);
  for (const response of responses) await expectReceipt(response, payload.idempotencyKey);
  assert.equal(records().length, 1);
  assert.equal((await control()).deliveries, 2);
});

test('a changed payload under an existing UUID is rejected before delivery', async () => {
  const payload = { ...sample, idempotencyKey: randomUUID() };
  await expectReceipt(await post(payload), payload.idempotencyKey);
  await expectFailure(await post({ ...payload, city: 'Autre ville de test' }), 409, 'IDEMPOTENCY_CONFLICT');
  assert.equal(records().length, 1);
  assert.equal(records()[0].payload.application.city, sample.city);
  assert.equal((await control()).deliveries, 1);
});

for (const [mode, code, deliveries] of [['webhook-error', 'DELIVERY_UNCONFIRMED', 1], ['redis-error', 'INTAKE_UNAVAILABLE', 0]]) {
  test(`${mode}: no receipt or durable record; same request succeeds after recovery`, async () => {
    await control({ mode });
    const payload = { ...sample, idempotencyKey: randomUUID() };
    await expectFailure(await post(payload), 503, code);
    assert.equal(records().length, 0);
    assert.equal((await control()).deliveries, deliveries);
    await control({ mode: 'normal' });
    await expectReceipt(await post(payload), payload.idempotencyKey);
    assert.equal(records().length, 1);
  });
}

test('real Redis blocks the fourth email attempt without another delivery', async () => {
  for (let i = 0; i < 3; i++) {
    const id = randomUUID();
    await expectReceipt(await post({ ...sample, idempotencyKey: id }), id);
  }
  const limited = await post({ ...sample, idempotencyKey: randomUUID() });
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  await expectFailure(limited, 429, 'RATE_LIMITED');
  assert.equal(records().length, 3);
  assert.equal((await control()).deliveries, 3);
});

test('real Redis blocks the sixth network attempt despite distinct emails', async () => {
  for (let i = 0; i < 5; i++) {
    const id = randomUUID();
    await expectReceipt(await post({ ...sample, email: `camille${i}@example.test`, idempotencyKey: id }), id);
  }
  await expectFailure(await post({ ...sample, email: 'camille5@example.test', idempotencyKey: randomUUID() }), 429, 'RATE_LIMITED');
  assert.equal(records().length, 5);
  assert.equal((await control()).deliveries, 5);
});

test('hostile origins and MIME types cannot reach the real receiver', async () => {
  const payload = { ...sample, idempotencyKey: randomUUID() };
  for (const headers of [{ Origin: 'https://example.invalid' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    await expectFailure(await post(payload, headers), 403, 'ORIGIN_REJECTED');
  }
  for (const headers of [{ 'Content-Type': 'text/plain' }, { 'Content-Type': 'application/jsonx' }, { 'Content-Encoding': 'gzip' }]) {
    await expectFailure(await post(payload, headers), 415, 'UNSUPPORTED_CONTENT_TYPE');
  }
  assert.equal(records().length, 0);
  assert.equal((await control()).deliveries, 0);
});

test('invalid values, injected recipient, honeypot and oversized bodies are rejected before delivery', async () => {
  const payload = { ...sample, idempotencyKey: randomUUID() };
  for (const changes of [{ email: 'invalid' }, { recipient: 'attacker@example.test' }, { website: 'spam' }, { openingTimeline: 'inconnu' }, { rgpd: false }]) {
    await expectFailure(await post({ ...payload, ...changes }), 422, 'VALIDATION_FAILED');
  }
  await expectFailure(await post({ ...payload, message: 'x'.repeat(20_000) }), 413, 'PAYLOAD_TOO_LARGE');
  assert.equal(records().length, 0);
  assert.equal((await control()).deliveries, 0);
});

test('the test services refuse unauthenticated writes and resets', async () => {
  for (const path of ['/control', '/lead', '/redis']) {
    const response = await fetch(`${fixtureUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 401);
  }
  assert.equal(records().length, 0);
  assert.equal((await control()).deliveries, 0);
});

test('the test receiver rejects real-looking recipient data even with valid fixture auth', async () => {
  const response = await fetch(`${fixtureUrl}/lead`, {
    method: 'POST', headers: { Authorization: `Bearer ${settings.webhookToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ schemaVersion: 1, application: { firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.com' } }),
  });
  assert.equal(response.status, 422);
  assert.equal(records().length, 0);
});

test('compiled pages renew their CSP nonce, refuse framing and disable caching/indexing', async () => {
  const nonces = new Set();
  for (const path of ['/', '/confidentialite', '/mentions-legales', '/']) {
    const response = await fetch(`${settings.origin}${path}`, { redirect: 'error' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
    const policy = response.headers.get('content-security-policy') ?? '';
    assert.ok(policy.includes("frame-ancestors 'none'"));
    assert.ok(policy.includes("form-action 'self'"));
    assert.equal(policy.includes("'unsafe-inline'"), false);
    assert.equal(policy.includes("'unsafe-eval'"), false);
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce);
    assert.equal(nonces.has(nonce), false);
    nonces.add(nonce);
    const html = await response.text();
    assert.match(html, /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(match => !/\bsrc=/.test(match[1]) && match[2].trim());
    assert.ok(scripts.length > 0);
    for (const script of scripts) assert.ok(script[1].includes(`nonce="${nonce}"`));
  }
});

test('compiled server does not serve private config or expose candidate reads and foreign CORS', async () => {
  for (const path of ['/.env', '/.env.local', '/.git/config', '/package.json', '/lib/leadConfig.ts', '/lib/leadService.ts', '/.next/server/app/api/lead/route.js']) {
    const response = await fetch(`${settings.origin}${path}`, { redirect: 'manual' });
    assert.ok([403, 404].includes(response.status), `${path} must not be publicly served`);
    await response.body?.cancel();
  }
  const read = await fetch(`${settings.origin}/api/lead`);
  assert.equal(read.status, 405);
  const preflight = await fetch(`${settings.origin}/api/lead`, {
    method: 'OPTIONS', headers: {
      Origin: 'https://example.invalid', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.ok([204, 405].includes(preflight.status));
  assert.equal(preflight.headers.get('access-control-allow-origin'), null);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
  assert.equal(records().length, 0);
});
