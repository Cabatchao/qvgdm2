import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLeadConfig, isLeadIntakeReady, type LeadConfig } from '../lib/leadConfig';
import { handleLeadRequest } from '../lib/leadService';
import { parseEuroAmount, validateLead } from '../lib/leadValidation';
import { qualifyLead } from '../lib/scoreLead';
import { getLaunchReadiness, launchConfig, type LaunchConfiguration } from '../data/launchConfig';

const id = 'f07a8409-350d-4b26-aec9-82521e09584f';
const form = {
  firstName: 'Camille', lastName: 'Exemple', email: 'candidate@example.com', phone: '', city: 'Lille', department: '',
  personalContribution: '', estimatedBudget: '', hasRestaurantExperience: 'Oui', hasEntrepreneurExperience: 'Non',
  openingTimeline: '6-12 mois', localStatus: 'En recherche', operatorModel: 'Oui', format: 'Je ne sais pas encore',
  motivation: 'Je souhaite étudier ce projet.', message: '', rgpd: true, website: '', idempotencyKey: id,
};
const config: LeadConfig = {
  origin: 'https://franchise.example.com', webhookUrl: 'https://crm.example.com/lead', webhookToken: 'test-webhook-token-that-is-not-a-real-secret',
  redisUrl: 'https://redis.example.com', redisToken: 'test-redis-token', hashSecret: 'test-hmac-secret-that-is-not-a-real-secret', vercel: true,
};
const env = {
  LEAD_INTAKE_ENABLED: 'true', LEAD_ALLOWED_ORIGIN: config.origin, LEAD_WEBHOOK_URL: config.webhookUrl,
  LEAD_WEBHOOK_TOKEN: config.webhookToken, UPSTASH_REDIS_REST_URL: config.redisUrl, UPSTASH_REDIS_REST_TOKEN: config.redisToken, LEAD_HASH_SECRET: config.hashSecret,
};
function request(body: unknown = form, headers: Record<string, string> = {}) {
  return new Request(`${config.origin}/api/lead`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: config.origin, 'x-vercel-forwarded-for': '198.51.100.42', ...headers }, body: JSON.stringify(body) });
}
type Call = { url: string; init: RequestInit };
function upstream(ack: object = { ok: true, persisted: true, submissionId: id }, rateResult: unknown = [1, 0]) {
  const calls: Call[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (String(url) === config.redisUrl) return Response.json({ result: rateResult });
    return Response.json(ack, { status: 201 });
  };
  return { calls, fetcher };
}

test('money parser handles French euro amounts exactly and keeps unknown distinct from zero', () => {
  for (const value of ['30000', '30 000', '30\u00a0000', '30\u202f000', '30000,00', '30 000.00']) assert.equal(parseEuroAmount(value), 30000, value);
  assert.equal(parseEuroAmount('30 000,75'), 30000.75);
  assert.equal(parseEuroAmount('0'), 0);
  assert.equal(parseEuroAmount(''), null);
  assert.equal(parseEuroAmount('   '), null);
});

test('money parser rejects ambiguous, shorthand, negative and non-string values', () => {
  for (const value of ['30k', '30.000', '1,234', '3 00', '1e5', '-10', '€30000', 'Infinity', 'NaN', '1000000000', {}, 30000, null]) assert.equal(parseEuroAmount(value), undefined, String(value));
});

test('validation accepts unknown finances and optional phone', () => {
  const result = validateLead(form);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.personalContribution, null);
  assert.equal(result.data.estimatedBudget, null);
  assert.equal(result.data.phone, '');
  const qualified = qualifyLead(result.data);
  assert.equal(qualified.requiresHumanReview, true);
  assert.equal(qualified.contributionKnown, false);
  assert.equal('score' in qualified, false);
});

