import path from 'node:path';
import { CreateProjectRequest } from './schema';
import { getPromptPack } from './prompts';
import { getTemplateById } from '../templates/library';
import { ScaffoldManifest } from '../types';
import { normalizeWhitespace, sha256 } from '../utils/deterministic';

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

function buildReadmeBody(request: CreateProjectRequest, templateName: string): string {
  return normalizeWhitespace([
    request.description,
    `Template: ${templateName}`,
    `Project category: ${request.category}`,
    `Delivery mode: ${request.deliveryMode}`,
    '',
    '## Getting started',
    '1. Review IMPLEMENTATION_PLAN.md',
    '2. Review hygiene baseline files (.gitignore, .editorconfig, LICENSE)',
    '3. Run quality checks before first commit.'
  ].join('\n'));
}

function gitignoreForTemplate(templateId: CreateProjectRequest['templateId']): string {
  const common = ['.DS_Store', '*.log', '.env', '.env.*', 'coverage/', 'dist/', '.next/', 'output/'];
  const node = ['node_modules/', '.npm/', '.pnpm-store/', 'npm-debug.log*'];
  const python = ['.venv/', '__pycache__/', '*.pyc', '.pytest_cache/', '.mypy_cache/'];
  const lines = [...common, ...(templateId === 'python-cli' ? python : node), '.orchestration/'];
  return `${lines.sort((a, b) => a.localeCompare(b)).join('\n')}\n`;
}

export function buildScaffold(request: CreateProjectRequest): ScaffoldResult {
  const template = getTemplateById(request.templateId);
  const slug = slugify(request.projectName);
  const promptFiles = getPromptPack(request.promptPackId);

  const fileMap: GeneratedFile[] = [
    { path: 'README.md', content: renderMarkdown(request.projectName, buildReadmeBody(request, template.name)) },
    {
      path: '.gitignore',
      content: gitignoreForTemplate(request.templateId)
    },
    {
      path: '.editorconfig',
      content: normalizeWhitespace('root = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\ninsert_final_newline = true\nindent_style = space\nindent_size = 2') + '\n'
    },
    {
      path: 'LICENSE',
      content: normalizeWhitespace('SPDX-License-Identifier: UNLICENSED\n\nReplace with your approved license text before distribution.') + '\n'
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
        normalizeWhitespace([`profile = "${request.codexProfile}"`, 'unsupported_automation = false', 'deterministic = true'].join('\n')) + '\n'
    },
    {
      path: '.codex/instructions.md',
      content: renderMarkdown('Codex Instructions', 'Follow existing patterns, inspect modules first, run tests, and explain assumptions.')
    },
    {
      path: 'TASKS/00-initial-backlog.md',
      content: renderMarkdown('Initial Backlog', template.tasks.map((task) => `- [ ] ${task}`).join('\n'))
    },
    {
      path: 'BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md',
      content: renderMarkdown('Project Bootstrap Pack', 'Use this scaffold as a deterministic starting point.')
    },
    {
      path: 'BOOTSTRAP/MANUAL_FINALIZATION.md',
      content: renderMarkdown('Manual Finalization Checklist', '- [ ] Seed prompts\n- [ ] Seed tasks\n- [ ] Run checks')
    }
  ];

  for (const prompt of promptFiles) {
    fileMap.push({
      path: path.posix.join('PROMPTS', prompt.fileName),
      content: normalizeWhitespace(prompt.content) + '\n'
    });
  }

  const files = fileMap.sort((a, b) => a.path.localeCompare(b.path));

  const artifactRecords = files
    .map((file) => ({
      path: file.path,
      kind: (file.path.endsWith('.json') ? 'json' : file.path.endsWith('.toml') ? 'toml' : file.path.endsWith('.md') ? 'markdown' : 'text') as 'json' | 'toml' | 'markdown' | 'text',
      checksum: sha256(file.content)
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const manifest: ScaffoldManifest = {
    schemaVersion: '3.0.0',
    project: {
      name: request.projectName,
      slug,
      description: request.description,
      category: request.category
    },
    stack: {
      templateId: request.templateId,
      templateVersion: '1.1.0',
      language: template.language,
      runtime: template.runtime
    },
    delivery: { mode: request.deliveryMode },
    hygiene: {
      checksVersion: '1.0.0',
      baselineFiles: ['.editorconfig', '.gitignore', 'LICENSE']
    },
    prompts: {
      packId: request.promptPackId,
      files: promptFiles.map((p) => path.posix.join('PROMPTS', p.fileName)).sort((a, b) => a.localeCompare(b))
    },
    bootstrapPack: {
      schemaVersion: '1.0.0',
      manualFinalizationRequired: true,
      files: ['BOOTSTRAP/PROJECT_BOOTSTRAP_PACK.md', 'BOOTSTRAP/MANUAL_FINALIZATION.md']
    },
    generatedArtifacts: artifactRecords,
    validation: {
      deterministic: true,
      sortedKeys: true,
      normalizedWhitespace: true
    }
  };

  return { manifest, files };
}
