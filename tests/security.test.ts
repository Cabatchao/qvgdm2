import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { getLeadConfig, type LeadConfig } from '../lib/leadConfig';
import { handleLeadRequest, RATE_LIMIT_SCRIPT } from '../lib/leadService';

const origin = 'https://franchise.example.test';
const id = 'b1063f02-ed70-4f50-b5e2-9e60c17c97ee';
const fixture = {
  firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.test', phone: '',
  city: 'Ville de test', department: '', personalContribution: '', estimatedBudget: '',
  hasRestaurantExperience: 'Oui', hasEntrepreneurExperience: 'Non', openingTimeline: '6-12 mois',
  localStatus: 'En recherche', operatorModel: 'Oui', format: 'Je ne sais pas encore',
  motivation: 'Candidature synthétique de sécurité uniquement.', message: '', rgpd: true, website: '', idempotencyKey: id,
};
const config: LeadConfig = {
  origin, webhookUrl: 'https://receiver.example.test/lead', webhookToken: 'fixture-webhook-token-not-a-real-secret-123',
  redisUrl: 'https://redis.example.test', redisToken: 'fixture-redis-token',
  hashSecret: 'fixture-hmac-secret-not-a-real-secret-456', vercel: true,
};
type Call = { url: string; init: RequestInit };
function upstream() {
  const calls: Call[] = [];
  const fetcher: typeof fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url) === config.redisUrl) return Response.json({ result: [1, 0] });
    const payload = JSON.parse(String(init.body));
    return Response.json({ ok: true, persisted: true, submissionId: payload.submissionId }, { status: 201 });
  };
  return { calls, fetcher };
}
function request(body: unknown = fixture, changes: Record<string, string> = {}) {
  return rawRequest(JSON.stringify(body), changes);
}
function rawRequest(body: BodyInit, changes: Record<string, string> = {}) {
  return new Request(`${origin}/api/lead`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin, 'x-vercel-forwarded-for': '192.0.2.11', ...changes },
    body, duplex: 'half',
  } as RequestInit);
}
function stream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } });
}
function redisCommands(calls: Call[]) {
  return calls.filter(call => call.url === config.redisUrl).map(call => JSON.parse(String(call.init.body)) as string[]);
}
function assertNoReflection(value: unknown, canaries: readonly string[]) {
  if (typeof value === 'string') {
    for (const canary of canaries) assert.equal(value.includes(canary), false, 'A response must not reflect submitted text');
  } else if (Array.isArray(value)) {
    for (const item of value) assertNoReflection(item, canaries);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      assertNoReflection(key, canaries);
      assertNoReflection(item, canaries);
    }
  }
}

test('security: fragmented request bounds use bytes even with a lying Content-Length', async () => {
  const network = upstream();
  const large = new TextEncoder().encode(JSON.stringify({ ...fixture, message: 'é'.repeat(9_000) }));
  const result = await handleLeadRequest(rawRequest(stream([large.slice(0, 8_000), large.slice(8_000)]), { 'content-length': '1' }), config, network.fetcher);
  assert.equal(result.status, 413);
  assert.equal(network.calls.length, 0);
  assert.equal((await result.json()).ok, false);
});

test('security: invalid UTF-8 and incomplete JSON fail before external calls', async () => {
  for (const body of [new Uint8Array([0x7b, 0x22, 0xff, 0x22, 0x3a, 0x31, 0x7d]), new TextEncoder().encode('{"firstName":')]) {
    const network = upstream();
    const result = await handleLeadRequest(rawRequest(stream([body])), config, network.fetcher);
    assert.equal(result.status, 400);
    assert.equal(network.calls.length, 0);
  }
});

test('security: JSON shape and prototype-pollution keys cannot reach the receiver', async () => {
  const objects = ['null', 'true', '0', '[]', '"text"', JSON.stringify(fixture).replace(/}$/, ',"__proto__":{"polluted":true}}'), JSON.stringify({ ...fixture, constructor: { prototype: { polluted: true } } })];
  for (const body of objects) {
    const network = upstream();
    const result = await handleLeadRequest(rawRequest(body), config, network.fetcher);
    assert.equal(result.status, 422);
    assert.equal(network.calls.length, 0);
    assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted'), false);
  }
});

