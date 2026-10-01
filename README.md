# Lebane – QA Automation: Lista de precios de unidades

[![Playwright Tests](https://github.com/Andreadz27/lebane-qa-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/Andreadz27/lebane-qa-automation/actions/workflows/playwright.yml)

Casos automatizados de prueba para la funcionalidad **lista de precios de unidades para desarrolladoras** de Lebane, desarrollados con **Playwright + TypeScript** y el patrón **Page Object Model**.

- Ambiente: Testing — `https://tst.lebane.app`
- Autora: Andrea Díaz

## Funcionalidad bajo prueba

| Regla | Enunciado |
|-------|-----------|
| **R1** | Al crear un proyecto se crea una **lista de precios inicial**, con o sin nombre (sin nombre → `Lista precios DD/MM/YYYY`). |
| **R2** | Se pueden crear unidades **manualmente** o **cargando un template**. |
| **R3** | Si se modifica el precio de una unidad en una lista, **se modifica esa lista**. |
| **R4** | Cargar un template **crea una nueva lista de precios**. |
| **R5** | El **tacho rojo** quita la unidad de la lista; si la lista queda vacía, **se elimina la lista**. |
| **R6** | Si la unidad queda sin lista de precios, **se elimina la unidad**. |

## Matriz de trazabilidad

| Regla | Casos que la cubren |
|-------|---------------------|
| R1 | TC01, TC02 |
| R2 | TC03, TC05, TC13, TC16, TC18–TC21 |
| R3 | TC04, TC10, TC14, TC16 |
| R4 | TC05, TC11, TC12, TC15 (bug), TC19 |
| R5 | TC06, TC07, TC09, TC17 |
| R6 | TC06, TC07, TC17 (caso inverso: la unidad sigue en otra lista) |

## Casos automatizados

| ID | Tag | Escenario | Spec |
|----|-----|-----------|------|
| Setup | — | Login con el usuario de testing (Figura 1) y reutilización de la sesión | `auth.setup.ts` |
| TC01 | @smoke | Crear proyecto **con** nombre de lista → lista inicial con ese nombre y las unidades generadas | `01-lista-precios-inicial` |
| TC02 | @smoke | Crear proyecto **sin** nombre de lista → lista inicial `Lista precios DD/MM/YYYY` | `01-lista-precios-inicial` |
| TC03 | @smoke | Alta manual de unidad (Adicionar unidad) → se agrega a la lista seleccionada | `02-gestion-lista-precios` |
| TC04 | @smoke | Modificar precio de una unidad → persiste en la misma lista (no crea otra) | `02-gestion-lista-precios` |
| TC05 | @smoke | Cargar template (.xlsx) → nueva lista con las unidades/precios del template; la lista inicial no cambia (Figura 6) | `02-gestion-lista-precios` |
| TC06 | @smoke | Tacho rojo sobre una unidad de una lista con más unidades → la lista se mantiene y la unidad sin lista se elimina | `02-gestion-lista-precios` |
| TC07 | @smoke | Tacho rojo sobre la última unidad de una lista → la lista vacía se elimina y sus unidades también | `02-gestion-lista-precios` |
| TC08 | @regression | "Registrar" deshabilitado con campos obligatorios incompletos | `03-casos-adicionales` |
| TC09 | @regression | Cerrar el diálogo de borrado sin confirmar → la unidad no se quita | `03-casos-adicionales` |
| TC10 | @regression | Cancelar la edición de precio (Escape) → el precio no cambia | `03-casos-adicionales` |
| TC11 | @regression | Modal de template: "Cargar" deshabilitado sin archivo y "Cancelar" no crea listas | `03-casos-adicionales` |
| TC12 | @regression | "Descargar Template de Unidades" entrega un .xlsx con la hoja y columnas esperadas | `03-casos-adicionales` |
| TC13 | @regression | Unidad creada con la lista del template seleccionada no aparece en la lista inicial | `03-casos-adicionales` |
| TC14 | @regression | Cambiar un precio en una lista no altera los precios de otra lista | `03-casos-adicionales` |
| TC15 | @regression | Segundo template del mismo día debe crear otra lista — **BUG-01** (`test.fail`) | `03-casos-adicionales` |
| TC16 | @regression | Unidad existente cargada por template → queda en ambas listas con precios independientes | `04-templates-y-unidades-compartidas` |
| TC17 | @regression | Quitar una unidad de una lista **no** la elimina si pertenece a otra lista | `04-templates-y-unidades-compartidas` |
| TC18 | @regression | Template sin una columna obligatoria → el reporte marca el error y la unidad no se importa | `04-templates-y-unidades-compartidas` |
| TC19 | @regression | Template sin filas → no agrega unidades ni crea listas | `04-templates-y-unidades-compartidas` |
| TC20 | @regression | Template con tipología inexistente debe ser rechazado — **BUG-02** (`test.fail`) | `04-templates-y-unidades-compartidas` |
| TC21 | @regression | Template con precio negativo debe ser rechazado — **BUG-03** (`test.fail`) | `04-templates-y-unidades-compartidas` |

Los casos de cada spec `02`, `03` y `04` comparten un proyecto y se ejecutan en modo **serial** (si uno falla, los siguientes se omiten).

## Bugs encontrados

Los bugs se documentan con `test.fail()`: la suite queda en verde mientras el defecto exista y **avisa automáticamente cuando se corrija** (el test pasa a "unexpected pass").

### BUG-01 — Un segundo template del mismo día no crea una nueva lista de precios
- **Severidad:** Media · **Regla afectada:** R4 · **Caso:** TC15
- **Pasos:** 1) En un proyecto, cargar un template de unidades (se crea `Lista precios DD/MM/YYYY`). 2) El mismo día, cargar otro template con unidades distintas.
- **Resultado esperado:** se crea una nueva lista de precios.
- **Resultado obtenido:** no se crea ninguna lista; las unidades del segundo template se fusionan en la lista existente y se pisan los precios de las unidades repetidas.

