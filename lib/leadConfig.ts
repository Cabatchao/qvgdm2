import 'server-only';
import { createPrivateKey } from 'node:crypto';
import type { SheetDestination } from './sheetReceiver';
import { isIP } from 'node:net';
import { PUBLIC_COLLECTION_READY } from '../data/launchConfig';

type WebhookDestination = { webhookUrl: string; webhookToken: string; sheet?: undefined };
export type LeadConfig = { origin: string; redisUrl: string; redisToken: string; hashSecret: string; vercel: boolean }
  & (WebhookDestination | { sheet: SheetDestination });


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
  const redisUrl = secureUrl(env.UPSTASH_REDIS_REST_URL, true);
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  const hashSecret = env.LEAD_HASH_SECRET;
  const clean = (value: string) => value.length > 0 && value.trim() === value && !/[\r\n]/.test(value);
  if (!origin || !redisUrl || !redisToken || !clean(redisToken) || !hashSecret || hashSecret.length < 32 || !clean(hashSecret) || redisToken === hashSecret) return null;
  const shared = { origin, redisUrl, redisToken, hashSecret, vercel: env.VERCEL === '1' };
  if (env.LEAD_DESTINATION === 'google_sheets') {
    const spreadsheetId = env.LEAD_SHEET_ID ?? '';
    const email = env.LEAD_SHEET_CLIENT_EMAIL ?? '';
    const privateKey = env.LEAD_SHEET_PRIVATE_KEY?.replaceAll('\\n', '\n') ?? '';
    const tab = env.LEAD_SHEET_TAB_ID ?? '';
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(spreadsheetId) || !/^[a-z0-9._-]+@[a-z0-9.-]+\.gserviceaccount\.com$/.test(email) || !/^\d{1,10}$/.test(tab) || Number(tab) > 2147483647) return null;
    try { if (createPrivateKey(privateKey).asymmetricKeyType !== 'rsa') return null; } catch { return null; }
    return { ...shared, sheet: { spreadsheetId, tabId: Number(tab), email, privateKey } };
  }
  if (env.LEAD_DESTINATION && env.LEAD_DESTINATION !== 'webhook') return null;
  const webhookUrl = secureUrl(env.LEAD_WEBHOOK_URL);
  const webhookToken = env.LEAD_WEBHOOK_TOKEN;
  if (!webhookUrl || !webhookToken || webhookToken.length < 32 || !clean(webhookToken) || [hashSecret, redisToken].includes(webhookToken)) return null;
  return { ...shared, webhookUrl, webhookToken };
}

export function isLeadIntakeReady(): boolean { return getLeadConfig() !== null; }
