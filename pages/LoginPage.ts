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
    await this.page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));
  }
}
