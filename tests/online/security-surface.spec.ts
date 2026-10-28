import { expect, test } from '@playwright/test';

test('les fichiers sensibles et sources serveur ne sont pas servis publiquement', async ({ request }) => {
  // Explicit, bounded probes of the owned preview only; no crawling or discovery scan.
  for (const path of ['/.env', '/.env.local', '/.git/config', '/package.json', '/lib/leadConfig.ts', '/lib/leadService.ts', '/.next/server/app/api/lead/route.js']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect([403, 404], `${path}: seul le statut est rapporté, jamais le contenu éventuel`).toContain(response.status());
  }
});

test('l’API ne propose ni lecture publique de dossiers ni accès CORS étranger', async ({ request }) => {
  const read = await request.get('/api/lead');
  expect(read.status()).toBe(405);
  const preflight = await request.fetch('/api/lead', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://example.invalid',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  expect([204, 405]).toContain(preflight.status());
  expect(preflight.headers()['access-control-allow-origin']).toBeUndefined();
  expect(preflight.headers()['access-control-allow-credentials']).toBeUndefined();
});

test('les ressources navigateur ne divulguent pas de configuration serveur ni de traceur tiers', async ({ page, request, baseURL }, testInfo) => {
  const otherOrigins = new Set<string>();
  page.on('request', resource => {
    const url = new URL(resource.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== baseURL) otherOrigins.add(url.origin);
  });
  const response = await page.goto('/');
  expect(response?.headers()['x-powered-by']).toBeUndefined();
  await expect(page.locator('.header-cta')).toBeVisible();
  const scripts = await page.locator('script[src]').evaluateAll(elements => [...new Set(elements.map(element => (element as HTMLScriptElement).src))]);
  expect(scripts.length).toBeGreaterThan(0);
  for (const source of scripts) {
    expect(new URL(source).origin).toBe(baseURL);
    const asset = await request.get(source);
    expect(asset.status()).toBe(200);
    const body = await asset.text();
    // Detect accidental imports of server configuration without printing any matched contents.
    const hasServerConfig = /LEAD_WEBHOOK_TOKEN|UPSTASH_REDIS_REST_TOKEN|LEAD_HASH_SECRET|RATE_LIMIT_SCRIPT/.test(body);
    expect(hasServerConfig, `configuration serveur dans ${new URL(source).pathname}`).toBe(false);
    expect(body).not.toMatch(/sourceMappingURL=.*\.map(?:\s|$)/);
  }
  const storage = await page.evaluate(() => ({ localKeys: Object.keys(localStorage), sessionKeys: Object.keys(sessionStorage) }));
  const cookieNames = (await page.context().cookies()).map(cookie => cookie.name);
  await testInfo.attach('privacy-observations', { body: JSON.stringify({ otherOrigins: [...otherOrigins], storage, cookieNames, scriptCount: scripts.length }), contentType: 'application/json' });
  expect([...otherOrigins]).toEqual([]);
  expect(storage.localKeys).toEqual([]);
  expect(storage.sessionKeys).toEqual([]);
});
