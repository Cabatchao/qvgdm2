import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('la prévisualisation sert les pages attendues en HTTPS, sans cache ni indexation', async ({ request, baseURL }) => {
  expect(new URL(baseURL!).protocol).toBe('https:');
  for (const path of ['/', '/confidentialite', '/mentions-legales']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(new URL(response.url()).origin).toBe(baseURL);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['strict-transport-security']).toMatch(/max-age=[1-9]\d*/);
    expect(await response.text()).toMatch(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/);
  }
});

test('le parcours candidat fonctionne sans erreur JavaScript ni ressource requise en échec', async ({ page, baseURL }, testInfo) => {
  const errors: string[] = [];
  const resources: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => resources.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`${message.location().url}: ${message.text()}`); });
  page.on('response', response => {
    if (new URL(response.url()).origin === baseURL && response.status() >= 400) resources.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('.header-cta')).toBeVisible();
  await page.getByRole('link', { name: 'Préparer mon projet' }).click();
  await expect(page).toHaveURL(/#projet$/);
  await expect(page.locator('#projet')).toContainText('Les candidatures en ligne ne sont pas encore ouvertes.');
  await page.getByRole('link', { name: 'Données personnelles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Données personnelles', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à Pizza Zio' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await testInfo.attach('runtime-observations', { body: JSON.stringify({ errors, resources, consoleErrors }), contentType: 'application/json' });
  expect(errors).toEqual([]);
  expect(resources).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('le clavier permet le saut au contenu et l’ouverture puis fermeture de la FAQ', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Aller au contenu', exact: true });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contenu$/);
  const question = page.locator('.faq-list summary').first();
  await question.focus();
  await expect(question).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open');
});

test('l’accessibilité automatique et le mouvement réduit restent utilisables après déploiement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/confidentialite', '/mentions-legales']) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), path).toEqual([]);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  }
});

test('les pages restent lisibles à 320 px et en grand écran', async ({ page }) => {
  for (const width of [320, 390, 621, 700, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.locator('.header-cta')).toBeVisible();
  }
});

test('la CSP déployée utilise un nonce renouvelé qui correspond aux scripts rendus', async ({ request }) => {
  const nonces = new Set<string>();
  for (const path of ['/', '/confidentialite', '/mentions-legales', '/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const policy = headers['content-security-policy'];
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(nonces.has(nonce!)).toBe(false);
    nonces.add(nonce!);
    const scripts = [...(await response.text()).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(match => match[2].trim() && !/\bsrc=/.test(match[1]));
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) expect(script[1]).toContain(`nonce="${nonce}"`);
  }
});

test('un accès direct à la collecte fermée ne crée aucun faux reçu', async ({ request, baseURL }) => {
  const response = await request.post('/api/lead', { headers: { Origin: baseURL! }, data: {} });
  expect(response.status()).toBe(503);
  expect(response.headers()['cache-control']).toContain('no-store');
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, code: 'INTAKE_UNAVAILABLE' });
  expect(body).not.toHaveProperty('submissionId');
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('la lecture, la FAQ et la fermeture de collecte restent explicites', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.locator('.faq-list summary').first().click();
    await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
    await page.getByRole('link', { name: 'Préparer mon projet' }).click();
    const project = page.locator('#projet');
    await expect(project).toContainText('Les candidatures en ligne ne sont pas encore ouvertes.');
    await expect(project.locator('input, textarea, select, button[type="submit"]')).toHaveCount(0);
    await expect(project.getByRole('status')).toHaveCount(0);
  });
});
