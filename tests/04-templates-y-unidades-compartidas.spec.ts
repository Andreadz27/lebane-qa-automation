import * as fs from 'fs';
import { test, expect, createProjectWithInitialPriceList } from '../fixtures/test';
import { defaultPriceListName, formatAR, uniqueName } from '../utils/data';
import { TemplateUnit, buildUnitsTemplate, readTemplateReport, sampleTemplateUnits } from '../utils/template';

/**
 * Validación de templates (casos negativos) y unidades que pertenecen a más de una lista de precios.
 * Comportamiento relevado en Testing el 01/10/2026: cada carga genera un "reporte de template" (.xlsx)
 * con una columna final "Estado" por fila ("Datos correctos" o el error detectado).
 */
test.describe.serial('Templates inválidos y unidades compartidas entre listas', { tag: '@regression' }, () => {
  const initialList = uniqueName('Lista QA');
  const templateList = defaultPriceListName();
  const p = Date.now().toString().slice(-4);
  const unit = (numero: string, overrides: Partial<TemplateUnit> = {}): TemplateUnit => ({
    ...sampleTemplateUnits()[0],
    numero,
    ...overrides,
  });
  let projectId: string;
  let sharedUnit: string;
  const initialPrices: Record<string, string> = {};

  test('Precondición - proyecto con lista de precios inicial', async ({ page }) => {
    const res = await createProjectWithInitialPriceList(page, {}, { nombreListaPrecios: initialList });
    projectId = res.projectId;
    const units = await res.units.unitNames();
    sharedUnit = units[0];
    for (const u of units) initialPrices[u] = await res.units.unitPrice(u);
    expect(units.length).toBeGreaterThan(0);
  });

  test('TC16 - una unidad cargada por template que ya existe queda en ambas listas con precios independientes', async ({
    unitsPage,
  }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const tplPrice = 111111;
    await unitsPage.uploadTemplate(await buildUnitsTemplate([unit(sharedUnit, { precio: tplPrice }), unit(`SH-${p}`)]));

    await unitsPage.selectPriceList(templateList);
    expect(await unitsPage.unitNames()).toEqual(expect.arrayContaining([sharedUnit, `SH-${p}`]));
    expect(await unitsPage.unitPrice(sharedUnit)).toBe(formatAR(tplPrice));

    await unitsPage.selectPriceList(initialList);
    expect(await unitsPage.unitPrice(sharedUnit)).toBe(initialPrices[sharedUnit]);
  });

  test('TC17 - quitar una unidad de una lista no la elimina si pertenece a otra lista', async ({ unitsPage }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(templateList);

    const dialogText = await unitsPage.removeUnitFromList(sharedUnit);
    expect(dialogText).not.toContain('quedará vacia');

    await test.step('La unidad sigue existiendo en la lista inicial con su precio original', async () => {
      await unitsPage.selectPriceList(initialList);
      expect(await unitsPage.unitNames()).toContain(sharedUnit);
      expect(await unitsPage.unitPrice(sharedUnit)).toBe(initialPrices[sharedUnit]);
    });

    await test.step('La lista del template se mantiene con el resto de sus unidades', async () => {
      await unitsPage.selectPriceList(templateList);
      expect(await unitsPage.unitNames()).toEqual([`SH-${p}`]);
    });
  });

  test('TC18 - template sin una columna obligatoria: el reporte marca el error y la unidad no se importa', async ({
    unitsPage,
  }, testInfo) => {
    const bad = `NC-${p}`;
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const file = await buildUnitsTemplate([unit(bad)], { omitColumns: ['Precio (*)'] });
    const reportDir = testInfo.outputPath('reportes');
    fs.mkdirSync(reportDir, { recursive: true });

    const reportPath = await unitsPage.uploadTemplate(file, { reportDir });
    await testInfo.attach('reporte-template.xlsx', { path: reportPath! });

    const report = await readTemplateReport(reportPath!);
    expect(report[bad], 'el reporte debe indicar un error para la fila').toBeTruthy();
    expect(report[bad]).not.toBe('Datos correctos');
    expect(await unitsPage.unitExistsInAnyList(bad)).toBe(false);
  });

  test('TC19 - template sin filas no agrega unidades ni crea listas', async ({ unitsPage }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const listsBefore = await unitsPage.priceListNames();
    await unitsPage.selectPriceList(templateList);
    const unitsBefore = await unitsPage.unitNames();

    await unitsPage.uploadTemplate(await buildUnitsTemplate([]));

    expect(await unitsPage.priceListNames()).toEqual(listsBefore);
    await unitsPage.selectPriceList(templateList);
    expect(await unitsPage.unitNames()).toEqual(unitsBefore);
  });

  test('TC20 - template con tipología inexistente debe ser rechazado', async ({ unitsPage }, testInfo) => {
    test.info().annotations.push({
      type: 'bug',
      description:
        'BUG-02: una tipología que no existe ("Castillo") se importa igual; el reporte dice "Datos correctos" ' +
        'y la unidad queda sin tipología.',
    });
    test.fail(true, 'Bug conocido BUG-02');
    const bad = `TI-${p}`;
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const reportDir = testInfo.outputPath('reportes');
    fs.mkdirSync(reportDir, { recursive: true });

    const reportPath = await unitsPage.uploadTemplate(
      await buildUnitsTemplate([unit(bad, { tipologia: 'Castillo' })]),
      { reportDir },
    );

    expect((await readTemplateReport(reportPath!))[bad]).not.toBe('Datos correctos');
    expect(await unitsPage.unitExistsInAnyList(bad)).toBe(false);
  });

  test('TC21 - template con precio negativo debe ser rechazado', async ({ unitsPage }, testInfo) => {
    test.info().annotations.push({
      type: 'bug',
      description:
        'BUG-03: una unidad con precio negativo (-500) se importa y queda en la lista con precio -500; ' +
        'el reporte dice "Datos correctos".',
    });
    test.fail(true, 'Bug conocido BUG-03');
    const bad = `NP-${p}`;
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    const reportDir = testInfo.outputPath('reportes');
    fs.mkdirSync(reportDir, { recursive: true });

    const reportPath = await unitsPage.uploadTemplate(await buildUnitsTemplate([unit(bad, { precio: -500 })]), {
      reportDir,
    });

    expect((await readTemplateReport(reportPath!))[bad]).not.toBe('Datos correctos');
    expect(await unitsPage.unitExistsInAnyList(bad)).toBe(false);
  });
});
