import { describe, expect, test } from 'vitest';
import { buildScaffold } from '../src/lib/generator/scaffold';

const request = {
  projectName: 'Deterministic Project',
  description: 'A deterministic scaffold for testing.',
  localPath: './deterministic-project',
  templateId: 'security-compliance' as const,
  codexProfile: 'strict' as const,
  promptPackId: 'security-compliance-focused' as const,
  initializeGit: true,
  createBranch: true,
  branchName: 'feature/deterministic',
  createWorktree: false
};

describe('manifest generation', () => {
  test('produces deterministic scaffold outputs', () => {
    const a = buildScaffold(request);
    const b = buildScaffold(request);

    expect(a.files).toEqual(b.files);
    expect(a.manifest).toEqual(b.manifest);
    expect(a.manifest.schemaVersion).toBe('2.0.0');
  });
});
