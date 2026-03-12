import path from 'node:path';

const SAFE_PATH = /^[a-zA-Z0-9._\-/]+$/;

export function validateLocalPath(basePath: string, requestedPath: string): string {
  if (!SAFE_PATH.test(requestedPath)) {
    throw new Error('Path contains unsupported characters.');
  }

  const normalized = path.resolve(basePath, requestedPath);
  if (!normalized.startsWith(path.resolve(basePath))) {
    throw new Error('Path escapes permitted root.');
  }
  return normalized;
}
