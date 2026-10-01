import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Los escenarios comparten datos en el ambiente de Testing: se ejecutan en serie.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
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
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 }, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
});
