import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('le parcours de lancement est lisible et ses destinations existent', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();
  if (!isMobile) await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
  await expect(page.locator('.header-cta')).toBeVisible();

  const invalidFragments = await page.locator('a[href^="#"]').evaluateAll((links) => links
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1)))));
  expect(invalidFragments).toEqual([]);

  await page.getByRole('link', { name: 'Présenter mon projet' }).click();
  await expect(page).toHaveURL(/#projet$/);
  await expect(page.locator('#projet')).toBeVisible();
  expect(errors).toEqual([]);
});

test('la collecte fermée ne permet aucune saisie ni faux succès', async ({ page }) => {
  const leadRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/lead') leadRequests.push(request.method());
  });
  await page.goto('/#projet');
  const section = page.locator('#projet');
  await expect(section).toBeVisible();
  await expect(section.getByRole('textbox')).toHaveCount(0);
  await expect(section.locator('button[type="submit"]')).toHaveCount(0);
  await expect(section).toContainText('Les candidatures en ligne ne sont pas encore ouvertes.');
  await expect(section.getByRole('status')).toHaveCount(0);
  expect(leadRequests).toEqual([]);
});

test('les pages légales sont accessibles et ramènent au site', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Données personnelles', exact: true }).click();
  await expect(page).toHaveURL(/\/confidentialite$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'Mentions légales', exact: true }).click();
  await expect(page).toHaveURL(/\/mentions-legales$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
});

test('aucun débordement horizontal sur mobile, tablette et ordinateur', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.page, `débordement à ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});

test('les pages respectent les contrôles automatiques WCAG essentiels', async ({ page }) => {
  for (const path of ['/', '/confidentialite', '/mentions-legales']) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations, `${path}: ${JSON.stringify(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })))}`).toEqual([]);
  }
});

test('la réduction des animations conserve le contenu et les liens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Présenter mon projet' })).toBeVisible();
  await expect(page.locator('#projet')).toBeVisible();
  const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(scrollBehavior).toBe('auto');
});


test('chaque page reçoit une CSP de production et des scripts avec un nonce renouvelé', async ({ request }) => {
  const nonces = new Set<string>();
  for (const path of ['/', '/confidentialite', '/mentions-legales', '/']) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    const policy = headers['content-security-policy'];
    expect(policy).toBeTruthy();
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['cache-control']).toContain('no-store');
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(nonces.has(nonce!)).toBe(false);
    nonces.add(nonce!);
    const html = await response.text();
    const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter((match) => !/\bsrc=/.test(match[1]) && match[2].trim());
    expect(inlineScripts.length).toBeGreaterThan(0);
    for (const script of inlineScripts) expect(script[1], `nonce absent sur ${path}`).toContain(`nonce="${nonce}"`);
  }
});

test('l’API de la version fermée refuse la collecte avec une réponse explicite', async ({ request }) => {
  const response = await request.post('/api/lead', { data: {} });
  expect(response.status()).toBe(503);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.code).toBe('INTAKE_UNAVAILABLE');
  expect(body).not.toHaveProperty('submissionId');
});
