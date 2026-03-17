import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createProjectScaffold } from '../src/lib/generator/service';
import { derivePromptPackId } from '../src/lib/generator/prompts';

describe('create-project flow', () => {
  test('writes scaffold files to output directory', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffold-manager-'));
    const result = await createProjectScaffold(
      {
        schemaVersion: '3.0.0',
        projectName: 'Integration Test Project',
        description: 'Testing end-to-end file generation.',
        templateId: 'node-api',
        category: 'automation',
        codexProfile: 'rapid',
        promptPackId: derivePromptPackId('node-api', 'automation'),
        deliveryMode: 'zip',
        initializeGit: false,
        createBranch: false,
        createWorktree: false
      },
      temp
    );

    const manifest = await fs.readFile(result.manifestPath, 'utf8');
    expect(result.filesWritten.length).toBeGreaterThan(10);
    expect(manifest).toContain('"schemaVersion": "3.0.0"');
    expect(manifest).toContain('"packId": "node-api--automation"');
    expect(result.filesWritten).toContain('.gitignore');
    expect(result.files.find((file) => file.path === '.codex/config.toml')?.content).toContain('profile = "rapid"');
    expect(result.filesWritten).toContain('BEST_PRACTICES_CHATGPT_CODEX.md');
  });
});
