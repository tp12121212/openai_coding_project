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

  const fileMap: GeneratedFile[] = [
    {
      path: 'README.md',
      content: renderMarkdown(request.projectName, `${request.description}\n\nTemplate: ${template.name}`)
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
      content: normalizeWhitespace(
        [`profile = "${request.codexProfile}"`, 'unsupported_automation = false', 'deterministic = true'].join('\n')
      ) + '\n'
    },
    {
      path: '.codex/instructions.md',
      content:
        renderMarkdown(
          'Codex Instructions',
          'Follow existing patterns, inspect modules first, run tests, and explain assumptions.'
        )
    },
    {
      path: 'TASKS/00-initial-backlog.md',
      content: renderMarkdown('Initial Backlog', template.tasks.map((task) => `- [ ] ${task}`).join('\n'))
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
    schemaVersion: '1.0.0',
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
      worktreePath: request.createWorktree ? request.worktreePath ?? './worktrees/default' : null
    },
    codex: {
      profile: request.codexProfile,
      unsupportedAutomationEnabled: false
    },
    prompts: {
      packId: request.promptPackId,
      files: promptFiles.map((file) => `PROMPTS/${file.fileName}`)
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
