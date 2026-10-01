import { Locator, Page, expect } from '@playwright/test';
import { AreasData, formatAR } from '../utils/data';
import { expectToast } from '../utils/mui';

/**
 * Comercial > Unidades (/proyecto/:id/areas) — Figuras 3, 4 y 6.
 * Incluye la configuración inicial del proyecto (donde se crea la primera lista de precios),
 * el selector de listas de precios, la grilla de unidades, templates y borrado.
 */
export class UnitsPage {
  constructor(private readonly page: Page) {}

  // ---------- Navegación ----------
  async goto(projectId: string) {
    await this.page.goto(`/proyecto/${projectId}/areas`);
    await expect(this.page.getByText('Áreas', { exact: true }).first()).toBeVisible();
  }

  get unitsTab() {
    return this.page.getByRole('tab', { name: 'Unidades', exact: true });
  }
  /**
   * Localizadores CSS (no por rol) para los botones de la barra: mientras un menú de MUI está abierto
   * el resto de la página queda con aria-hidden y getByRole no los encuentra.
   */
  get templatesButton() {
    return this.page.locator('main button').filter({ hasText: /^\s*Templates\s*$/ });
  }
  get addUnitButton() {
    return this.page.getByRole('button', { name: 'Adicionar unidad' });
  }
  /** Botón desplegable de listas de precios: muestra la lista seleccionada (a la izquierda de "Templates"). */
  get priceListButton() {
    return this.templatesButton.locator('xpath=preceding::button[1]');
  }
  get cellEditor() {
    return this.page.getByPlaceholder('Valor...');
  }

  async openUnitsTab() {
    await this.unitsTab.click();
    await expect(this.addUnitButton).toBeVisible();
  }

  // ---------- Configuración inicial (crea la lista de precios inicial) ----------
  get setupForm() {
    return {
      precioM2: this.page.locator('input[name="precioListaMetroCuadrado"]'),
      pisos: this.page.locator('input[name="pisos"]'),
      unidadesPorPiso: this.page.locator('input[name="unidadesPorPiso"]'),
      tipologias: this.page.locator('[data-cy="new-renderer-field-tipologias"]'),
      nombreLista: this.page.locator('input[name="versionListaPrecios"]'),
      guardar: this.page.getByRole('button', { name: 'Guardar' }),
    };
  }

  async configureProject(data: AreasData) {
    const f = this.setupForm;
    await expect(f.precioM2).toBeVisible();
    await f.precioM2.fill(data.precioM2);
    await f.pisos.fill(data.pisos);
    await f.unidadesPorPiso.fill(data.unidadesPorPiso);
    for (const t of data.tipologias) {
      await f.tipologias.click();
      await f.tipologias.fill(t);
      await this.page.getByRole('option', { name: t, exact: true }).click();
    }
    await this.page.keyboard.press('Escape');
    if (data.nombreListaPrecios) await f.nombreLista.fill(data.nombreListaPrecios);
    await f.guardar.click();
    await expect(this.unitsTab).toBeVisible();
  }

  // ---------- Listas de precios ----------
  async selectedPriceList() {
    await expect(this.priceListButton).toBeVisible();
    return (await this.priceListButton.innerText()).trim();
  }

  async priceListNames(): Promise<string[]> {
    await this.closeMenuIfOpen();
    await this.priceListButton.click();
    const menu = this.page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    const names = (await menu.innerText())
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await this.closeMenuIfOpen();
    return names;
  }

