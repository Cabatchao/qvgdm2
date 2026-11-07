/** Only the approved public origin may appear in search results. */
export function publicSearchOrigin(origin: string | undefined, host: string | null,
  enabled: string | undefined, vercelEnvironment: string | undefined) {
  if (!origin || !host || enabled !== 'true' || (vercelEnvironment && vercelEnvironment !== 'production')) return null;
  return new URL(origin).host === host.toLowerCase() ? origin : null;
}
