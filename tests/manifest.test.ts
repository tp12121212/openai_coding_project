import { describe, expect, test } from 'vitest';
import { buildScaffold } from '../src/lib/generator/scaffold';
import { derivePromptPackId } from '../src/lib/generator/prompts';

const request = {
  schemaVersion: '3.0.0' as const,
  projectName: 'Deterministic Project',
  description: 'A deterministic scaffold for testing.',
  templateId: 'security-compliance' as const,
  codexProfile: 'strict' as const,
  promptPackId: derivePromptPackId('security-compliance', 'security-compliance'),
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
    expect(a.manifest.prompts.packId).toBe('security-compliance--security-compliance');

    const codexInstructions = a.files.find((file) => file.path === '.codex/instructions.md')?.content ?? '';
    const codexConfig = a.files.find((file) => file.path === '.codex/config.toml')?.content ?? '';
    const readme = a.files.find((file) => file.path === 'README.md')?.content ?? '';
    expect(codexConfig).toContain('profile = "strict"');
    expect(codexInstructions).toContain('Active Codex profile: Strict (strict)');
    expect(readme).toContain('Prompt pack: Security/Compliance Coding Project + Security/Compliance (security-compliance--security-compliance)');
  });
});
