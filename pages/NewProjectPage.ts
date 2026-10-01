import { Page, expect } from '@playwright/test';
import { ProjectData } from '../utils/data';
import { selectAutocomplete, selectFirstOption } from '../utils/mui';

/** Formulario "Agregar proyecto" (/primer-proyecto) — Figura 2. */
export class NewProjectPage {
  constructor(private readonly page: Page) {}

  private field(cy: string) {
    return this.page.locator(`[data-cy="new-renderer-field-${cy}"]`);
  }

  get razonSocial() {
    return this.page.getByPlaceholder('Escribí para buscar o crear');
  }
  get registrar() {
    return this.page.getByRole('button', { name: 'Registrar' });
  }

  /** Desde el Home: botón "Agregar proyecto" de la sección Proyectos Desarrollo (Figura 5). */
  async openFromHome() {
    await this.page.goto('/');
    await this.page.getByRole('button', { name: 'Agregar proyecto' }).first().click();
    await this.page.waitForURL('**/primer-proyecto');
    await expect(this.field('nombreProyecto')).toBeVisible();
  }

  async fill(data: ProjectData) {
    await this.field('nombreProyecto').fill(data.nombre);
    await selectAutocomplete(this.page, this.field('moneda'), data.moneda);
    await selectAutocomplete(this.page, this.field('pais'), data.pais);
    await selectAutocomplete(this.page, this.field('estado'), data.estado);
    await selectAutocomplete(this.page, this.field('ciudad'), data.ciudad);
    await this.field('calle').fill(data.calle);
    await this.field('numeroPuerta').fill(data.numero);

    // Date picker de MUI (secciones DD/MM/YYYY): se tipea dígito a dígito.
    const fin = this.field('fechaFin');
    await fin.click();
    await fin.press('Home');
    await fin.pressSequentially(data.fechaFin, { delay: 50 });
    await expect(fin).not.toHaveValue('');

    await selectAutocomplete(this.page, this.field('tipoConstruccion'), data.tipoConstruccion);
    await selectAutocomplete(this.page, this.field('modalidadAjuste'), data.modalidadAjuste);

    if (data.razonSocial) {
      await this.razonSocial.click();
      await this.razonSocial.fill(data.razonSocial);
      await this.page.getByRole('option', { name: data.razonSocial, exact: true }).click();
    } else {
      // Se usa una razón social existente para no crear datos fiscales nuevos.
      await selectFirstOption(this.page, this.razonSocial, /Crear nueva/);
    }
    await expect(this.field('nombreRazonSocial')).not.toHaveValue('');
  }

  /** Registra el proyecto y devuelve su id (tomado de la URL /proyecto/:id). */
  async submit(): Promise<string> {
    await expect(this.registrar).toBeEnabled();
    await this.registrar.click();
    await this.page.waitForURL(/\/proyecto\/\d+/);
    return this.page.url().match(/\/proyecto\/(\d+)/)![1];
  }
}
