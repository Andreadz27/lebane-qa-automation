import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

const authenticated = { storageState: STORAGE_STATE, viewport: { width: 1600, height: 900 } };

/** BROWSERS=all agrega Firefox y WebKit (Safari) además de Chromium. */
const crossBrowser = process.env.BROWSERS === 'all';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Los escenarios comparten datos en el ambiente de Testing: se ejecutan en serie.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  // En GitHub Actions, el reporter "github" publica cada falla como anotación visible en el resumen del run.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://tst.lebane.app',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    viewport: { width: 1600, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/, teardown: 'cleanup' },
    { name: 'cleanup', testMatch: /.*\.teardown\.ts/, use: authenticated },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...authenticated },
      dependencies: ['setup'],
    },
    ...(crossBrowser
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'], ...authenticated }, dependencies: ['setup'] },
          { name: 'webkit', use: { ...devices['Desktop Safari'], ...authenticated }, dependencies: ['setup'] },
        ]
      : []),
  ],
});