  /**
   * Cierra cualquier menú de MUI que haya quedado abierto (selector de listas o "Templates").
   * Aunque el menú no se vea, su backdrop invisible intercepta los clicks del resto de la página.
   */
  private async closeMenuIfOpen() {
    const menus = this.page.locator('.MuiMenu-root');
    for (let i = 0; i < 3 && (await menus.count()) > 0; i++) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
      if ((await menus.count()) > 0) {
        await menus
          .locator('.MuiBackdrop-root')
          .first()
          .click({ force: true, timeout: 2000 })
          .catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
    await expect(menus).toHaveCount(0);
  }

  async selectPriceList(name: string) {
    await this.closeMenuIfOpen();
    if ((await this.selectedPriceList()) !== name) {
      await this.priceListButton.click();
      await this.page.locator('[role="menu"]').getByText(name, { exact: true }).click();
    }
    await this.closeMenuIfOpen();
    await expect(this.priceListButton).toHaveText(name);
    await this.waitForGrid();
  }

  // ---------- Grilla de unidades ----------
  private numeroCells() {
    return this.page.locator('tbody tr td[data-column-id="numero"]');
  }

  row(unit: string): Locator {
    return this.page.locator('tbody tr').filter({
      has: this.page.locator('td[data-column-id="numero"]', { hasText: new RegExp(`^\\s*${escapeRe(unit)}\\s*$`) }),
    });
  }

  async waitForGrid() {
    await expect(this.page.getByText(/\d+ filas?/)).toBeVisible();
  }

  async unitNames(): Promise<string[]> {
    await this.waitForGrid();
    return (await this.numeroCells().allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  async unitPrice(unit: string) {
    return (await this.row(unit).locator('td[data-column-id="precio"]').innerText()).trim();
  }

  /** Alta manual: "Adicionar unidad" agrega una fila y abre el editor de la celda Unidad. */
  async addUnit(name: string) {
    await this.closeMenuIfOpen();
    await this.addUnitButton.click();
    await expect(this.cellEditor).toBeVisible();
    await this.cellEditor.fill(name);
    await this.cellEditor.press('Enter');
    await expectToast(this.page, 'Unidad creada');
    await expect(this.row(name)).toHaveCount(1);
  }

  /** Edición inline del precio de una unidad en la lista seleccionada. */
  async setUnitPrice(unit: string, price: number) {
    await this.closeMenuIfOpen();
    const cell = this.row(unit).locator('td[data-column-id="precio"]');
    await cell.scrollIntoViewIfNeeded();
    await cell.click();
    await expect(this.cellEditor).toBeVisible();
    await this.cellEditor.fill(String(price));
    await this.cellEditor.press('Enter');
    await expect(cell).toHaveText(formatAR(price));
  }

  /** Tacho rojo: quita la unidad de la lista seleccionada. Devuelve el texto del diálogo de confirmación. */
  async removeUnitFromList(unit: string) {
    await this.closeMenuIfOpen();
    const trash = this.row(unit).locator('td[data-column-id="menu"] button');
    await trash.click();
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Eliminar unidad' });
    await expect(dialog).toBeVisible();
    const text = await dialog.innerText();
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expectToast(this.page, 'Unidad eliminada de la lista de precios');
    await expect(this.row(unit)).toHaveCount(0);
    return text;
  }

  /** Abre el diálogo de borrado y lo cierra con la "X" (sin confirmar). */
  async cancelRemoveUnit(unit: string) {
    await this.closeMenuIfOpen();
    await this.row(unit).locator('td[data-column-id="menu"] button').click();
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Eliminar unidad' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'close' }).click();
    await expect(dialog).toBeHidden();
  }

  /** Abre el editor de precio, escribe un valor y cancela con Escape. */
  async cancelPriceEdit(unit: string, value: number) {
    await this.closeMenuIfOpen();
    const cell = this.row(unit).locator('td[data-column-id="precio"]');
    await cell.scrollIntoViewIfNeeded();
    await cell.click();
    await expect(this.cellEditor).toBeVisible();
    // Se tipea como un usuario (no fill) y se cancela con Escape desde el teclado.
    await this.cellEditor.press('Control+A');
    await this.cellEditor.pressSequentially(String(value), { delay: 30 });
    await this.page.keyboard.press('Escape');
    if (await this.cellEditor.isVisible()) await this.page.keyboard.press('Escape');
    await expect(this.cellEditor).toBeHidden();
  }

  // ---------- Templates (Figura 6) ----------
  get uploadDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Cargar Template de Unidades' });
  }

  async openUploadDialog() {
    await this.closeMenuIfOpen();
    await this.templatesButton.click();
    await this.page.getByRole('button', { name: 'Cargar Template de Unidades', exact: true }).click();
    await expect(this.uploadDialog).toBeVisible();
    return this.uploadDialog;
  }

  /** "Templates > Descargar Template de Unidades": devuelve la ruta del .xlsx descargado. */
  async downloadTemplate(targetDir: string) {
    await this.closeMenuIfOpen();
    await this.templatesButton.click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Descargar Template de Unidades', exact: true }).click(),
    ]);
    const filePath = `${targetDir}/${download.suggestedFilename()}`;
    await download.saveAs(filePath);
    return { filePath, fileName: download.suggestedFilename() };
  }

  /**
   * Carga un template de unidades. Si se indica `reportDir`, descarga el "reporte de template"
   * (validación fila por fila que genera Lebane) y devuelve su ruta.
   */
  async uploadTemplate(filePath: string, opts: { reportDir?: string } = {}) {
    const dialog = await this.openUploadDialog();
    await this.page.locator('#upload-template').setInputFiles(filePath);
    await dialog.getByRole('button', { name: 'Cargar', exact: true }).click();
    await expectToast(this.page, 'Archivo subido exitosamente');
    const report = this.page.getByRole('dialog').filter({ hasText: 'Descarga de reporte de template' });
    await expect(report).toBeVisible();
    let reportPath: string | undefined;
    if (opts.reportDir) {
      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        report.getByRole('button', { name: 'Descargar reporte' }).click(),
      ]);
      reportPath = `${opts.reportDir}/${download.suggestedFilename()}`;
      await download.saveAs(reportPath);
    }
    await report.getByRole('button', { name: 'Cerrar' }).click();
    await expect(report).toBeHidden();
    await this.waitForGrid();
    return reportPath;
  }

  /** Verifica sobre todas las listas de precios si una unidad existe en alguna. */
  async unitExistsInAnyList(unit: string) {
    for (const list of await this.priceListNames()) {
      await this.selectPriceList(list);
      if ((await this.unitNames()).includes(unit)) return true;
    }
    return false;
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
