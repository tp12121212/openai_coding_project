import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildScaffold } from '../src/lib/generator/scaffold';

describe('golden output', () => {
  test('matches expected artifact list', () => {
    const result = buildScaffold({
      schemaVersion: '3.0.0',
      projectName: 'Golden Project',
      description: 'Golden fixture',
      templateId: 'nextjs-web-app',
      category: 'web-platform',
      codexProfile: 'strict',
      promptPackId: 'default-engineering',
      deliveryMode: 'zip',
      initializeGit: false,
      createBranch: false,
      createWorktree: false
    });

    const fixture = fs
      .readFileSync(path.join(process.cwd(), 'tests/golden/expected-file-list.txt'), 'utf8')
      .trim()
      .split('\n');

    expect(result.files.map((f) => f.path)).toEqual(fixture);
  });
});