### BUG-02 — El template acepta una tipología inexistente
- **Severidad:** Media · **Regla afectada:** R2 · **Caso:** TC20
- **Pasos:** cargar un template con una fila cuya columna `Tipologia (*)` tiene un valor fuera del catálogo (p. ej. `Castillo`).
- **Resultado esperado:** la fila se rechaza y el reporte de template indica el error.
- **Resultado obtenido:** la unidad se importa sin tipología ("Seleccionar") y el reporte indica `Datos correctos`.

### BUG-03 — El template acepta precios negativos
- **Severidad:** Alta · **Regla afectada:** R2/R3 · **Caso:** TC21
- **Pasos:** cargar un template con una fila con `Precio (*)` = `-500`.
- **Resultado esperado:** la fila se rechaza y el reporte de template indica el error.
- **Resultado obtenido:** la unidad se importa con precio `-500` en la lista y el reporte indica `Datos correctos`.

### Observación
Ante cualquier template (incluso con filas rechazadas) se muestra el toast **"Archivo subido exitosamente"**; el detalle de errores solo se ve descargando el reporte. Se sugiere informar en pantalla cuántas filas fueron rechazadas.

## Estructura

```
├── .github/workflows/playwright.yml   # CI en GitHub Actions
├── fixtures/test.ts                   # fixtures de Page Objects + creación de proyecto con lista inicial
├── pages/
│   ├── LoginPage.ts                   # /sign-in
│   ├── NewProjectPage.ts              # "Agregar proyecto" (/primer-proyecto)
│   ├── ProjectSettingsPage.ts         # Información de proyecto (eliminación de proyectos de prueba)
│   └── UnitsPage.ts                   # Comercial > Unidades: listas, grilla, templates, borrado
├── tests/
│   ├── auth.setup.ts                  # login y sesión reutilizable
│   ├── 01-lista-precios-inicial.spec.ts
│   ├── 02-gestion-lista-precios.spec.ts
│   ├── 03-casos-adicionales.spec.ts
│   ├── 04-templates-y-unidades-compartidas.spec.ts
│   └── cleanup.teardown.ts            # limpieza opcional de proyectos creados
├── utils/
│   ├── createdProjects.ts             # registro de proyectos creados en la ejecución
│   ├── data.ts                        # datos de prueba únicos, fechas y formato es-AR
│   ├── mui.ts                         # helpers para Autocomplete de Material UI y toasts
│   └── template.ts                    # genera templates .xlsx y lee el reporte de validación
├── eslint.config.mjs
└── playwright.config.ts
```

