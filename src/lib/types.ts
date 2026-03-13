export type BuiltInTemplateId =
  | 'full-stack-saas'
  | 'nextjs-web-app'
  | 'node-api'
  | 'python-cli'
  | 'research-docs'
  | 'security-compliance';

export type PromptPackId = 'default-engineering' | 'security-compliance-focused';

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
