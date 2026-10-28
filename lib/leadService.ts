import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { PRIVACY_NOTICE_VERSION } from '../data/launchConfig';
import type { LeadConfig } from './leadConfig';
import { qualifyLead } from './scoreLead';
import { validateLead, type ValidatedLead } from './leadValidation';

const MAX_REQUEST_BYTES = 16_384;
const MAX_RESPONSE_BYTES = 4_096;
const WINDOW_SECONDS = 900;
const IDEMPOTENCY_TTL = 86_400;

// One atomic Redis script: distributed limits + payload binding for each request UUID.
// Only HMACs, counters and expirations are stored; no raw IP, email or application.
export const RATE_LIMIT_SCRIPT = `
local previous = redis.call('GET', KEYS[4])
if previous and previous ~= ARGV[7] then return {-1, 0} end
local retry = 0
for i = 1, 3 do
  local count = redis.call('INCR', KEYS[i])
  local ttl = tonumber(ARGV[i * 2 - 1])
  local remaining = redis.call('TTL', KEYS[i])
  if remaining < 0 then
    redis.call('EXPIRE', KEYS[i], ttl)
    remaining = ttl
  end
  if count > tonumber(ARGV[i * 2]) then
    remaining = math.max(1, remaining)
    if remaining > retry then retry = remaining end
  end
end
if retry > 0 then return {0, retry} end
redis.call('SET', KEYS[4], ARGV[7], 'EX', ARGV[8])
return {1, 0}
`;

type Fetcher = typeof fetch;

class LeadFailure extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter?: number) {
    super(message);
  }
}

function response(status: number, body: object, retryAfter?: number): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
    },
  });
}

async function readBoundedJson(source: Request | Response, maxBytes: number): Promise<unknown> {
  const declared = source.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new LeadFailure(413, 'PAYLOAD_TOO_LARGE', 'Le formulaire dépasse la taille autorisée.');
  }
  const reader = source.body?.getReader();
  if (!reader) throw new LeadFailure(400, 'INVALID_JSON', 'Le formulaire est invalide.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new LeadFailure(413, 'PAYLOAD_TOO_LARGE', 'Le formulaire dépasse la taille autorisée.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); }
  catch { throw new LeadFailure(400, 'INVALID_JSON', 'Le formulaire est invalide.'); }
}

function hash(config: LeadConfig, purpose: string, input: string): string {
  return createHmac('sha256', config.hashSecret).update(`${purpose}:${input}`).digest('hex');
}

function clientBucket(request: Request, config: LeadConfig): string {
  // Vercel overwrites this header at its edge. Never trust arbitrary proxy headers elsewhere.
  const ip = config.vercel ? request.headers.get('x-vercel-forwarded-for')?.trim() : undefined;
  return ip && isIP(ip) ? ip : 'shared-untrusted-proxy';
}

