import 'server-only';
import { isIP } from 'node:net';
import { PUBLIC_COLLECTION_READY } from '../data/launchConfig';

export type LeadConfig = { origin: string; webhookUrl: string; webhookToken: string; redisUrl: string; redisToken: string; hashSecret: string; vercel: boolean };

function secureUrl(value: string | undefined, originOnly = false): string | null {
  try {
    const url = new URL(value ?? '');
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) return null;
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (isIP(hostname) || !hostname.includes('.') || /\.(?:localhost|local|internal)$/.test(hostname)) return null;
    if (originOnly && url.pathname !== '/') return null;
    return originOnly ? url.origin : url.href.replace(/\/$/, '');
  } catch { return null; }
}

/** Server-side only. Never serialize this return value to a client component. */
export function getLeadConfig(env: Readonly<Record<string, string | undefined>> = process.env, publicReady = PUBLIC_COLLECTION_READY): LeadConfig | null {
  if (!publicReady || env.LEAD_INTAKE_ENABLED !== 'true') return null;
  const origin = secureUrl(env.LEAD_ALLOWED_ORIGIN, true);
  const webhookUrl = secureUrl(env.LEAD_WEBHOOK_URL);
  const redisUrl = secureUrl(env.UPSTASH_REDIS_REST_URL, true);
  const webhookToken = env.LEAD_WEBHOOK_TOKEN;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  const hashSecret = env.LEAD_HASH_SECRET;
  if (!origin || !webhookUrl || !redisUrl || !webhookToken || webhookToken.length < 32 || !redisToken || !hashSecret || hashSecret.length < 32) return null;
  if ([webhookToken, redisToken, hashSecret].some((value) => /[\r\n]/.test(value))) return null;
  return { origin, webhookUrl, webhookToken, redisUrl, redisToken, hashSecret, vercel: env.VERCEL === '1' };
}

export function isLeadIntakeReady(): boolean { return getLeadConfig() !== null; }
