import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

/** Columnas del "Template de Unidades" de Lebane (hoja "Unidades"), en el mismo orden que la plantilla oficial. */
export const TEMPLATE_HEADERS = [
  'Numero de unidad (*)',
  'Tipologia (*)',
  'Orientacion (*)',
  'M2 cubiertos (*)',
  'M2 semi cubiertos (*)',
  'M2 descubiertos (*)',
  'M2 Comunes (*)',
  'M2 totales (*)',
  'Precio (*)',
  'Moneda (*)',
  'Estado (*)',
  'Saldo financiado A',
  'Abonado A',
  'Saldo financiado B',
  'Abonado B',
  'Canal de venta',
  'Canal contactacion',
  'Saldo moroso',
  'Dias atraso',
  'Piso (*)',
  'TipoPropietario',
  'Moneda alquiler',
  'Valor alquiler',
] as const;

export interface TemplateUnit {
  numero: string;
  tipologia: string;
  orientacion: 'Contrafrente' | 'Frente' | 'Interno' | 'Lateral' | 'Sin definir';
  m2Cubiertos: number;
  m2SemiCubiertos: number;
  m2Descubiertos: number;
  m2Comunes: number;
  precio: number;
  moneda: string;
  estado: 'DISPONIBLE' | 'VENDIDO' | 'ENTREGADO' | 'RESERVADO' | 'ALQUILADO' | 'BLOQUEADO';
  piso: number;
}

/** Genera un .xlsx compatible con "Cargar Template de Unidades" y devuelve su ruta. */
export async function buildUnitsTemplate(units: TemplateUnit[], fileName = `template_unidades_${Date.now()}.xlsx`) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Unidades');
  ws.addRow([...TEMPLATE_HEADERS]);
  for (const u of units) {
    const total = u.m2Cubiertos + u.m2SemiCubiertos + u.m2Descubiertos + u.m2Comunes;
    ws.addRow([
      u.numero,
      u.tipologia,
      u.orientacion,
      u.m2Cubiertos,
      u.m2SemiCubiertos,
      u.m2Descubiertos,
      u.m2Comunes,
      total,
      u.precio,
      u.moneda,
      u.estado,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      u.piso,
      'PROPIETARIO',
      null,
      null,
    ]);
  }
  const dir = path.resolve(__dirname, '..', 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export const sampleTemplateUnits = (prefix = 'TPL'): TemplateUnit[] => [
  {
    numero: `${prefix}-01`,
    tipologia: 'Dos ambientes',
    orientacion: 'Frente',
    m2Cubiertos: 50,
    m2SemiCubiertos: 10,
    m2Descubiertos: 5,
    m2Comunes: 5,
    precio: 120000,
    moneda: 'USD',
    estado: 'DISPONIBLE',
    piso: 2,
  },
  {
    numero: `${prefix}-02`,
    tipologia: 'Tres ambientes',
    orientacion: 'Contrafrente',
    m2Cubiertos: 70,
    m2SemiCubiertos: 10,
    m2Descubiertos: 5,
    m2Comunes: 5,
    precio: 160000,
    moneda: 'USD',
    estado: 'DISPONIBLE',
    piso: 2,
  },
];
