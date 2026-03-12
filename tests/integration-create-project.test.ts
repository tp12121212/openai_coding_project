import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createProjectScaffold } from '../src/lib/generator/service';

describe('create-project flow', () => {
  test('writes scaffold files to output directory', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffold-manager-'));
    const result = await createProjectScaffold(
      {
        projectName: 'Integration Test Project',
        description: 'Testing end-to-end file generation.',
        localPath: './project-one',
        templateId: 'nextjs-web-app',
        codexProfile: 'balanced',
        promptPackId: 'default-engineering',
        initializeGit: false,
        createBranch: false,
        createWorktree: false
      },
      temp
    );

    const manifest = await fs.readFile(result.manifestPath, 'utf8');
    expect(result.filesWritten.length).toBeGreaterThan(8);
    expect(manifest).toContain('"schemaVersion": "1.0.0"');
  });
});
