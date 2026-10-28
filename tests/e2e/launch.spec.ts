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

  await page.getByRole('link', { name: 'Préparer mon projet' }).click();
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
  for (const width of [320, 390, 621, 700, 768, 1440]) {
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
  await expect(page.getByRole('link', { name: 'Préparer mon projet' })).toBeVisible();
  await expect(page.locator('#projet')).toBeVisible();
  const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(scrollBehavior).toBe('auto');
});

test('les photos se chargent sans décalage et les polices locales sont actives', async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let releaseImages = () => {};
  const imageGate = new Promise<void>((resolve) => { releaseImages = resolve; });
  await page.route('**/images/**', async (route) => {
    await imageGate;
    await route.continue();
  });

  const reserved: { width: number; height: number }[] = [];
  const images = page.locator('main img');
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect(image).toBeInViewport();
      const dimensions = await image.evaluate((element: HTMLImageElement) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        intrinsicWidth: Number(element.getAttribute('width')),
        intrinsicHeight: Number(element.getAttribute('height')),
        naturalWidth: element.naturalWidth,
      }));
      expect(dimensions.naturalWidth).toBe(0);
      expect(dimensions.intrinsicWidth).toBeGreaterThan(0);
      expect(dimensions.intrinsicHeight).toBeGreaterThan(0);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      reserved.push(dimensions);
    }
  } finally {
    releaseImages();
  }

  await expect.poll(() => images.evaluateAll((elements: HTMLImageElement[]) => elements
    .filter((image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
    .map((image) => image.currentSrc || image.src))).toEqual([]);
  for (const [index, image] of (await images.all()).entries()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeInViewport();
    const rendered = await image.boundingBox();
    expect(rendered!.width).toBeCloseTo(reserved[index].width, 0);
    expect(rendered!.height).toBeCloseTo(reserved[index].height, 0);
    expect(new URL(await image.evaluate((element: HTMLImageElement) => element.currentSrc)).origin).toBe(baseURL);
  }

  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily.split(',')[0].replaceAll('"', '').trim(),
    heading: getComputedStyle(document.querySelector('h1')!).fontFamily.split(',')[0].replaceAll('"', '').trim(),
    loaded: [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replaceAll('"', '')),
    resources: performance.getEntriesByType('resource').map(({ name }) => name).filter((name) => /\.(woff2?|ttf|otf)(\?|$)/.test(name)),
  }));
  expect(fonts.body).toBe('Proxima Nova');
  expect(fonts.heading).toBe('Awesome Serif');
  expect(fonts.loaded).toEqual(expect.arrayContaining(['Proxima Nova', 'Awesome Serif']));
  expect(fonts.resources.length).toBeGreaterThan(0);
  for (const resource of fonts.resources) {
    expect(new URL(resource).origin).toBe(baseURL);
    expect(new URL(resource).pathname).toMatch(/^\/fonts\/.+\.woff2$/);
  }
});

test('les animations CSS progressent et la préférence de réduction les désactive', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1 });
  const entrance = await title.evaluate((element) => {
    const animation = element.getAnimations().find((candidate) => candidate instanceof CSSAnimation);
    if (!animation) return null;
    animation.currentTime = 0;
    animation.play();
    return { duration: Number(animation.effect?.getTiming().duration), translate: getComputedStyle(element).translate };
  });
  expect(entrance).not.toBeNull();
  expect(entrance!.duration).toBeGreaterThan(0);
  expect(entrance!.translate).not.toBe('none');
  await expect.poll(() => title.evaluate((element) => getComputedStyle(element).translate)).not.toBe(entrance!.translate);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    targets: [...document.querySelectorAll('[data-reveal], [data-hero-reveal], [data-photo] img, .reading-progress')].map((element) => {
      const style = getComputedStyle(element);
      return { animation: style.animationName, transition: style.transitionDuration, translate: style.translate };
    }),
    running: document.getAnimations().filter((animation) => animation.playState === 'running' || animation.pending).length,
  }));
  expect(motion.scroll).toBe('auto');
  expect(motion.targets.length).toBeGreaterThan(0);
  for (const target of motion.targets) {
    expect(target.animation).toBe('none');
    expect(target.transition).toBe('0s');
    expect(target.translate).toBe('none');
  }
  expect(motion.running).toBe(0);
  await expect(title).toBeVisible();
  await page.getByRole('link', { name: 'Préparer mon projet' }).click();
  await expect(page).toHaveURL(/#projet$/);
  await expect(page.locator('#projet')).toBeInViewport();
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