export async function enforceLeadLimits(request: Request, lead: ValidatedLead, config: LeadConfig, fetcher: Fetcher): Promise<void> {
  const namespace = `pizza-zio:${hash(config, 'origin', config.origin).slice(0, 16)}`;
  const keys = [
    `${namespace}:ip:${hash(config, 'ip', clientBucket(request, config))}`,
    `${namespace}:email:${hash(config, 'email', lead.email)}`,
    `${namespace}:all`,
    `${namespace}:id:${lead.idempotencyKey}`,
  ];
  const result = await fetcher(config.redisUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.redisToken}` },
    body: JSON.stringify(['EVAL', RATE_LIMIT_SCRIPT, '4', ...keys, String(WINDOW_SECONDS), '5', '3600', '3', String(WINDOW_SECONDS), '100', hash(config, 'payload', JSON.stringify(lead)), String(IDEMPOTENCY_TTL)]),
    signal: AbortSignal.timeout(5_000),
    redirect: 'error',
    cache: 'no-store',
  });
  if (!result.ok) throw new Error('Rate limit service unavailable');
  const json = await readBoundedJson(result, MAX_RESPONSE_BYTES) as { result?: unknown; error?: unknown };
  if (!json || json.error || !Array.isArray(json.result) || json.result.length !== 2) throw new Error('Invalid rate limit response');
  const [allowed, retry] = json.result;
  if (allowed === -1) throw new LeadFailure(409, 'IDEMPOTENCY_CONFLICT', 'Le formulaire a changé. Rechargez la page avant de réessayer.');
  if (allowed === 0 && Number.isSafeInteger(retry) && retry > 0 && retry <= 3600) {
    throw new LeadFailure(429, 'RATE_LIMITED', 'Plusieurs demandes ont déjà été envoyées. Patientez avant de réessayer.', retry);
  }
  if (allowed !== 1 || retry !== 0) throw new Error('Invalid rate limit decision');
}

async function deliverLead(lead: ValidatedLead, config: LeadConfig, fetcher: Fetcher): Promise<void> {
  const receivedAt = new Date().toISOString();
  const { idempotencyKey, rgpd, ...application } = lead;
  const delivered = await fetcher(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.webhookToken}`, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      schemaVersion: 1,
      submissionId: idempotencyKey,
      receivedAt,
      application,
      qualification: qualifyLead(lead),
      privacy: { noticeVersion: PRIVACY_NOTICE_VERSION, acknowledged: rgpd, acknowledgedAt: receivedAt },
    }),
    signal: AbortSignal.timeout(8_000),
    redirect: 'error',
    cache: 'no-store',
  });
  if (![200, 201].includes(delivered.status) || !/^application\/json(?:\s*;.*)?$/i.test(delivered.headers.get('content-type') ?? '')) throw new Error('Delivery not confirmed');
  const acknowledgement = await readBoundedJson(delivered, MAX_RESPONSE_BYTES) as { ok?: unknown; persisted?: unknown; submissionId?: unknown };
  if (acknowledgement?.ok !== true || acknowledgement.persisted !== true || acknowledgement.submissionId !== idempotencyKey) throw new Error('Persistence not confirmed');
}

/** Dependency injection keeps tests offline; production calls this with server config only. */
export async function handleLeadRequest(request: Request, config: LeadConfig | null, fetcher: Fetcher = fetch): Promise<Response> {
  if (!config) return response(503, { ok: false, code: 'INTAKE_UNAVAILABLE', message: 'Le formulaire est momentanément indisponible. Aucune candidature n’a été enregistrée.' });
  if (request.method !== 'POST') return response(405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' });
  if (request.headers.get('origin') !== config.origin || request.headers.get('sec-fetch-site') === 'cross-site') return response(403, { ok: false, code: 'ORIGIN_REJECTED', message: 'Cette demande ne peut pas être acceptée.' });
  if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('content-type') ?? '') || request.headers.has('content-encoding')) return response(415, { ok: false, code: 'UNSUPPORTED_CONTENT_TYPE', message: 'Le format du formulaire est invalide.' });
  try {
    const input = await readBoundedJson(request, MAX_REQUEST_BYTES);
    const validated = validateLead(input);
    if (!validated.ok) return response(422, { ok: false, code: 'VALIDATION_FAILED', message: 'Vérifiez les champs indiqués.', fieldErrors: validated.fieldErrors });
    try {
      await enforceLeadLimits(request, validated.data, config, fetcher);
    } catch (error) {
      if (error instanceof LeadFailure && [409, 429].includes(error.status)) throw error;
      return response(503, { ok: false, code: 'INTAKE_UNAVAILABLE', message: 'Le service est momentanément indisponible. Votre saisie est conservée dans cette page.' });
    }
    try { await deliverLead(validated.data, config, fetcher); }
    catch {
      // A timeout may follow a successful remote write. Preserve the UUID for a safe retry.
      return response(503, { ok: false, code: 'DELIVERY_UNCONFIRMED', message: 'La réception n’a pas pu être confirmée. Réessayez sans modifier le formulaire pour éviter un doublon.' });
    }
    return response(201, { ok: true, submissionId: validated.data.idempotencyKey });
  } catch (error) {
    if (error instanceof LeadFailure) return response(error.status, { ok: false, code: error.code, message: error.message }, error.retryAfter);
    return response(400, { ok: false, code: 'INVALID_REQUEST', message: 'La demande n’a pas pu être traitée. Vérifiez le formulaire et réessayez.' });
  }
}