test('validation rejects malformed field types, unknown enum and unacknowledged notice', () => {
  const result = validateLead({ ...form, email: 'not-email', personalContribution: '30k', operatorModel: 'Investor', rgpd: 'true', firstName: [] });
  assert.equal(result.ok, false);
  if (result.ok) return;
  for (const field of ['email', 'personalContribution', 'operatorModel', 'rgpd', 'firstName']) assert.ok(result.fieldErrors[field]);
});

test('validation rejects hidden extra fields and a filled honeypot', () => {
  assert.equal(validateLead({ ...form, score: 100 }).ok, false);
  assert.equal(validateLead({ ...form, website: 'spam.example.com' }).ok, false);
});

test('validation bounds free text, rejects control characters and bad phone', () => {
  assert.equal(validateLead({ ...form, motivation: 'x'.repeat(2001) }).ok, false);
  assert.equal(validateLead({ ...form, firstName: 'Hello\r\nBcc:bad' }).ok, false);
  assert.equal(validateLead({ ...form, phone: '+33123456789' }).ok, true);
  assert.equal(validateLead({ ...form, phone: '123' }).ok, false);
});

test('readiness requires BOTH public review and complete private configuration', () => {
  assert.equal(getLeadConfig(env, false), null);
  assert.equal(getLeadConfig({ ...env, LEAD_INTAKE_ENABLED: 'false' }, true), null);
  assert.equal(getLeadConfig({ ...env, LEAD_WEBHOOK_TOKEN: '' }, true), null);
  assert.equal(getLeadConfig({ ...env, LEAD_HASH_SECRET: 'short' }, true), null);
  assert.equal(getLeadConfig({ ...env, UPSTASH_REDIS_REST_TOKEN: '' }, true), null);
  assert.ok(getLeadConfig(env, true));
  assert.equal(isLeadIntakeReady(), false); // The repository's launch data is deliberately unapproved.
});

test('public readiness requires complete facts, explicit approval and tested operations', () => {
  const ready: LaunchConfiguration = structuredClone(launchConfig);
  ready.approved = true;
  for (const key of Object.keys(ready.legal) as (keyof typeof ready.legal)[]) ready.legal[key] = 'Fixture validée pour le test';
  for (const key of Object.keys(ready.privacy) as (keyof typeof ready.privacy)[]) ready.privacy[key] = 'Fixture validée pour le test';
  ready.operations = { availableTerritories: ['Ville de test'], writtenFollowUpOwnerConfirmed: true, receivingSystemTested: true };
  assert.equal(getLaunchReadiness(ready).ready, true);
  assert.equal(getLaunchReadiness({ ...ready, approved: false }).ready, false);
  assert.equal(getLaunchReadiness({ ...ready, operations: { ...ready.operations, receivingSystemTested: false } }).ready, false);
  assert.equal(getLaunchReadiness({ ...ready, operations: { ...ready.operations, availableTerritories: [] } }).ready, false);
  for (const placeholder of [null, '', '   ', 'À confirmer par l’équipe Pizza Zio', 'TODO', 'placeholder']) {
    assert.equal(getLaunchReadiness({ ...ready, legal: { ...ready.legal, publisherIdentity: placeholder } }).ready, false);
    assert.equal(getLaunchReadiness({ ...ready, privacy: { ...ready.privacy, retention: placeholder } }).ready, false);
  }
});

test('configuration rejects insecure URLs, embedded credentials, query tokens and ambiguous origins', () => {
  for (const webhookUrl of ['http://crm.example.com', 'https://user:secret@crm.example.com', 'https://crm.example.com?token=secret', 'https://localhost/hook', 'https://127.0.0.1/hook', 'https://[::1]/hook', 'https://169.254.169.254/metadata']) {
    assert.equal(getLeadConfig({ ...env, LEAD_WEBHOOK_URL: webhookUrl }, true), null);
  }
  assert.equal(getLeadConfig({ ...env, LEAD_ALLOWED_ORIGIN: 'https://franchise.example.com/path' }, true), null);
});

