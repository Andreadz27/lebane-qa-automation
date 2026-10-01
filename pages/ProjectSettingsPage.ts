import { Page, expect } from '@playwright/test';

/** Configuración de proyecto > Información de proyecto (/proyecto/:id/informacion-de-proyecto). */
export class ProjectSettingsPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/proyecto/${projectId}/informacion-de-proyecto`);
    await expect(this.page.getByText('Información de proyecto').first()).toBeVisible();
  }

  /** Elimina el proyecto: botón "Eliminar" + confirmación escribiendo "eliminar". */
  async deleteProject(projectId: string) {
    await this.goto(projectId);
    await this.page
      .locator('main button')
      .filter({ hasText: /^\s*Eliminar\s*$/ })
      .click();
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'eliminar este proyecto' });
    await expect(dialog).toBeVisible();
    await dialog.locator('input').fill('eliminar');
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog).toBeHidden();
  }
}
