export const BUILT_IN_TEMPLATE_IDS = [
  'full-stack-saas',
  'nextjs-web-app',
  'node-api',
  'python-cli',
  'research-docs',
  'security-compliance'
] as const;

export type BuiltInTemplateId = (typeof BUILT_IN_TEMPLATE_IDS)[number];

export const PROJECT_CATEGORIES = ['web-platform', 'api-service', 'automation', 'security-compliance', 'research'] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const CODEX_PROFILES = ['strict', 'balanced', 'rapid'] as const;

export type CodexProfile = (typeof CODEX_PROFILES)[number];

export type PromptPackId = `${BuiltInTemplateId}--${ProjectCategory}`;

export interface ArtifactRecord {
  path: string;
  kind: 'markdown' | 'json' | 'toml' | 'text';
  checksum: string;
}

export interface ScaffoldManifest {
  schemaVersion: '3.0.0';
  project: {
    name: string;
    slug: string;
    description: string;
    category: string;
    codexProfile: CodexProfile;
  };
  stack: {
    templateId: BuiltInTemplateId;
    templateVersion: string;
    language: string;
    runtime: string;
  };
  delivery: {
    mode: 'zip' | 'github-new-repo' | 'github-existing-repo';
  };
  hygiene: {
    checksVersion: '1.0.0';
    baselineFiles: string[];
  };
  prompts: {
    packId: PromptPackId;
    files: string[];
  };
  bootstrapPack: {
    schemaVersion: '1.0.0';
    manualFinalizationRequired: true;
    files: string[];
  };
  generatedArtifacts: ArtifactRecord[];
  validation: {
    deterministic: true;
    sortedKeys: true;
    normalizedWhitespace: true;
  };
}
