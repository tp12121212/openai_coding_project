import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { runOrchestration } from '../src/lib/orchestration/service';

describe('orchestration flow', () => {
  test('zip delivery mode works without github auth', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestration-'));
    const { job, jobPath } = await runOrchestration(
      {
        schemaVersion: '3.0.0',
        projectName: 'Orchestration Test Project',
        description: 'Validate orchestration status behavior',
        templateId: 'node-api',
        category: 'api-service',
        codexProfile: 'strict',
        promptPackId: 'default-engineering',
        deliveryMode: 'zip',
        initializeGit: false,
        createBranch: false,
        createWorktree: false
      },
      temp
    );

    expect(job.state).toBe('completed');
    const persisted = await fs.readFile(jobPath, 'utf8');
    expect(persisted).toContain('"mode": "zip"');
  });
});
