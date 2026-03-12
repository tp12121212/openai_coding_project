export type BuiltInTemplateId =
  | 'full-stack-saas'
  | 'nextjs-web-app'
  | 'node-api'
  | 'python-cli'
  | 'research-docs'
  | 'security-compliance';

export type PromptPackId =
  | 'default-engineering'
  | 'security-compliance-focused';

export interface ArtifactRecord {
  path: string;
  kind: 'markdown' | 'json' | 'toml' | 'text';
  checksum: string;
}

export interface ScaffoldManifest {
  schemaVersion: '1.0.0';
  project: {
    name: string;
    slug: string;
    localPath: string;
    description: string;
  };
  stack: {
    templateId: BuiltInTemplateId;
    templateVersion: string;
    language: string;
    runtime: string;
  };
  repository: {
    initializeGit: boolean;
    createBranch: boolean;
    branchName: string | null;
    createWorktree: boolean;
    worktreePath: string | null;
  };
  codex: {
    profile: 'strict' | 'balanced' | 'rapid';
    unsupportedAutomationEnabled: false;
  };
  prompts: {
    packId: PromptPackId;
    files: string[];
  };
  generatedArtifacts: ArtifactRecord[];
  validation: {
    deterministic: true;
    sortedKeys: true;
    normalizedWhitespace: true;
  };
}
