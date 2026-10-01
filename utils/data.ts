/** Generadores de datos de prueba y helpers de formato. */

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}${p(d.getMonth() + 1)}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export const uniqueName = (prefix: string) => `${prefix} ${stamp()}`;

/** Fecha de hoy en formato DD/MM/YYYY (zona horaria Buenos Aires), como la muestra Lebane. */
export const todayDDMMYYYY = () =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

/** Nombre por defecto que Lebane asigna a una lista de precios sin nombre. */
export const defaultPriceListName = () => `Lista precios ${todayDDMMYYYY()}`;

/** Formato numérico es-AR usado en la grilla: 150000 -> "150.000". */
export const formatAR = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);

export interface ProjectData {
  nombre: string;
  moneda: string;
  pais: string;
  estado: string;
  ciudad: string;
  calle: string;
  numero: string;
  fechaFin: string; // DDMMYYYY (se tipea sobre el date picker)
  tipoConstruccion: string;
  modalidadAjuste: string;
  razonSocial?: string;
}

export const newProjectData = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  nombre: uniqueName('QA Auto'),
  moneda: 'USD',
  pais: 'Argentina',
  estado: 'Capital Federal',
  ciudad: 'Palermo',
  calle: 'Av. Santa Fe',
  numero: '1234',
  fechaFin: `3112${new Date().getFullYear() + 2}`,
  tipoConstruccion: 'Edificio residencial',
  modalidadAjuste: 'Definitivo',
  razonSocial: process.env.RAZON_SOCIAL || undefined,
  ...overrides,
});

export interface AreasData {
  precioM2: string;
  pisos: string;
  unidadesPorPiso: string;
  tipologias: string[];
  nombreListaPrecios?: string; // opcional según el enunciado
}

export const areasData = (overrides: Partial<AreasData> = {}): AreasData => ({
  precioM2: '1000',
  pisos: '1',
  unidadesPorPiso: '2',
  tipologias: ['Dos ambientes'],
  ...overrides,
});
