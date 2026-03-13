import { describe, expect, test } from 'vitest';
import { buildScaffold } from '../src/lib/generator/scaffold';

const request = {
  schemaVersion: '3.0.0' as const,
  projectName: 'Deterministic Project',
  description: 'A deterministic scaffold for testing.',
  templateId: 'security-compliance' as const,
  codexProfile: 'strict' as const,
  promptPackId: 'security-compliance-focused' as const,
  category: 'security-compliance' as const,
  deliveryMode: 'zip' as const,
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
    expect(a.manifest.schemaVersion).toBe('3.0.0');
  });
});
