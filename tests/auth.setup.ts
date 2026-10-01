import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_STATE } from '../playwright.config';
import { LoginPage } from '../pages/LoginPage';
import { resetCreatedProjects } from '../utils/createdProjects';

setup('login en Lebane (Figura 1)', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  const user = process.env.LEBANE_USER;
  const pass = process.env.LEBANE_PASSWORD;
  if (!user || !pass) throw new Error('Definir LEBANE_USER y LEBANE_PASSWORD en el archivo .env');

  resetCreatedProjects();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(user, pass);
  await expect(page.getByRole('button', { name: 'Agregar proyecto' }).first()).toBeVisible();

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
