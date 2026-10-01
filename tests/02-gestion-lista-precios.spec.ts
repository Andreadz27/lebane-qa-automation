import { test, expect, createProjectWithInitialPriceList } from '../fixtures/test';
import { defaultPriceListName, formatAR, uniqueName } from '../utils/data';
import { buildUnitsTemplate, sampleTemplateUnits } from '../utils/template';

/**
 * Happy path completo (Figuras 1 a 6) sobre un único proyecto:
 * unidades manuales, modificación de precio, carga de template y borrado de unidades.
 * Los casos dependen entre sí, por eso se ejecutan en modo serial.
 */
test.describe.serial('Gestión de la lista de precios de unidades', { tag: '@smoke' }, () => {
  const initialList = uniqueName('Lista QA');
  const manualUnit = `MAN-${Date.now().toString().slice(-5)}`;
  const tplUnits = sampleTemplateUnits(`T${Date.now().toString().slice(-4)}`);
  const templateList = defaultPriceListName(); // al cargar un template Lebane crea "Lista precios DD/MM/YYYY"
  let projectId: string;
  let generatedUnits: string[];

  test('Precondición - crear proyecto con lista de precios inicial', async ({ page }) => {
    const res = await createProjectWithInitialPriceList(page, {}, { nombreListaPrecios: initialList });
    projectId = res.projectId;
    generatedUnits = await res.units.unitNames();
    expect(await res.units.selectedPriceList()).toBe(initialList);
    expect(generatedUnits.length).toBeGreaterThan(0);
  });

  test('TC03 - crear una unidad manualmente la agrega a la lista de precios seleccionada', async ({
    unitsPage,
    page,
  }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);

    await unitsPage.addUnit(manualUnit);

    await page.reload();
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);
    expect(await unitsPage.unitNames()).toContain(manualUnit);
    expect(await unitsPage.priceListNames()).toEqual([initialList]);
  });

  test('TC04 - modificar el precio de una unidad modifica la lista de precios', async ({ unitsPage, page }) => {
    const unit = generatedUnits[0];
    const newPrice = 150000;
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);

    await unitsPage.setUnitPrice(unit, newPrice);

    await test.step('El precio persiste en la misma lista (no se crea una lista nueva)', async () => {
      await page.reload();
      await unitsPage.openUnitsTab();
      await unitsPage.selectPriceList(initialList);
      await expect.poll(() => unitsPage.unitPrice(unit)).toBe(formatAR(newPrice));
      expect(await unitsPage.priceListNames()).toEqual([initialList]);
    });
  });

  test('TC05 - cargar un template crea una nueva lista de precios con sus unidades', async ({ unitsPage }) => {
    const file = await buildUnitsTemplate(tplUnits);
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();

    await unitsPage.uploadTemplate(file);

    await test.step('Existe una nueva lista y queda seleccionada', async () => {
      const lists = await unitsPage.priceListNames();
      expect(lists).toHaveLength(2);
      expect(lists).toEqual(expect.arrayContaining([initialList, templateList]));
      expect(await unitsPage.selectedPriceList()).toBe(templateList);
    });

    await test.step('La nueva lista contiene las unidades y precios del template', async () => {
      expect((await unitsPage.unitNames()).sort()).toEqual(tplUnits.map((u) => u.numero).sort());
      for (const u of tplUnits) expect(await unitsPage.unitPrice(u.numero)).toBe(formatAR(u.precio));
    });

    await test.step('La lista inicial no se modifica', async () => {
      await unitsPage.selectPriceList(initialList);
      const names = await unitsPage.unitNames();
      expect(names).toEqual(expect.arrayContaining([...generatedUnits, manualUnit]));
      expect(names).not.toContain(tplUnits[0].numero);
    });
  });

  test('TC06 - quitar una unidad (tacho rojo) la remueve de la lista y, sin otra lista, se elimina la unidad', async ({
    unitsPage,
  }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(initialList);

    const dialogText = await unitsPage.removeUnitFromList(manualUnit);
    expect(dialogText).toContain(`eliminar la unidad ${manualUnit} de la lista de precios ${initialList}`);

    await test.step('La lista sigue existiendo porque aún tiene unidades', async () => {
      expect(await unitsPage.priceListNames()).toContain(initialList);
      expect(await unitsPage.unitNames()).toEqual(expect.arrayContaining(generatedUnits));
    });

    await test.step('La unidad quedó sin lista de precios, por lo tanto se eliminó', async () => {
      expect(await unitsPage.unitExistsInAnyList(manualUnit)).toBe(false);
    });
  });

  test('TC07 - al quitar la última unidad, la lista de precios vacía se elimina', async ({ unitsPage }) => {
    await unitsPage.goto(projectId);
    await unitsPage.openUnitsTab();
    await unitsPage.selectPriceList(templateList);

    const [first, last] = tplUnits.map((u) => u.numero);
    await unitsPage.removeUnitFromList(first);
    expect(await unitsPage.priceListNames()).toContain(templateList);

    const dialogText = await unitsPage.removeUnitFromList(last);
    expect(dialogText).toContain('la lista de precios quedará vacia y será eliminada');

    await test.step('La lista del template ya no existe; queda solo la lista inicial', async () => {
      await expect.poll(() => unitsPage.priceListNames()).toEqual([initialList]);
      expect(await unitsPage.selectedPriceList()).toBe(initialList);
    });

    await test.step('Las unidades del template se eliminaron (no pertenecían a otra lista)', async () => {
      for (const u of tplUnits) expect(await unitsPage.unitExistsInAnyList(u.numero)).toBe(false);
    });
  });
});
