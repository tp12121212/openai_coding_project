import { createHash } from 'node:crypto';

export function stableSortObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stableSortObject(item)) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return Object.fromEntries(entries.map(([key, entry]) => [key, stableSortObject(entry)])) as T;
  }
  return value;
}

export function stableJSONStringify(value: unknown): string {
  const sorted = stableSortObject(value);
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\t/g, '  ').replace(/[ \t]+$/gm, '').trimEnd();
}
