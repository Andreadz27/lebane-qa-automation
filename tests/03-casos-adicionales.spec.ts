import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { test, expect, createProjectWithInitialPriceList } from '../fixtures/test';
import { NewProjectPage } from '../pages/NewProjectPage';
import { defaultPriceListName, formatAR, uniqueName } from '../utils/data';
import { TEMPLATE_HEADERS, buildUnitsTemplate, sampleTemplateUnits } from '../utils/template';

/**
 * Casos complementarios: validaciones, cancelaciones (casos negativos),
 * descarga del template y aislamiento entre listas de precios.
 */
test.describe('Validaciones del formulario de proyecto', () => {
  test('TC08 - "Registrar" permanece deshabilitado con campos obligatorios incompletos', async ({ page }) => {
    const form = new NewProjectPage(page);
    await form.openFromHome();
    await expect(form.registrar).toBeDisabled();

    await page.locator('[data-cy="new-renderer-field-nombreProyecto"]').fill(uniqueName('QA Incompleto'));
    await expect(form.registrar).toBeDisabled();
  });
});

test.describe.serial('Casos complementarios de lista de precios', () => {
  const initialList = uniqueName('Lista QA');
  const p = Date.now().toString().slice(-4);
  const tplUnits = sampleTemplateUnits(`C${p}`);
  const templateList = defaultPriceListName();
  const unitInTemplateList = `EXT-${p}`;
  let projectId: string;
  let generatedUnits: string[];

  test('Precondición - proyecto con lista de precios inicial', async ({ page }) => {
    const res = await createProjectWithInitialPriceList(page, {}, { nombreListaPrecios: initialList });
    projectId = res.projectId;
    generatedUnits = await res.units.unitNames();
    expect(generatedUnits.length).toBeGreaterThan(0);
  });

  test('TC09 - cerrar el diálogo de borrado sin confirmar no quita la unidad', async ({ unitsPage }) => {
    const unit = generatedUnits[0];
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);

    await unitsPage.cancelRemoveUnit(unit);

    await expect(unitsPage.row(unit)).toHaveCount(1);
    expect(await unitsPage.priceListNames()).toEqual([initialList]);
  });

  test('TC10 - cancelar la edición del precio (Escape) no modifica la lista', async ({ unitsPage, page }) => {
    const unit = generatedUnits[0];
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);
    const before = await unitsPage.unitPrice(unit);

    await unitsPage.cancelPriceEdit(unit, 777777);
    expect(await unitsPage.unitPrice(unit)).toBe(before);

    await page.reload();
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);
    expect(await unitsPage.unitPrice(unit)).toBe(before);
    expect(await unitsPage.unitPrice(unit)).not.toBe(formatAR(777777));
  });

  test('TC11 - el modal de template no permite "Cargar" sin archivo y "Cancelar" no crea listas', async ({
    unitsPage,
  }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();

    const dialog = await unitsPage.openUploadDialog();
    await expect(dialog.getByText('Sube archivos en formato .xlsx que no superen los 50mb.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cargar', exact: true })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();

    expect(await unitsPage.priceListNames()).toEqual([initialList]);
  });

  test('TC12 - "Descargar Template de Unidades" entrega un .xlsx con las columnas esperadas', async ({
    unitsPage,
  }, testInfo) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();

    const dir = testInfo.outputPath('downloads');
    fs.mkdirSync(dir, { recursive: true });
    const { filePath, fileName } = await unitsPage.downloadTemplate(dir);

    expect(fileName).toMatch(/^template_unidades_.*\.xlsx$/);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet('Unidades');
    expect(sheet, 'la hoja "Unidades" existe').toBeTruthy();
    const headers = (sheet!.getRow(1).values as unknown[]).slice(1).map(String);
    expect(headers).toEqual([...TEMPLATE_HEADERS]);
    await testInfo.attach(path.basename(filePath), { path: filePath });
  });

  test('TC13 - una unidad creada con la lista del template seleccionada no se agrega a la lista inicial', async ({
    unitsPage,
  }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.uploadTemplate(await buildUnitsTemplate(tplUnits));
    await unitsPage.selectPriceList(templateList);

    await unitsPage.addUnit(unitInTemplateList);

    expect(await unitsPage.unitNames()).toContain(unitInTemplateList);
    await unitsPage.selectPriceList(initialList);
    expect(await unitsPage.unitNames()).not.toContain(unitInTemplateList);
  });

  test('TC14 - los precios de una lista son independientes de las otras listas', async ({ unitsPage }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);
    const initialSnapshot = await Promise.all(generatedUnits.map((u) => unitsPage.unitPrice(u)));

    await unitsPage.selectPriceList(templateList);
    await unitsPage.setUnitPrice(tplUnits[0].numero, 999999);

    await unitsPage.selectPriceList(initialList);
    const after = await Promise.all(generatedUnits.map((u) => unitsPage.unitPrice(u)));
    expect(after).toEqual(initialSnapshot);
  });

  test('TC15 - cargar un segundo template el mismo día debe crear otra lista de precios', async ({ unitsPage }) => {
    test.info().annotations.push({
      type: 'bug',
      description:
        'Observado en Testing (01/10/2026): si ya existe "Lista precios DD/MM/YYYY", un nuevo template ' +
        'se fusiona en esa lista (actualiza precios y agrega unidades) en lugar de crear una lista nueva, ' +
        'contradiciendo la regla "Al cargar un template se crea una nueva lista de precios".',
    });
    test.fail(true, 'Bug conocido: el segundo template del día no crea una nueva lista');

    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const before = await unitsPage.priceListNames();

    const second = sampleTemplateUnits(`D${p}`);
    await unitsPage.uploadTemplate(await buildUnitsTemplate(second));

    expect(await unitsPage.priceListNames()).toHaveLength(before.length + 1);
  });
});
