import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  get email() {
    return this.page.locator('input[type="email"]');
  }
  get password() {
    return this.page.locator('input[type="password"]');
  }
  get submit() {
    return this.page.getByRole('button', { name: 'Ingresar' });
  }

  async goto() {
    await this.page.goto('/sign-in');
    await expect(this.page.getByText('Ingresar en Lebane')).toBeVisible();
  }

  async login(user: string, pass: string) {
    await this.email.fill(user);
    await this.password.fill(pass);
    await this.submit.click();
    try {
      await this.page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 30_000 });
    } catch {
      // Si no se sale de /sign-in, se informa el mensaje que muestra la app (p. ej. credenciales inválidas).
      const messages = await this.page
        .locator('[role="alert"], .Toastify__toast, .MuiAlert-message, .Mui-error, .MuiFormHelperText-root')
        .allInnerTexts();
      const shown = messages.map((m) => m.trim()).filter(Boolean);
      throw new Error(
        `El login no se completó (sigue en /sign-in). Mensajes en pantalla: ${shown.length ? shown.join(' | ') : '(ninguno)'}. ` +
          'Revisar LEBANE_USER / LEBANE_PASSWORD (en CI: secrets del repositorio).',
      );
    }
  }
}
