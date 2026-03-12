import path from 'node:path';
import { CreateProjectRequest } from './schema';
import { getPromptPack } from './prompts';
import { getTemplateById } from '../templates/library';
import { ScaffoldManifest } from '../types';
import { normalizeWhitespace, sha256, stableJSONStringify } from '../utils/deterministic';

interface GeneratedFile {
  path: string;
  content: string;
}

export interface ScaffoldResult {
  manifest: ScaffoldManifest;
  files: GeneratedFile[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderMarkdown(title: string, body: string): string {
  return normalizeWhitespace(`# ${title}\n\n${body}\n`) + '\n';
}

export function buildScaffold(request: CreateProjectRequest): ScaffoldResult {
  const template = getTemplateById(request.templateId);
  const slug = slugify(request.projectName);
  const promptFiles = getPromptPack(request.promptPackId);

  const bootstrapInstruction = [
    '## Supported automation boundary',
    '- Supported: scaffold generation, GitHub repo creation, optional initial push, repository variables.',
    '- Unsupported: direct ChatGPT project/workspace creation and chat seeding via public API.',
    '',
    '## Manual finalization workflow',
    '1. Create or open your target ChatGPT/Codex project workspace manually.',
    '2. Upload or copy files from `PROMPTS/` and `TASKS/`.',
    '3. Apply `.codex/config.toml` and `.codex/instructions.md` in your coding agent context.',
    '4. Paste `BOOTSTRAP/MANUAL_FINALIZATION.md` checklist into your starter chat and complete each step.'
  ].join('\n');

  const fileMap: GeneratedFile[] = [
    {
      path: 'README.md',
      content: renderMarkdown(
        request.projectName,
        `${request.description}\n\nTemplate: ${template.name}\n\nThis project was created through the orchestration workflow with explicit supported/unsupported boundaries.`
      )
    },
    {
      path: 'PROJECT_CONTEXT.md',
      content: renderMarkdown('Project Context', `Project slug: ${slug}\nRuntime: ${template.runtime}`)
    },
    {
      path: 'ARCHITECTURE.md',
      content: renderMarkdown('Architecture', `Selected stack: ${template.description}`)
    },
    {
      path: 'IMPLEMENTATION_PLAN.md',
      content: renderMarkdown('Implementation Plan', template.tasks.map((task) => `- ${task}`).join('\n'))
    },
    {
      path: '.codex/config.toml',
      content:
        normalizeWhitespace(
          [`profile = "${request.codexProfile}"`, 'unsupported_automation = false', 'deterministic = true'].join(
            '\n'
          )
        ) + '\n'
    },
    {
      path: '.codex/instructions.md',
      content: renderMarkdown(
        'Codex Instructions',
        'Follow existing patterns, inspect modules first, run tests, and explain assumptions.'
      )
    },
    {
      path: 'TASKS/00-initial-backlog.md',
      content: renderMarkdown('Initial Backlog', template.tasks.map((task) => `- [ ] ${task}`).join('\n'))
    },
    {
      path: 'BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md',
      content: renderMarkdown('Project Bootstrap Pack', bootstrapInstruction)
    },
    {
      path: 'BOOTSTRAP/MANUAL_FINALIZATION.md',
      content: renderMarkdown(
        'Manual Finalization Checklist',
        '- [ ] Create workspace manually in ChatGPT/Codex\n- [ ] Seed prompt pack files\n- [ ] Seed tasks and context files\n- [ ] Start kickoff chat with implementation plan'
      )
    }
  ];

  for (const prompt of promptFiles) {
    fileMap.push({
      path: path.posix.join('PROMPTS', prompt.fileName),
      content: normalizeWhitespace(prompt.content) + '\n'
    });
  }

  const artifactRecords = fileMap
    .map((file) => {
      const kind: 'json' | 'toml' | 'markdown' = file.path.endsWith('.json')
        ? 'json'
        : file.path.endsWith('.toml')
          ? 'toml'
          : 'markdown';
      return {
        path: file.path,
        kind,
        checksum: sha256(file.content)
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const manifest: ScaffoldManifest = {
    schemaVersion: '2.0.0',
    project: {
      name: request.projectName,
      slug,
      localPath: request.localPath,
      description: request.description
    },
    stack: {
      templateId: request.templateId,
      templateVersion: '1.0.0',
      language: template.language,
      runtime: template.runtime
    },
    repository: {
      initializeGit: request.initializeGit,
      createBranch: request.createBranch,
      branchName: request.createBranch ? request.branchName ?? 'feature/bootstrap' : null,
      createWorktree: request.createWorktree,
      worktreePath: request.createWorktree ? request.worktreePath ?? './worktrees/default' : null,
      github: {
        enabled: Boolean(request.github?.enabled),
        owner: request.github?.owner ?? null,
        repo: request.github?.repo ?? null,
        private: request.github?.private ?? true,
        pushInitialContent: Boolean(request.github?.pushInitialContent)
      }
    },
    codex: {
      profile: request.codexProfile,
      unsupportedAutomationEnabled: false
    },
    prompts: {
      packId: request.promptPackId,
      files: promptFiles.map((file) => `PROMPTS/${file.fileName}`).sort((a, b) => a.localeCompare(b))
    },
    bootstrapPack: {
      schemaVersion: '1.0.0',
      manualFinalizationRequired: true,
      files: ['BOOTSTRAP/MANUAL_FINALIZATION.md', 'BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md']
    },
    generatedArtifacts: artifactRecords,
    validation: {
      deterministic: true,
      sortedKeys: true,
      normalizedWhitespace: true
    }
  };

  fileMap.push({ path: 'project.scaffold.json', content: stableJSONStringify(manifest) });

  return { manifest, files: fileMap.sort((a, b) => a.path.localeCompare(b.path)) };
}
