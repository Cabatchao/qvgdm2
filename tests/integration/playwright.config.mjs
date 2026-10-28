import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: '../../test-results/integration',
  testDir: '.',
  testMatch: 'real-flow.spec.mjs',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3220',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
    } : undefined,
    trace: 'off',
    screenshot: 'off',
  },
});
