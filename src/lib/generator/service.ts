import fs from 'node:fs/promises';
import path from 'node:path';
import { buildScaffold } from './scaffold';
import { CreateProjectRequest } from './schema';
import { validateLocalPath } from '../validation/path';
import { stableJSONStringify } from '../utils/deterministic';

export interface CreateProjectResult {
  outputPath: string;
  manifestPath: string;
  filesWritten: string[];
}

export async function createProjectScaffold(
  request: CreateProjectRequest,
  outputRoot: string
): Promise<CreateProjectResult> {
  const safeOutput = validateLocalPath(outputRoot, request.localPath);
  const { files, manifest } = buildScaffold(request);

  await fs.mkdir(safeOutput, { recursive: true });

  const filesWritten: string[] = [];
  for (const file of files) {
    const absolute = path.join(safeOutput, file.path);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.content, 'utf8');
    filesWritten.push(file.path);
  }

  const exportPath = path.join(safeOutput, 'export.manifest.json');
  await fs.writeFile(exportPath, stableJSONStringify(manifest), 'utf8');

  return {
    outputPath: safeOutput,
    manifestPath: path.join(safeOutput, 'project.scaffold.json'),
    filesWritten: filesWritten.sort((a, b) => a.localeCompare(b))
  };
}

export function importManifest(content: string) {
  return JSON.parse(content) as Record<string, unknown>;
}
