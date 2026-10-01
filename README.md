# Lebane – QA Automation: Lista de precios de unidades

Casos automatizados de prueba para la funcionalidad **lista de precios de unidades para desarrolladoras** de Lebane, desarrollados con **Playwright + TypeScript** y el patrón **Page Object Model**.

- Ambiente: Testing — `https://tst.lebane.app`
- Autora: Andrea Díaz

## Funcionalidad bajo prueba

1. Al crear un proyecto se crea una **lista de precios inicial**, con o sin nombre (sin nombre → `Lista precios DD/MM/YYYY`).
2. Se pueden crear unidades **manualmente** o **cargando un template**. Modificar el precio de una unidad modifica la lista; cargar un template crea una **nueva lista de precios**.
3. El **tacho rojo** quita la unidad de la lista. Si la lista queda vacía, **se elimina la lista**; si la unidad queda sin lista, **se elimina la unidad**.

## Casos automatizados

| ID | Escenario | Spec |
|----|-----------|------|
| Setup | Login con el usuario de testing (Figura 1) y reutilización de la sesión | `tests/auth.setup.ts` |
| TC01 | Crear proyecto **con** nombre de lista → lista inicial con ese nombre y las unidades generadas | `tests/01-lista-precios-inicial.spec.ts` |
| TC02 | Crear proyecto **sin** nombre de lista → lista inicial `Lista precios DD/MM/YYYY` | `tests/01-lista-precios-inicial.spec.ts` |
| Pre | Crear el proyecto base del happy path (Figuras 2, 4 y 5) | `tests/02-gestion-lista-precios.spec.ts` |
| TC03 | Alta manual de unidad (Adicionar unidad) → se agrega a la lista seleccionada | `tests/02-gestion-lista-precios.spec.ts` |
| TC04 | Modificar precio de una unidad → persiste en la misma lista (no crea otra) | `tests/02-gestion-lista-precios.spec.ts` |
| TC05 | Cargar template (.xlsx) → nueva lista con las unidades/precios del template; la lista inicial no cambia (Figura 6) | `tests/02-gestion-lista-precios.spec.ts` |
| TC06 | Tacho rojo sobre una unidad de una lista con más unidades → la lista se mantiene y la unidad sin lista se elimina | `tests/02-gestion-lista-precios.spec.ts` |
| TC07 | Tacho rojo sobre la última unidad de una lista → la lista vacía se elimina y sus unidades también | `tests/02-gestion-lista-precios.spec.ts` |
| TC08 | "Registrar" deshabilitado con campos obligatorios incompletos | `tests/03-casos-adicionales.spec.ts` |
| TC09 | Cerrar el diálogo de borrado sin confirmar → la unidad no se quita | `tests/03-casos-adicionales.spec.ts` |
| TC10 | Cancelar la edición de precio (Escape) → el precio no cambia | `tests/03-casos-adicionales.spec.ts` |
| TC11 | Modal de template: "Cargar" deshabilitado sin archivo y "Cancelar" no crea listas | `tests/03-casos-adicionales.spec.ts` |
| TC12 | "Descargar Template de Unidades" entrega un .xlsx con la hoja y columnas esperadas | `tests/03-casos-adicionales.spec.ts` |
| TC13 | Unidad creada con la lista del template seleccionada no aparece en la lista inicial | `tests/03-casos-adicionales.spec.ts` |
| TC14 | Cambiar un precio en una lista no altera los precios de otra lista | `tests/03-casos-adicionales.spec.ts` |
| TC15 | Segundo template del mismo día debe crear otra lista — **bug detectado**, marcado con `test.fail` | `tests/03-casos-adicionales.spec.ts` |

### Hallazgo (bug)

En Testing, si el proyecto ya tiene una lista `Lista precios DD/MM/YYYY` del mismo día, cargar otro template **no crea una lista nueva**: las unidades se fusionan en esa lista (se actualizan precios y se agregan unidades). Esto contradice la regla *"Al cargar un template se crea una nueva lista de precios"*. TC15 lo documenta con `test.fail()`: la suite queda en verde mientras el bug exista y avisa cuando se corrija.

Los casos de `02-gestion-lista-precios.spec.ts` comparten un mismo proyecto y se ejecutan en modo **serial** (si uno falla, los siguientes se omiten).

## Estructura

```
├── fixtures/test.ts            # fixtures de Page Objects + helper para crear proyecto con lista inicial
├── pages/
│   ├── LoginPage.ts            # /sign-in
│   ├── NewProjectPage.ts       # "Agregar proyecto" (/primer-proyecto)
│   └── UnitsPage.ts            # Comercial > Unidades: listas de precios, grilla, templates, borrado
├── tests/
│   ├── auth.setup.ts
│   ├── 01-lista-precios-inicial.spec.ts
│   ├── 02-gestion-lista-precios.spec.ts
│   └── 03-casos-adicionales.spec.ts
├── utils/
│   ├── data.ts                 # datos de prueba únicos, fechas y formato es-AR
│   ├── mui.ts                  # helpers para Autocomplete de Material UI y toasts
│   └── template.ts             # genera el template de unidades .xlsx (exceljs)
└── playwright.config.ts
```

## Requisitos

- Node.js 18 o superior
- Acceso al ambiente `https://tst.lebane.app`

## Instalación

```bash
npm install
npx playwright install chromium
```

Crear el archivo `.env` a partir del ejemplo y completar el usuario enviado por mail:

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `BASE_URL` | URL del ambiente (por defecto `https://tst.lebane.app`) |
| `LEBANE_USER` / `LEBANE_PASSWORD` | Credenciales de testing (no se versionan) |
| `RAZON_SOCIAL` | Opcional: razón social existente a usar al crear proyectos; si está vacío se usa la primera disponible |

## Ejecución

```bash
npm test                 # toda la suite (headless)
npm run test:headed      # viendo el navegador
npm run test:ui          # modo UI de Playwright
npm run report           # abre el reporte HTML
npx playwright test -g "TC05"   # un caso puntual
```

Ante un fallo se guardan screenshot, video y trace en `test-results/` (abrir con `npx playwright show-trace`).

## Decisiones técnicas

- **Selectores estables**: se priorizan roles accesibles y atributos de la app (`data-cy="new-renderer-field-*"`, `name`, `data-column-id` de la grilla) en lugar de clases CSS generadas.
- **Sesión reutilizada**: el login corre una sola vez (proyecto `setup`) y se guarda el `storageState`.
- **Datos únicos por ejecución**: nombres de proyecto, listas y unidades llevan timestamp para evitar colisiones en el ambiente compartido.
- **Template generado en runtime** con `exceljs`, respetando las columnas de la plantilla oficial de Lebane.
- **Validación de persistencia**: tras las acciones clave se recarga la página y se vuelve a verificar el estado.

## CI (GitHub Actions)

`.github/workflows/playwright.yml` ejecuta la suite en cada push a `main` o manualmente. Requiere definir los secrets `LEBANE_USER` y `LEBANE_PASSWORD` en *Settings → Secrets and variables → Actions*. El reporte HTML queda como artefacto del job.
