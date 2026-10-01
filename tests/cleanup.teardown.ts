import { test as teardown } from '@playwright/test';
import { ProjectSettingsPage } from '../pages/ProjectSettingsPage';
import { readCreatedProjects, resetCreatedProjects } from '../utils/createdProjects';

/**
 * Limpieza opcional de datos de prueba: elimina los proyectos creados en esta ejecución.
 * Se activa con CLEANUP=true (por defecto los proyectos se conservan para poder revisarlos en la app).
 */
// eslint-disable-next-line playwright/expect-expect -- tarea de limpieza, no es un caso de prueba
teardown('limpieza de proyectos creados por la suite', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  const created = readCreatedProjects();
  if (process.env.CLEANUP !== 'true' || created.length === 0) {
    teardown.info().annotations.push({
      type: 'cleanup',
      description: `Se conservan ${created.length} proyecto(s) creados (CLEANUP != true).`,
    });
    return;
  }
  const settings = new ProjectSettingsPage(page);
  for (const p of created) {
    try {
      await settings.deleteProject(p.id);
    } catch (e) {
      teardown
        .info()
        .annotations.push({ type: 'warning', description: `No se pudo eliminar ${p.name} (${p.id}): ${e}` });
    }
  }
  resetCreatedProjects();
});
