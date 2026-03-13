import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { buildScaffold } from './scaffold';
import { CreateProjectRequest } from './schema';
import { stableJSONStringify } from '../utils/deterministic';

export interface HygieneCheckResult {
  excludedFiles: string[];
  warnings: string[];
}

export interface CreateProjectResult {
  outputPath: string;
  manifestPath: string;
  filesWritten: string[];
  files: Array<{ path: string; content: string }>;
  hygiene: HygieneCheckResult;
}

const EXCLUDED_PATTERNS = [/\.pem$/i, /^\.env/i, /^node_modules\//, /\/node_modules\//, /id_rsa/i];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolveOutputPath(outputRoot: string, projectName: string): string {
  const slug = slugify(projectName) || 'project';
  return path.resolve(outputRoot, slug);
}


export function runHygieneChecks(files: Array<{ path: string; content: string }>): { safeFiles: Array<{ path: string; content: string }>; result: HygieneCheckResult } {
  const excludedFiles: string[] = [];
  const warnings: string[] = [];
  const safeFiles = files.filter((file) => {
    const excluded = EXCLUDED_PATTERNS.some((pattern) => pattern.test(file.path));
    if (excluded) {
      excludedFiles.push(file.path);
      return false;
    }
    if (file.content.length > 200_000) {
      excludedFiles.push(file.path);
      warnings.push(`Excluded oversized file: ${file.path}`);
      return false;
    }
    return true;
  });

  return {
    safeFiles: safeFiles.sort((a, b) => a.path.localeCompare(b.path)),
    result: {
      excludedFiles: excludedFiles.sort((a, b) => a.localeCompare(b)),
      warnings: warnings.sort((a, b) => a.localeCompare(b))
    }
  };
}

export async function createZipBuffer(files: Array<{ path: string; content: string }>): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    zip.file(file.path, file.content, { date: new Date('2000-01-01T00:00:00.000Z') });
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export async function createProjectScaffold(
  request: CreateProjectRequest,
  outputRoot: string
): Promise<CreateProjectResult> {
  const safeOutput = resolveOutputPath(outputRoot, request.projectName);
  const { files, manifest } = buildScaffold(request);
  const { safeFiles, result } = runHygieneChecks(files);

  await fs.mkdir(safeOutput, { recursive: true });

  const filesWritten: string[] = [];
  for (const file of safeFiles) {
    const absolute = path.join(safeOutput, file.path);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.content, 'utf8');
    filesWritten.push(file.path);
  }

  const manifestPath = path.join(safeOutput, 'project.scaffold.json');
  await fs.writeFile(manifestPath, stableJSONStringify(manifest), 'utf8');

  return {
    outputPath: safeOutput,
    manifestPath,
    filesWritten: filesWritten.sort((a, b) => a.localeCompare(b)),
    files: safeFiles,
    hygiene: result
  };
}

export function importManifest(content: string) {
  return JSON.parse(content) as Record<string, unknown>;
}