test('security: unknown mass-assignment fields cannot supply score, recipient or approval', async () => {
  for (const key of ['score', 'approved', 'role', 'recipient', 'webhookUrl', 'persisted', 'submissionId', 'headers']) {
    const network = upstream();
    const result = await handleLeadRequest(request({ ...fixture, [key]: 'attacker controlled' }), config, network.fetcher);
    assert.equal(result.status, 422);
    assert.equal(network.calls.length, 0);
  }
});

test('security: missing, null, lookalike and multiple origins are refused', async () => {
  for (const value of ['', 'null', `${origin}.attacker.test`, `${origin}/`, `${origin}, https://other.example.test`, new URL('https://franchıse.example.test').origin]) {
    const network = upstream();
    const result = await handleLeadRequest(request(fixture, { origin: value }), config, network.fetcher);
    assert.equal(result.status, 403);
    assert.equal(network.calls.length, 0);
  }
});

test('security: form posts and misleading JSON MIME types cannot bypass request checks', async () => {
  for (const value of ['application/jsonx', 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=test', 'application/json, text/plain']) {
    const network = upstream();
    assert.equal((await handleLeadRequest(request(fixture, { 'content-type': value }), config, network.fetcher)).status, 415);
    assert.equal(network.calls.length, 0);
  }
});

test('security: proxy headers are ignored outside a trusted Vercel runtime', async () => {
  const network = upstream();
  const outside = { ...config, vercel: false };
  await handleLeadRequest(request(fixture, { 'x-forwarded-for': '192.0.2.21', 'x-real-ip': '192.0.2.22', 'x-vercel-forwarded-for': '192.0.2.23' }), outside, network.fetcher);
  await handleLeadRequest(request(fixture, { 'x-forwarded-for': '198.51.100.31', 'x-real-ip': '198.51.100.32', 'x-vercel-forwarded-for': '198.51.100.33' }), outside, network.fetcher);
  const commands = redisCommands(network.calls);
  assert.equal(commands.length, 2);
  assert.equal(commands[0][3], commands[1][3]);
  assert.equal(JSON.stringify(commands).includes('192.0.2.'), false);
});

test('security: IP lists and malformed trusted headers share the conservative bucket', async () => {
  const network = upstream();
  await handleLeadRequest(request(fixture, { 'x-vercel-forwarded-for': '192.0.2.1, 192.0.2.2' }), config, network.fetcher);
  await handleLeadRequest(request(fixture, { 'x-vercel-forwarded-for': 'not-an-ip' }), config, network.fetcher);
  const commands = redisCommands(network.calls);
  assert.equal(commands[0][3], commands[1][3]);
});

test('security: equivalent Unicode and email case cannot split the idempotence fingerprint', async () => {
  const network = upstream();
  await handleLeadRequest(request({ ...fixture, firstName: 'Élodie', email: 'CAMILLE@example.test' }), config, network.fetcher);
  await handleLeadRequest(request({ ...fixture, firstName: 'E\u0301lodie', email: 'camille@example.test' }), config, network.fetcher);
  const commands = redisCommands(network.calls);
  assert.equal(commands[0][4], commands[1][4]);
  assert.equal(commands[0][13], commands[1][13]);
});

test('security: quota state responses with strings, excessive TTL or wrong shape fail closed', async () => {
  for (const result of [['1', 0], [1, '0'], [1, 0, 'extra'], [0, 0], [0, 3601], [0, Number.NaN], [-1, 'invalid']]) {
    let delivered = false;
    const fetcher: typeof fetch = async (url) => {
      if (String(url) !== config.redisUrl) delivered = true;
      return Response.json({ result });
    };
    const response = await handleLeadRequest(request(), config, fetcher);
    assert.ok([409, 503].includes(response.status));
    assert.equal(delivered, false);
    assert.equal((await response.json()).ok, false);
  }
});

test('security: an oversized rate-service reply is rejected without forwarding the application', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return Response.json({ result: [1, 0], junk: 'x'.repeat(5000) }); };
  const result = await handleLeadRequest(request(), config, fetcher);
  assert.equal(result.status, 503);
  assert.equal(calls, 1);
});

