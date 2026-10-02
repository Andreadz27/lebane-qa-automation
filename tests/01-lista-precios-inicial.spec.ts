import { test, expect, createProjectWithInitialPriceList } from '../fixtures/test';
import { defaultPriceListName, uniqueName } from '../utils/data';

/**
 * Regla: "Al crear el nuevo proyecto, se debe crear una lista de precio inicial;
 * Esta lista de precios puede o no especificar el nombre de la lista de precios."
 */
test.describe('Lista de precios inicial al crear un proyecto', { tag: '@smoke' }, () => {
  test('TC01 - con nombre de lista: se crea la lista inicial con el nombre indicado', async ({ page }) => {
    const listName = uniqueName('Lista QA');
    const { units, areaData } = await createProjectWithInitialPriceList(page, {}, { nombreListaPrecios: listName });

    await test.step('La lista inicial queda seleccionada y es la única del proyecto', async () => {
      expect(await units.selectedPriceList()).toBe(listName);
      expect(await units.priceListNames()).toEqual([listName]);
    });

    await test.step('La lista contiene las unidades generadas por la configuración (pisos x unidades por piso)', async () => {
      const expected = Number(areaData.pisos) * Number(areaData.unidadesPorPiso);
      await expect.poll(async () => (await units.unitNames()).length).toBe(expected);
    });
  });

  test('TC02 - sin nombre de lista: se crea la lista inicial con el nombre por defecto', async ({ page }) => {
    const { units } = await createProjectWithInitialPriceList(page, {}, { nombreListaPrecios: undefined });

    expect(await units.selectedPriceList()).toBe(defaultPriceListName());
    expect(await units.priceListNames()).toEqual([defaultPriceListName()]);
    expect((await units.unitNames()).length).toBeGreaterThan(0);
  });
});