test('closed intake never calls an external service or reports success', async () => {
  const network = upstream();
  const result = await handleLeadRequest(request(), null, network.fetcher);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).ok, false);
  assert.equal(network.calls.length, 0);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('cross-origin and unsupported content types fail before any external request', async () => {
  const network = upstream();
  assert.equal((await handleLeadRequest(request(form, { Origin: 'https://attacker.example' }), config, network.fetcher)).status, 403);
  assert.equal((await handleLeadRequest(request(form, { 'sec-fetch-site': 'cross-site' }), config, network.fetcher)).status, 403);
  assert.equal((await handleLeadRequest(request(form, { 'Content-Type': 'text/plain' }), config, network.fetcher)).status, 415);
  assert.equal((await handleLeadRequest(request(form, { 'Content-Encoding': 'gzip' }), config, network.fetcher)).status, 415);
  assert.equal(network.calls.length, 0);
});

test('body size is enforced without trusting content-length', async () => {
  const network = upstream();
  assert.equal((await handleLeadRequest(request({ ...form, motivation: 'x'.repeat(20000) }), config, network.fetcher)).status, 413);
  assert.equal((await handleLeadRequest(request(form, { 'Content-Length': '99999' }), config, network.fetcher)).status, 413);
  assert.equal(network.calls.length, 0);
});

test('invalid JSON and validation errors never contact the destination', async () => {
  const network = upstream();
  const invalid = new Request(`${config.origin}/api/lead`, { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal((await handleLeadRequest(invalid, config, network.fetcher)).status, 400);
  const result = await handleLeadRequest(request({ ...form, email: 'invalid' }), config, network.fetcher);
  assert.equal(result.status, 422);
  assert.ok((await result.json()).fieldErrors.email);
  assert.equal(network.calls.length, 0);
});

test('success requires persistence acknowledgement and sends normalized qualification server-side', async () => {
  const network = upstream();
  const result = await handleLeadRequest(request({ ...form, personalContribution: '30 000,00' }), config, network.fetcher);
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { ok: true, submissionId: id });
  assert.equal(network.calls.length, 2);
  const delivered = JSON.parse(String(network.calls[1].init.body));
  assert.equal(delivered.application.personalContribution, 30000);
  assert.equal(delivered.qualification.requiresHumanReview, true);
  assert.equal(delivered.privacy.acknowledged, true);
  assert.equal(delivered.submissionId, id);
  assert.equal(delivered.application.website, undefined);
  assert.equal(delivered.application.idempotencyKey, undefined);
  assert.equal(network.calls[1].init.redirect, 'error');
  assert.equal(new Headers(network.calls[1].init.headers).get('Idempotency-Key'), id);
  assert.equal(new Headers(network.calls[1].init.headers).get('Authorization'), `Bearer ${config.webhookToken}`);
});

test('Redis payload contains no clear email, raw IP or application content', async () => {
  const network = upstream();
  await handleLeadRequest(request(), config, network.fetcher);
  const payload = String(network.calls[0].init.body);
  assert.equal(payload.includes(form.email), false);
  assert.equal(payload.includes('198.51.100.42'), false);
  assert.equal(payload.includes(form.motivation), false);
  assert.equal(JSON.parse(payload)[0], 'EVAL');
});

test('a distributed rate limit response blocks delivery and includes Retry-After', async () => {
  const network = upstream(undefined, [0, 900]);
  const result = await handleLeadRequest(request(), config, network.fetcher);
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('Retry-After'), '900');
  assert.equal(network.calls.length, 1);
});

test('reusing an idempotency key with changed payload cannot reach the webhook', async () => {
  const network = upstream(undefined, [-1, 0]);
  const result = await handleLeadRequest(request(), config, network.fetcher);
  assert.equal(result.status, 409);
  assert.equal(network.calls.length, 1);
});

