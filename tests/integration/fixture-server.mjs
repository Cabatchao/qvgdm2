/** Loopback-only test services. Never import this file from app/ or deploy it. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';
import { DatabaseSync } from 'node:sqlite';

const settings = JSON.parse(readFileSync(process.env.PIZZA_FIXTURE_SETTINGS, 'utf8'));
const database = new DatabaseSync(settings.database);
database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS leads (submission_id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, payload_json TEXT NOT NULL)');
let mode = 'normal';
let deliveries = 0;

function parseResp(buffer, start = 0) {
  const lineEnd = buffer.indexOf('\r\n', start);
  if (lineEnd < 0) return null;
  const type = String.fromCharCode(buffer[start]);
  const line = buffer.toString('utf8', start + 1, lineEnd);
  let next = lineEnd + 2;
  if (type === '+') return { value: line, next };
  if (type === '-') return { value: new Error('Redis command refused'), next };
  if (type === ':') return { value: Number(line), next };
  if (type === '$') {
    const length = Number(line);
    if (length === -1) return { value: null, next };
    if (!Number.isSafeInteger(length) || length < 0) throw new Error('Invalid Redis response');
    if (buffer.length < next + length + 2) return null;
    return { value: buffer.toString('utf8', next, next + length), next: next + length + 2 };
  }
  if (type === '*') {
    const length = Number(line);
    if (!Number.isSafeInteger(length) || length < 0 || length > 100) throw new Error('Invalid Redis array');
    const value = [];
    for (let index = 0; index < length; index++) {
      const entry = parseResp(buffer, next);
      if (!entry) return null;
      value.push(entry.value); next = entry.next;
    }
    return { value, next };
  }
  throw new Error('Unknown Redis response');
}
async function redis(command) {
  const socket = createConnection({ host: '127.0.0.1', port: settings.redisPort });
  let buffer = Buffer.alloc(0);
  const pending = [];
  const rejectPending = error => { for (const item of pending.splice(0)) item.reject(error); };
  socket.on('error', rejectPending);
  socket.on('close', () => rejectPending(new Error('Redis connection closed')));
  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    try {
      while (pending.length) {
        const parsed = parseResp(buffer);
        if (!parsed) break;
        buffer = buffer.subarray(parsed.next);
        const item = pending.shift();
        if (parsed.value instanceof Error) item.reject(parsed.value); else item.resolve(parsed.value);
      }
    } catch (error) { rejectPending(error); socket.destroy(); }
  });
  const timer = setTimeout(() => socket.destroy(new Error('Redis test timeout')), 5_000);
  const send = parts => new Promise((resolve, reject) => {
    pending.push({ resolve, reject });
    const pieces = [`*${parts.length}\r\n`];
    for (const item of parts) { const value = String(item); pieces.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`); }
    socket.write(pieces.join(''));
  });
  try {
    // Wait for successful AUTH before issuing even a read or reset command.
    if (await send(['AUTH', settings.redisPassword]) !== 'OK') throw new Error('Fixture Redis authentication failed');
    return await send(command);
  } finally { clearTimeout(timer); socket.destroy(); }
}
function reply(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) throw new Error('Fixture request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/health' && request.method === 'GET') return reply(response, 200, { ok: true });
    if (request.url === '/control' && request.method === 'POST') {
      if (request.headers.authorization !== `Bearer ${settings.controlToken}`) return reply(response, 401, { ok: false });
      const control = await body(request);
      if (control.reset === true) { await redis(['FLUSHDB']); database.exec('DELETE FROM leads'); deliveries = 0; mode = 'normal'; }
      if (control.mode && ['normal', 'drop-ack-once', 'webhook-error', 'redis-error'].includes(control.mode)) mode = control.mode;
      return reply(response, 200, { ok: true, mode, deliveries });
    }
    if (request.url === '/redis' && request.method === 'POST') {
      if (request.headers.authorization !== `Bearer ${settings.redisToken}`) return reply(response, 401, { error: 'Unauthorized fixture' });
      if (mode === 'redis-error') return reply(response, 503, { error: 'Controlled outage' });
      const command = await body(request);
      if (!Array.isArray(command) || command[0] !== 'EVAL') return reply(response, 400, { error: 'Fixture permits EVAL only' });
      return reply(response, 200, { result: await redis(command) });
    }
    if (request.url === '/lead' && request.method === 'POST') {
      if (request.headers.authorization !== `Bearer ${settings.webhookToken}`) return reply(response, 401, { ok: false });
      deliveries += 1;
      if (mode === 'webhook-error') return reply(response, 503, { ok: false });
      const payload = await body(request);
      // This service can receive synthetic examples only, even on loopback.
      if (payload.schemaVersion !== 1 || payload.application?.firstName !== 'Camille' || payload.application?.lastName !== 'Exemple' || !/^[a-z\d.+_-]+@example\.test$/.test(payload.application?.email ?? '') || request.headers['idempotency-key'] !== payload.submissionId) return reply(response, 422, { ok: false });
      const fingerprint = createHash('sha256').update(JSON.stringify({ application: payload.application, qualification: payload.qualification, notice: payload.privacy?.noticeVersion })).digest('hex');
      database.exec('BEGIN IMMEDIATE');
      try {
        const previous = database.prepare('SELECT fingerprint FROM leads WHERE submission_id = ?').get(payload.submissionId);
        if (previous && previous.fingerprint !== fingerprint) { database.exec('ROLLBACK'); return reply(response, 409, { ok: false }); }
        if (!previous) database.prepare('INSERT INTO leads (submission_id, fingerprint, payload_json) VALUES (?, ?, ?)').run(payload.submissionId, fingerprint, JSON.stringify(payload));
        database.exec('COMMIT');
      } catch (error) { database.exec('ROLLBACK'); throw error; }
      if (mode === 'drop-ack-once') {
        mode = 'normal';
        // The durable commit is complete. Only the response is lost.
        request.socket.destroy();
        return;
      }
      return reply(response, 201, { ok: true, persisted: true, submissionId: payload.submissionId });
    }
    return reply(response, 404, { ok: false });
  } catch { return reply(response, 500, { ok: false, message: 'Controlled fixture error' }); }
});
server.listen(settings.fixturePort, '127.0.0.1', () => process.stdout.write('Fixture HTTP and SQLite ready on loopback\n'));
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close(() => { database.close(); process.exit(0); }));