test('security: free-text markup is never reflected in success or validation responses', async () => {
  const canary = 'security-markup-canary';
  const marker = `<img src=x onerror=alert("${canary}")>`;
  const network = upstream();
  const accepted = await handleLeadRequest(request({ ...fixture, message: marker }), config, network.fetcher);
  assert.equal(accepted.status, 201);
  assertNoReflection(await accepted.json(), [marker, canary]);
  const invalid = await handleLeadRequest(request({ ...fixture, email: marker }), config, network.fetcher);
  assert.equal(invalid.status, 422);
  assertNoReflection(await invalid.json(), [marker, canary]);
  const receiver = network.calls.find(call => call.url === config.webhookUrl);
  assert.equal(JSON.parse(String(receiver?.init.body)).application.message, marker);
  // This proves transport as JSON text, not safe rendering by an unconnected CRM.
});

test('security: header injection and invisible control bytes are refused in identity fields', async () => {
  for (const [firstName, canary] of [
    ['Camille\r\nBcc: security-crlf-canary@example.test', 'security-crlf-canary'],
    ['Camille\u0000security-nul-canary', 'security-nul-canary'],
    ['Camille\u001b[31msecurity-escape-canary', 'security-escape-canary'],
  ]) {
    const network = upstream();
    const response = await handleLeadRequest(request({ ...fixture, firstName }), config, network.fetcher);
    assert.equal(response.status, 422);
    assert.equal(network.calls.length, 0);
    assertNoReflection(await response.json(), [firstName, canary]);
  }
});

test('security: random malformed field types do not throw or call an external service', async () => {
  const malformed: unknown[] = [[], {}, true, false, 0, 1e100, null];
  for (const firstName of malformed) {
    const network = upstream();
    const response = await handleLeadRequest(request({ ...fixture, firstName, idempotencyKey: randomUUID() }), config, network.fetcher);
    assert.equal(response.status, 422);
    assert.equal(network.calls.length, 0);
  }
});

test('security: configuration prevents literal internal hosts, URL credentials and newline tokens', () => {
  const env = { LEAD_INTAKE_ENABLED: 'true', LEAD_ALLOWED_ORIGIN: origin, LEAD_WEBHOOK_URL: config.webhookUrl, LEAD_WEBHOOK_TOKEN: config.webhookToken, UPSTASH_REDIS_REST_URL: config.redisUrl, UPSTASH_REDIS_REST_TOKEN: config.redisToken, LEAD_HASH_SECRET: config.hashSecret };
  for (const url of ['https://127.1/hook', 'https://2130706433/hook', 'https://[::ffff:127.0.0.1]/hook', 'https://service.internal/hook', 'https://service.local/hook', 'https://user:pass@external.example.test/hook']) {
    assert.equal(getLeadConfig({ ...env, LEAD_WEBHOOK_URL: url }, true), null);
  }
  assert.equal(getLeadConfig({ ...env, LEAD_WEBHOOK_TOKEN: `${config.webhookToken}\r\nInjected: x` }, true), null);
  assert.equal(getLeadConfig({ ...env, UPSTASH_REDIS_REST_TOKEN: 'fixture\nInjected: x' }, true), null);
});


