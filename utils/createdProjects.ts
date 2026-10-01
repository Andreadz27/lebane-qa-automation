import * as fs from 'fs';
import * as path from 'path';

/**
 * Registro de los proyectos creados durante la ejecución, para poder limpiarlos al final
 * (ver tests/cleanup.teardown.ts, se activa con CLEANUP=true).
 */
const FILE = path.resolve(__dirname, '..', 'tmp', 'created-projects.json');

export function registerCreatedProject(id: string, name: string) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const list = readCreatedProjects();
  list.push({ id, name });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function readCreatedProjects(): { id: string; name: string }[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function resetCreatedProjects() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, '[]');
}