## Requisitos

- Node.js 18 o superior
- Acceso al ambiente `https://tst.lebane.app`

## Instalación

```bash
npm install
npx playwright install chromium
cp .env.example .env    # completar el usuario enviado por mail
```

| Variable | Descripción |
|----------|-------------|
| `BASE_URL` | URL del ambiente (por defecto `https://tst.lebane.app`) |
| `LEBANE_USER` / `LEBANE_PASSWORD` | Credenciales de testing (no se versionan) |
| `RAZON_SOCIAL` | Opcional: razón social existente a usar al crear proyectos; si está vacío se usa la primera disponible |
| `CLEANUP` | `true` elimina al final los proyectos creados por la ejecución (por defecto se conservan para revisarlos) |
| `BROWSERS` | `all` ejecuta también en Firefox y WebKit (Safari) |

## Ejecución

```bash
npm test                   # toda la suite (Chromium, headless)
npm run test:smoke         # solo el happy path (@smoke)
npm run test:regression    # casos complementarios y negativos (@regression)
npm run test:all-browsers  # Chromium + Firefox + WebKit (requiere: npx playwright install)
npm run test:cleanup       # ejecuta y elimina los proyectos creados al terminar
npm run test:headed        # viendo el navegador
npm run test:ui            # modo UI de Playwright
npm run report             # abre el reporte HTML
npm run lint               # ESLint (TypeScript + reglas de Playwright)
npx playwright test -g "TC05"   # un caso puntual
```

Ante un fallo se guardan screenshot, video y trace en `test-results/` (abrir con `npx playwright show-trace`). Los casos de templates adjuntan al reporte el **reporte de validación** que devuelve Lebane.

## Decisiones técnicas

- **Selectores estables**: se priorizan roles accesibles y atributos de la app (`data-cy="new-renderer-field-*"`, `name`, `data-column-id` de la grilla) en lugar de clases CSS generadas.
- **Menús de Material UI**: antes de cada acción se cierra cualquier menú abierto, ya que su backdrop invisible bloquea los clicks.
- **Sesión reutilizada**: el login corre una sola vez (proyecto `setup`) y se guarda el `storageState`.
- **Datos únicos por ejecución**: nombres de proyecto, listas y unidades llevan timestamp para evitar colisiones en el ambiente compartido.
- **Templates generados en runtime** con `exceljs`, respetando las columnas de la plantilla oficial; el reporte de validación se descarga y se analiza fila por fila.
- **Validación de persistencia**: tras las acciones clave se recarga la página y se vuelve a verificar el estado.

## CI (GitHub Actions)

`.github/workflows/playwright.yml` corre lint y la suite en cada push a `main` o manualmente (*Actions → Playwright Tests → Run workflow*).

- Requiere los secrets `LEBANE_USER` y `LEBANE_PASSWORD` (*Settings → Secrets and variables → Actions*). Si faltan, el job lo avisa y omite los tests.
- Las fallas se publican como anotaciones en el resumen del run.
- El reporte HTML y los resultados (screenshots, videos, traces) quedan como artefactos del job.
