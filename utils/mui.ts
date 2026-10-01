import { Locator, Page, expect } from '@playwright/test';

/**
 * Selecciona una opción de un Autocomplete de Material UI.
 * Abre el popup, filtra escribiendo el texto y hace click en la opción exacta.
 */
export async function selectAutocomplete(page: Page, input: Locator, option: string) {
  await expect(input).toBeEnabled();
  await input.click();
  await input.fill(option);
  const opt = page.getByRole('option', { name: option, exact: true });
  await opt.first().click();
  await expect(input).toHaveValue(option);
}

/** Selecciona la primera opción disponible de un Autocomplete (cuando el valor concreto no importa). */
export async function selectFirstOption(page: Page, input: Locator, exclude?: RegExp) {
  await input.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  let options = listbox.getByRole('option');
  if (exclude) options = options.filter({ hasNotText: exclude });
  const first = options.first();
  const text = (await first.innerText()).trim();
  await first.click();
  return text;
}

/** Espera un toast de éxito/error con el texto indicado. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible();
}