test('rate limiter network failure and malformed replies fail closed', async () => {
  const failed: typeof fetch = async () => { throw new Error('offline'); };
  assert.equal((await handleLeadRequest(request(), config, failed)).status, 503);
  for (const reply of [null, 'OK', [1], [0, -1], [1, 20]]) {
    const network = upstream(undefined, reply);
    assert.equal((await handleLeadRequest(request(), config, network.fetcher)).status, 503);
    assert.equal(network.calls.length, 1);
  }
});

test('HTTP success without an exact persisted ACK never becomes a false form success', async () => {
  for (const ack of [{}, { ok: true }, { ok: true, persisted: false, submissionId: id }, { ok: true, persisted: true, submissionId: 'different' }]) {
    const network = upstream(ack);
    const result = await handleLeadRequest(request(), config, network.fetcher);
    assert.equal(result.status, 503);
    assert.equal((await result.json()).code, 'DELIVERY_UNCONFIRMED');
  }
});

test('pending, non-JSON, misleading MIME and oversized acknowledgements are not accepted', async () => {
  const ack = { ok: true, persisted: true, submissionId: id };
  for (const [status, contentType, body] of [
    [202, 'application/json', JSON.stringify(ack)],
    [500, 'application/json', JSON.stringify(ack)],
    [200, 'text/html', JSON.stringify(ack)],
    [200, 'application/jsonx', JSON.stringify(ack)],
    [200, 'application/json', JSON.stringify({ ...ack, extra: 'x'.repeat(5000) })],
  ] as const) {
    const fetcher: typeof fetch = async (url) => String(url) === config.redisUrl
      ? Response.json({ result: [1, 0] })
      : new Response(body, { status, headers: { 'Content-Type': contentType } });
    const result = await handleLeadRequest(request(), config, fetcher);
    assert.equal(result.status, 503);
    assert.equal((await result.json()).code, 'DELIVERY_UNCONFIRMED');
  }
});

test('timeout after remote receipt returns uncertainty and preserves retry identity', async () => {
  const network = upstream();
  const timedOut: typeof fetch = async (url, init) => {
    if (String(url) === config.redisUrl) return network.fetcher(url, init);
    throw new DOMException('Timeout', 'TimeoutError');
  };
  const result = await handleLeadRequest(request(), config, timedOut);
  assert.equal(result.status, 503);
  const body = await result.json();
  assert.equal(body.code, 'DELIVERY_UNCONFIRMED');
  assert.match(body.message, /sans modifier/);
});

test('retry after lost acknowledgement uses the same UUID and the destination can deduplicate atomically', async () => {
  const records = new Map<string, object>();
  let attempts = 0;
  const fetcher: typeof fetch = async (url, init) => {
    if (String(url) === config.redisUrl) return Response.json({ result: [1, 0] });
    const payload = JSON.parse(String(init?.body));
    const key = new Headers(init?.headers).get('Idempotency-Key');
    assert.equal(key, payload.submissionId);
    if (!records.has(key!)) records.set(key!, payload); // Model a durable unique-key destination.
    attempts += 1;
    if (attempts === 1) throw new DOMException('ACK lost', 'TimeoutError');
    return Response.json({ ok: true, persisted: true, submissionId: key });
  };
  assert.equal((await handleLeadRequest(request(), config, fetcher)).status, 503);
  assert.equal((await handleLeadRequest(request(), config, fetcher)).status, 201);
  assert.equal(attempts, 2);
  assert.equal(records.size, 1);
});

test('UUIDs are canonicalized and upstream error details never expose personal information', async () => {
  const network = upstream();
  const success = await handleLeadRequest(request({ ...form, idempotencyKey: id.toUpperCase() }), config, network.fetcher);
  assert.equal((await success.json()).submissionId, id);
  const failed: typeof fetch = async () => { throw new Error(`Sensitive error: ${form.email} ${config.redisToken}`); };
  const result = await handleLeadRequest(request(), config, failed);
  const body = await result.text();
  assert.equal(body.includes(form.email), false);
  assert.equal(body.includes(config.redisToken), false);
});
