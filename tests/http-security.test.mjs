import assert from 'node:assert/strict';
import test from 'node:test';

// A bounded check of the production build served by a separate local process.
// Never aim this test at the historical/public site or at a live receiver.
const address = process.env.PIZZA_ZIO_SECURITY_BASE_URL;
if (!address) throw new Error('Set PIZZA_ZIO_SECURITY_BASE_URL to the closed local production build.');
const base = new URL(address);
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)
  || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('Security surface checks accept only a loopback HTTP origin.');
}
const origin = base.origin;
const get = (path, options = {}) => fetch(new URL(path, origin), {
  ...options, redirect: 'error', signal: AbortSignal.timeout(10_000),
});

test('served HTML prevents framing, sniffing, caching and an attacker-selected script nonce', async () => {
  const attackerNonce = 'synthetic-attacker-selected-nonce';
  const headers = { 'x-nonce': attackerNonce, 'Content-Security-Policy': "script-src 'unsafe-inline'" };
  const first = await get('/', { headers });
  const second = await get('/', { headers });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.headers.get('x-frame-options'), 'DENY');
  assert.equal(first.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(first.headers.get('x-powered-by'), null);
  assert.match(first.headers.get('cache-control') ?? '', /no-store/);
  const policy = first.headers.get('content-security-policy') ?? '';
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /base-uri 'none'/);
  assert.match(policy, /form-action 'self'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|synthetic-attacker-selected-nonce/);
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  const secondNonce = second.headers.get('content-security-policy')?.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce && secondNonce);
  assert.notEqual(nonce, secondNonce);
  assert.equal(Buffer.from(nonce, 'base64').length, 24);
  assert.equal((await first.text()).includes(attackerNonce), false);
  await second.body?.cancel();
});

test('the closed build cannot collect a candidate or offer cross-origin access', async () => {
  const closed = await get('/api/lead', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Recette', email: 'synthetic@example.test' }),
  });
  assert.equal(closed.status, 503);
  assert.equal(closed.headers.get('cache-control'), 'no-store');
  assert.deepEqual((({ ok, code }) => ({ ok, code }))(await closed.json()), {
    ok: false, code: 'INTAKE_UNAVAILABLE',
  });
  const read = await get('/api/lead');
  assert.equal(read.status, 405);
  const preflight = await get('/api/lead', {
    method: 'OPTIONS',
    headers: { Origin: 'https://other.example.test', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  assert.ok([204, 405].includes(preflight.status));
  assert.equal(preflight.headers.get('access-control-allow-origin'), null);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
});

test('the served build does not expose configuration, source files or Git metadata', async () => {
  for (const path of ['/.env', '/.env.local', '/.git/config', '/package.json', '/lib/leadConfig.ts', '/lib/leadService.ts', '/.next/server/app/api/lead/route.js']) {
    const response = await get(path);
    assert.ok([403, 404].includes(response.status), `${path}: unexpected public status`);
    await response.body?.cancel(); // Never print a potentially sensitive response.
  }
});

test('only same-origin browser scripts are served without receiver settings or source maps', async () => {
  const response = await get('/');
  const html = await response.text();
  const scripts = [...new Set([...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]))];
  assert.ok(scripts.length > 0);
  for (const source of scripts) {
    const url = new URL(source, origin);
    assert.equal(url.origin, origin, 'No external browser script should be requested by this build');
    const script = await get(url.pathname + url.search);
    assert.equal(script.status, 200);
    const body = await script.text();
    const privateSettings = /LEAD_WEBHOOK_TOKEN|UPSTASH_REDIS_REST_TOKEN|LEAD_HASH_SECRET|LEAD_SHEET_PRIVATE_KEY|LEAD_SHEET_CLIENT_EMAIL|LEAD_SHEET_ID|RATE_LIMIT_SCRIPT|-----BEGIN (?:RSA )?PRIVATE KEY-----/;
    assert.equal(privateSettings.test(body), false, 'A served script contains a server configuration marker');
    assert.equal(/sourceMappingURL=.*\.map(?:\s|$)/.test(body), false, 'A served script advertises a source map');
  }
});
