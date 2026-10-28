import { defineConfig, devices } from '@playwright/test';

const suppliedURL = process.env.PIZZA_ZIO_PREVIEW_URL;
if (!suppliedURL) throw new Error('PIZZA_ZIO_PREVIEW_URL doit désigner la prévisualisation autorisée.');
const target = new URL(suppliedURL);
if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash || target.pathname !== '/') {
  throw new Error('La recette en ligne exige une origine HTTPS exacte, sans secret, chemin ni paramètres.');
}
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './tests/online',
  outputDir: './test-results/online',
  fullyParallel: false,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/online-results.json' }]],
  use: {
    baseURL: target.origin,
    navigationTimeout: 35_000,
    // Online traces can contain authentication headers; never record them.
    trace: 'off',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass } : undefined,
    launchOptions: executablePath ? {
      executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
    } : undefined,
  },
  projects: [
    { name: 'online-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'online-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
