import { describe, expect, test } from 'vitest';
import { validateLocalPath } from '../src/lib/validation/path';

describe('path validation', () => {
  test('accepts safe path under base root', () => {
    const result = validateLocalPath('/tmp/base', 'safe/project');
    expect(result).toContain('/tmp/base/safe/project');
  });

  test('rejects unsafe characters', () => {
    expect(() => validateLocalPath('/tmp/base', 'bad path')).toThrow();
  });

  test('rejects path traversal', () => {
    expect(() => validateLocalPath('/tmp/base', '../escape')).toThrow();
  });
});
