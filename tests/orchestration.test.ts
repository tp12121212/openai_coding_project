import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { runOrchestration } from '../src/lib/orchestration/service';

describe('orchestration flow', () => {
  test('completes supported phases and marks unsupported chatgpt phase as disabled/manual', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestration-'));
    const { job, jobPath } = await runOrchestration(
      {
        projectName: 'Orchestration Test Project',
        description: 'Validate orchestration status behavior',
        localPath: './orchestrated-project',
        templateId: 'node-api',
        codexProfile: 'strict',
        promptPackId: 'default-engineering',
        initializeGit: false,
        createBranch: false,
        createWorktree: false
      },
      temp
    );

    expect(job.state).toBe('completed');
    expect(job.result?.steps).toBeDefined();

    const persisted = await fs.readFile(jobPath, 'utf8');
    expect(persisted).toContain('"phase-4-chatgpt-internal"');
    expect(persisted).toMatch(/"status": "(disabled|manual_required)"/);
  });
});
