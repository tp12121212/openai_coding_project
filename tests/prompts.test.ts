import { describe, expect, test } from 'vitest';
import { derivePromptPackId, getPromptPack, getPromptPackDefinition } from '../src/lib/generator/prompts';
import { CreateProjectRequestSchema } from '../src/lib/generator/schema';

describe('prompt pack derivation', () => {
  test('same template with different categories yields different prompt pack ids', () => {
    expect(derivePromptPackId('node-api', 'automation')).not.toBe(derivePromptPackId('node-api', 'api-service'));
  });

  test('same category with different templates yields different prompt pack ids', () => {
    expect(derivePromptPackId('node-api', 'automation')).not.toBe(derivePromptPackId('python-cli', 'automation'));
  });

  test('prompt pack id generation is deterministic', () => {
    expect(derivePromptPackId('nextjs-web-app', 'web-platform')).toBe('nextjs-web-app--web-platform');
  });

  test('schema normalization rewrites stale prompt pack ids from template/category', () => {
    const parsed = CreateProjectRequestSchema.parse({
      schemaVersion: '3.0.0',
      projectName: 'Schema Test',
      description: 'Ensures stale prompt pack values are normalized.',
      templateId: 'node-api',
      category: 'automation',
      codexProfile: 'strict',
      promptPackId: 'legacy-pack-id',
      deliveryMode: 'zip',
      initializeGit: false,
      createBranch: false,
      createWorktree: false
    });
    expect(parsed.promptPackId).toBe('node-api--automation');
  });
});

describe('prompt generation', () => {
  test('generated prompt content changes by template and category guidance', () => {
    const nodeApiAutomation = getPromptPack('node-api', 'automation')[0]?.content ?? '';
    const nextWebAutomation = getPromptPack('nextjs-web-app', 'automation')[0]?.content ?? '';
    const nodeApiResearch = getPromptPack('node-api', 'research')[0]?.content ?? '';

    expect(nodeApiAutomation).toContain('Define contract-first request/response schemas and validation paths.');
    expect(nodeApiAutomation).toContain('Make scripts idempotent and safe to re-run across environments.');
    expect(nextWebAutomation).not.toBe(nodeApiAutomation);
    expect(nodeApiResearch).not.toBe(nodeApiAutomation);
  });

  test('prompt pack definition includes deterministic metadata', () => {
    const definition = getPromptPackDefinition('security-compliance', 'security-compliance');
    expect(definition.id).toBe('security-compliance--security-compliance');
    expect(definition.label).toContain('Security/Compliance');
    expect(definition.description.length).toBeGreaterThan(20);
  });
});
