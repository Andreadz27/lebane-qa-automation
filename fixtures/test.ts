import { test as base, Page } from '@playwright/test';
import { NewProjectPage } from '../pages/NewProjectPage';
import { UnitsPage } from '../pages/UnitsPage';
import { AreasData, ProjectData, areasData, newProjectData } from '../utils/data';
import { registerCreatedProject } from '../utils/createdProjects';

type Fixtures = {
  newProjectPage: NewProjectPage;
  unitsPage: UnitsPage;
};

export const test = base.extend<Fixtures>({
  newProjectPage: async ({ page }, use) => use(new NewProjectPage(page)),
  unitsPage: async ({ page }, use) => use(new UnitsPage(page)),
});

export { expect } from '@playwright/test';

/**
 * Crea un proyecto desde la UI y realiza la configuración inicial de unidades,
 * que es donde Lebane crea la lista de precios inicial.
 */
export async function createProjectWithInitialPriceList(
  page: Page,
  project: Partial<ProjectData> = {},
  areas: Partial<AreasData> = {},
) {
  const projectData = newProjectData(project);
  const areaData = areasData(areas);
  const newProject = new NewProjectPage(page);
  await newProject.openFromHome();
  await newProject.fill(projectData);
  const projectId = await newProject.submit();
  registerCreatedProject(projectId, projectData.nombre);

  const units = new UnitsPage(page);
  await units.goto(projectId);
  await units.configureProject(areaData);
  await units.openUnitsTab();
  return { projectId, projectData, areaData, units };
}