// Optional real-engine checks. The binary is supplied by the test operator; no
// external service is contacted and the private Redis instance is always stopped.
if (process.env.PIZZA_ZIO_REDIS_BIN) {
  test('security: real Redis engine enforces atomic quotas, TTL and payload binding', { timeout: 30_000 }, async (t) => {
    const serverPath = process.env.PIZZA_ZIO_REDIS_BIN!;
    const cliPath = join(dirname(serverPath), 'redis-cli');
    const directory = await mkdtemp(join(tmpdir(), 'pizza-zio-security-'));
    const port = '6392'; // Separate from the HTTP integration fixture (6391).
    const server = spawn(serverPath, ['--bind', '127.0.0.1', '--port', port, '--dir', directory, '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
    const exited = new Promise<void>((resolve) => server.once('exit', () => resolve()));
    let startupError: Error | undefined;
    server.on('error', error => { startupError = error; });
    const execute = promisify(execFile);
    async function redis(...args: string[]): Promise<unknown> {
      const { stdout } = await execute(cliPath, ['--json', '-h', '127.0.0.1', '-p', port, ...args], { timeout: 3_000, maxBuffer: 64 * 1024 });
      return args[0] === 'INFO' ? stdout : JSON.parse(stdout);
    }
    const keys = ['security:ip', 'security:email', 'security:all', 'security:id'];
    async function evaluate(overrides: string[] = keys, payload = 'fixture-hmac-payload') {
      return await redis('EVAL', RATE_LIMIT_SCRIPT, '4', ...overrides, '900', '5', '3600', '3', '900', '100', payload, '86400') as number[];
    }
    try {
      let ready = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        if (startupError) throw startupError;
        try { ready = await redis('PING') === 'PONG'; if (ready) break; } catch { /* Wait for our loopback instance only. */ }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.equal(ready, true, 'The isolated Redis instance must start');
      assert.equal(server.exitCode, null, 'Our Redis process must still be alive');
      const info = String(await redis('INFO', 'SERVER'));
      assert.match(info, new RegExp(`process_id:${server.pid}\\r?\\n`), 'Never flush an unrelated local Redis');
      await t.test('accepted request stores expiring counters and a payload binding', async () => {
        await redis('FLUSHDB');
        assert.deepEqual(await evaluate(), [1, 0]);
        assert.equal(await redis('GET', keys[3]), 'fixture-hmac-payload');
        assert.ok(Number(await redis('TTL', keys[0])) > 0);
        assert.ok(Number(await redis('TTL', keys[1])) > 0);
        assert.ok(Number(await redis('TTL', keys[3])) > 0);
      });
      await t.test('sixth same-IP attempt is blocked despite distinct emails', async () => {
        await redis('FLUSHDB');
        for (let i = 0; i < 5; i++) assert.deepEqual(await evaluate([keys[0], `email:${i}`, keys[2], `id:${i}`]), [1, 0]);
        const rejected = await evaluate([keys[0], 'email:6', keys[2], 'id:6']);
        assert.equal(rejected[0], 0); assert.ok(rejected[1] >= 1);
      });
      await t.test('fourth same-email attempt is blocked despite distinct IPs', async () => {
        await redis('FLUSHDB');
        for (let i = 0; i < 3; i++) assert.deepEqual(await evaluate([`ip:${i}`, keys[1], keys[2], `id:${i}`]), [1, 0]);
        assert.equal((await evaluate(['ip:4', keys[1], keys[2], 'id:4']))[0], 0);
      });
      await t.test('global quota applies across independent addresses and emails', async () => {
        await redis('FLUSHDB');
        for (let i = 0; i < 100; i++) assert.deepEqual(await evaluate([`ip:${i}`, `email:${i}`, keys[2], `id:${i}`]), [1, 0]);
        assert.equal((await evaluate(['ip:101', 'email:101', keys[2], 'id:101']))[0], 0);
      });
      await t.test('twenty concurrent attempts cannot exceed the five-request IP quota', async () => {
        await redis('FLUSHDB');
        const results = await Promise.all(Array.from({ length: 20 }, (_, i) => evaluate([keys[0], `email:${i}`, keys[2], `id:${i}`])));
        assert.equal(results.filter(result => result[0] === 1).length, 5);
        assert.equal(results.filter(result => result[0] === 0).length, 15);
      });
      await t.test('conflicting payload is refused before counters or binding change', async () => {
        await redis('FLUSHDB');
        assert.deepEqual(await evaluate(), [1, 0]);
        assert.deepEqual(await evaluate(keys, 'other-payload'), [-1, 0]);
        assert.equal(await redis('GET', keys[0]), '1');
        assert.equal(await redis('GET', keys[3]), 'fixture-hmac-payload');
      });
      await t.test('an expiring counter with TTL zero still blocks excess traffic', async () => {
        await redis('FLUSHDB');
        await redis('SET', keys[0], '5', 'PX', '300');
        assert.equal(await redis('TTL', keys[0]), 0);
        assert.deepEqual(await evaluate(), [0, 1]);
      });
      await t.test('a counter missing its expiration is repaired and still enforced', async () => {
        await redis('FLUSHDB');
        await redis('SET', keys[0], '5');
        assert.equal(await redis('TTL', keys[0]), -1);
        const result = await evaluate();
        assert.equal(result[0], 0); assert.ok(result[1] >= 1);
        assert.ok(Number(await redis('TTL', keys[0])) > 0);
      });
    } finally {
      server.kill('SIGTERM');
      await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 2_000))]);
      if (server.exitCode === null) server.kill('SIGKILL');
      await rm(directory, { recursive: true, force: true });
    }
  });
}
