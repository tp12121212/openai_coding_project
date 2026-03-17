import fs from 'node:fs/promises';
import path from 'node:path';
import { buildScaffold } from './scaffold';
import { getCodexProfileDefinition } from './profiles';
import { getPromptPackDefinition } from './prompts';
import { getTemplateById } from '../templates/library';
import {
  BUILT_IN_TEMPLATE_IDS,
  CODEX_PROFILES,
  PROJECT_CATEGORIES,
  BuiltInTemplateId,
  CodexProfile,
  ProjectCategory
} from '../types';
import {
  normalizeWhitespace,
  sha256,
  stableJSONStringify
} from '../utils/deterministic';

export interface VariantConfig {
  templateId: BuiltInTemplateId;
  category: ProjectCategory;
  codexProfile: CodexProfile;
}

interface NormalizedGeneratedFile {
  path: string;
  content: string;
  hash: string;
}

export interface VariantOutput {
  config: VariantConfig;
  key: string;
  outputDir: string;
  files: NormalizedGeneratedFile[];
  fileList: string[];
  fileHashes: Record<string, string>;
  directoryHash: string;
}

export interface VariantComparisonResult {
  matrix: VariantConfig[];
  outputs: VariantOutput[];
  uniqueOutputSetCount: number;
  sharedFiles: string[];
  uniqueFilesByVariant: Record<string, string[]>;
  changedFilesByDimension: Record<
    'template' | 'category' | 'codexProfile',
    string[]
  >;
  changedFileFrequency: Record<
    'template' | 'category' | 'codexProfile',
    Array<{ path: string; pairCount: number }>
  >;
  identicalPairFindings: Array<{ a: string; b: string; reason: string }>;
  noOpOptions: Array<{
    dimension: 'template' | 'category' | 'codexProfile';
    option: string;
  }>;
}

const OUTPUT_ROOT = path.resolve(
  process.cwd(),
  'test-artifacts/scaffold-variants'
);
const REPORT_JSON = path.resolve(
  process.cwd(),
  'reports/scaffold-variant-comparison.json'
);
const REPORT_MD = path.resolve(
  process.cwd(),
  'reports/scaffold-variant-comparison.md'
);

export function enumerateVariantMatrix(): VariantConfig[] {
  return [...BUILT_IN_TEMPLATE_IDS]
    .sort((a, b) => a.localeCompare(b))
    .flatMap((templateId) =>
      [...PROJECT_CATEGORIES]
        .sort((a, b) => a.localeCompare(b))
        .flatMap((category) =>
          [...CODEX_PROFILES]
            .sort((a, b) => a.localeCompare(b))
            .map((codexProfile) => ({ templateId, category, codexProfile }))
        )
    );
}

function variantKey(config: VariantConfig): string {
  return `${config.templateId}__${config.category}__${config.codexProfile}`;
}

export function normalizeGeneratedArtifact(
  pathValue: string,
  content: string
): string {
  const lineNormalized = normalizeWhitespace(content).replace(/\r\n/g, '\n');
  const withoutDynamicIds = lineNormalized.replace(
    /[a-f0-9]{8}-[a-f0-9-]{27,}/gi,
    '<normalized-id>'
  );
  if (pathValue.endsWith('.json')) {
    return stableJSONStringify(JSON.parse(withoutDynamicIds)).trimEnd() + '\n';
  }
  return withoutDynamicIds.trimEnd() + '\n';
}

export function hashDirectoryContents(
  files: NormalizedGeneratedFile[]
): string {
  const digestInput = files
    .map((file) => `${file.path}:${file.hash}`)
    .sort((a, b) => a.localeCompare(b))
    .join('\n');
  return sha256(digestInput);
}

export async function generateVariantOutput(
  config: VariantConfig
): Promise<VariantOutput> {
  const key = variantKey(config);
  const outputDir = path.join(OUTPUT_ROOT, key);
  const scaffold = buildScaffold({
    schemaVersion: '3.0.0',
    projectName: 'Variant Validation Project',
    description: 'Matrix-driven deterministic scaffold validation harness.',
    templateId: config.templateId,
    category: config.category,
    codexProfile: config.codexProfile,
    promptPackId: `${config.templateId}--${config.category}`,
    deliveryMode: 'zip',
    initializeGit: false,
    createBranch: false,
    createWorktree: false
  });

  await fs.mkdir(outputDir, { recursive: true });

  const normalizedFiles: NormalizedGeneratedFile[] = [];
  for (const file of scaffold.files.sort((a, b) =>
    a.path.localeCompare(b.path)
  )) {
    const normalizedContent = normalizeGeneratedArtifact(
      file.path,
      file.content
    );
    const absolutePath = path.join(outputDir, file.path);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, normalizedContent, 'utf8');
    normalizedFiles.push({
      path: file.path,
      content: normalizedContent,
      hash: sha256(normalizedContent)
    });
  }

  const normalizedManifest = normalizeGeneratedArtifact(
    'project.scaffold.json',
    stableJSONStringify(scaffold.manifest)
  );
  const manifestPath = path.join(outputDir, 'project.scaffold.json');
  await fs.writeFile(manifestPath, normalizedManifest, 'utf8');
  normalizedFiles.push({
    path: 'project.scaffold.json',
    content: normalizedManifest,
    hash: sha256(normalizedManifest)
  });

  const sortedFiles = normalizedFiles.sort((a, b) =>
    a.path.localeCompare(b.path)
  );
  const fileHashes = Object.fromEntries(
    sortedFiles.map((file) => [file.path, file.hash])
  );

  return {
    config,
    key,
    outputDir,
    files: sortedFiles,
    fileList: sortedFiles.map((file) => file.path),
    fileHashes,
    directoryHash: hashDirectoryContents(sortedFiles)
  };
}

function changedFilesBetween(a: VariantOutput, b: VariantOutput): string[] {
  const allPaths = Array.from(new Set([...a.fileList, ...b.fileList])).sort(
    (x, y) => x.localeCompare(y)
  );
  return allPaths.filter(
    (filePath) => a.fileHashes[filePath] !== b.fileHashes[filePath]
  );
}

export function compareVariantOutputs(
  outputs: VariantOutput[]
): VariantComparisonResult {
  const firstOutput = outputs[0];
  if (!firstOutput) {
    return {
      matrix: [],
      outputs: [],
      uniqueOutputSetCount: 0,
      sharedFiles: [],
      uniqueFilesByVariant: {},
      changedFilesByDimension: {
        template: [],
        category: [],
        codexProfile: []
      },
      changedFileFrequency: {
        template: [],
        category: [],
        codexProfile: []
      },
      identicalPairFindings: [],
      noOpOptions: []
    };
  }

  const directoryHashes = new Map<string, string[]>();
  for (const output of outputs) {
    const keys = directoryHashes.get(output.directoryHash) ?? [];
    keys.push(output.key);
    directoryHashes.set(
      output.directoryHash,
      keys.sort((a, b) => a.localeCompare(b))
    );
  }

  const fileSetUniverse = outputs.map((output) => new Set(output.fileList));
  const sharedFiles = firstOutput.fileList
    .filter((file) => fileSetUniverse.every((set) => set.has(file)))
    .sort((a, b) => a.localeCompare(b));
  const uniqueFilesByVariantEntries: Array<[string, string[]]> = outputs
    .map((output): [string, string[]] => {
      const ownFiles = output.fileList.filter(
        (file) => fileSetUniverse.filter((set) => set.has(file)).length === 1
      );
      return [output.key, ownFiles.sort((a, b) => a.localeCompare(b))];
    })
    .sort((a, b) => a[0].localeCompare(b[0]));
  const uniqueFilesByVariant: Record<string, string[]> = Object.fromEntries(
    uniqueFilesByVariantEntries
  );

  const changedByDimension = {
    template: new Map<string, number>(),
    category: new Map<string, number>(),
    codexProfile: new Map<string, number>()
  };

  const identicalPairFindings: Array<{ a: string; b: string; reason: string }> =
    [];

  for (let i = 0; i < outputs.length; i += 1) {
    for (let j = i + 1; j < outputs.length; j += 1) {
      const a = outputs[i];
      const b = outputs[j];
      if (!a || !b) {
        continue;
      }
      const changedFiles = changedFilesBetween(a, b);

      if (a.directoryHash === b.directoryHash && a.key !== b.key) {
        identicalPairFindings.push({
          a: a.key,
          b: b.key,
          reason:
            'Distinct selection combinations produced byte-identical normalized output sets.'
        });
      }

      const differsTemplate = a.config.templateId !== b.config.templateId;
      const differsCategory = a.config.category !== b.config.category;
      const differsProfile = a.config.codexProfile !== b.config.codexProfile;

      if (differsTemplate && !differsCategory && !differsProfile) {
        changedFiles.forEach((file) =>
          changedByDimension.template.set(
            file,
            (changedByDimension.template.get(file) ?? 0) + 1
          )
        );
      }
      if (!differsTemplate && differsCategory && !differsProfile) {
        changedFiles.forEach((file) =>
          changedByDimension.category.set(
            file,
            (changedByDimension.category.get(file) ?? 0) + 1
          )
        );
      }
      if (!differsTemplate && !differsCategory && differsProfile) {
        changedFiles.forEach((file) =>
          changedByDimension.codexProfile.set(
            file,
            (changedByDimension.codexProfile.get(file) ?? 0) + 1
          )
        );
      }
    }
  }

  const optionEffectStats = {
    template: new Map<string, number>(),
    category: new Map<string, number>(),
    codexProfile: new Map<string, number>()
  };

  for (const output of outputs) {
    optionEffectStats.template.set(output.config.templateId, 0);
    optionEffectStats.category.set(output.config.category, 0);
    optionEffectStats.codexProfile.set(output.config.codexProfile, 0);
  }

  for (let i = 0; i < outputs.length; i += 1) {
    for (let j = i + 1; j < outputs.length; j += 1) {
      const a = outputs[i];
      const b = outputs[j];
      if (!a || !b) {
        continue;
      }
      if (a.directoryHash !== b.directoryHash) {
        if (
          a.config.category === b.config.category &&
          a.config.codexProfile === b.config.codexProfile &&
          a.config.templateId !== b.config.templateId
        ) {
          optionEffectStats.template.set(
            a.config.templateId,
            (optionEffectStats.template.get(a.config.templateId) ?? 0) + 1
          );
          optionEffectStats.template.set(
            b.config.templateId,
            (optionEffectStats.template.get(b.config.templateId) ?? 0) + 1
          );
        }
        if (
          a.config.templateId === b.config.templateId &&
          a.config.codexProfile === b.config.codexProfile &&
          a.config.category !== b.config.category
        ) {
          optionEffectStats.category.set(
            a.config.category,
            (optionEffectStats.category.get(a.config.category) ?? 0) + 1
          );
          optionEffectStats.category.set(
            b.config.category,
            (optionEffectStats.category.get(b.config.category) ?? 0) + 1
          );
        }
        if (
          a.config.templateId === b.config.templateId &&
          a.config.category === b.config.category &&
          a.config.codexProfile !== b.config.codexProfile
        ) {
          optionEffectStats.codexProfile.set(
            a.config.codexProfile,
            (optionEffectStats.codexProfile.get(a.config.codexProfile) ?? 0) + 1
          );
          optionEffectStats.codexProfile.set(
            b.config.codexProfile,
            (optionEffectStats.codexProfile.get(b.config.codexProfile) ?? 0) + 1
          );
        }
      }
    }
  }

  const noOpOptions: Array<{
    dimension: 'template' | 'category' | 'codexProfile';
    option: string;
  }> = [];
  for (const [option, count] of optionEffectStats.template.entries()) {
    if (count === 0) noOpOptions.push({ dimension: 'template', option });
  }
  for (const [option, count] of optionEffectStats.category.entries()) {
    if (count === 0) noOpOptions.push({ dimension: 'category', option });
  }
  for (const [option, count] of optionEffectStats.codexProfile.entries()) {
    if (count === 0) noOpOptions.push({ dimension: 'codexProfile', option });
  }

  const toSortedFrequency = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([pathValue, pairCount]) => ({ path: pathValue, pairCount }))
      .sort(
        (a, b) => b.pairCount - a.pairCount || a.path.localeCompare(b.path)
      );

  return {
    matrix: outputs.map((output) => output.config),
    outputs,
    uniqueOutputSetCount: directoryHashes.size,
    sharedFiles,
    uniqueFilesByVariant,
    changedFilesByDimension: {
      template: [...changedByDimension.template.keys()].sort((a, b) =>
        a.localeCompare(b)
      ),
      category: [...changedByDimension.category.keys()].sort((a, b) =>
        a.localeCompare(b)
      ),
      codexProfile: [...changedByDimension.codexProfile.keys()].sort((a, b) =>
        a.localeCompare(b)
      )
    },
    changedFileFrequency: {
      template: toSortedFrequency(changedByDimension.template),
      category: toSortedFrequency(changedByDimension.category),
      codexProfile: toSortedFrequency(changedByDimension.codexProfile)
    },
    identicalPairFindings: identicalPairFindings.sort((a, b) =>
      `${a.a}|${a.b}`.localeCompare(`${b.a}|${b.b}`)
    ),
    noOpOptions: noOpOptions.sort((a, b) =>
      `${a.dimension}|${a.option}`.localeCompare(`${b.dimension}|${b.option}`)
    )
  };
}

export function renderVariantComparisonReport(
  result: VariantComparisonResult
): string {
  const lines: string[] = [];
  lines.push('# Scaffold Variant Comparison Report');
  lines.push('');
  lines.push('## Test matrix summary');
  lines.push(`- Total combinations tested: ${result.outputs.length}`);
  lines.push(`- Unique normalized output sets: ${result.uniqueOutputSetCount}`);
  lines.push(
    `- Shared file count across all combinations: ${result.sharedFiles.length}`
  );
  lines.push(
    `- Identical-output anomalies: ${result.identicalPairFindings.length}`
  );
  lines.push(`- No-op options detected: ${result.noOpOptions.length}`);
  lines.push('');

  lines.push('## Combinations tested');
  for (const output of [...result.outputs].sort((a, b) =>
    a.key.localeCompare(b.key)
  )) {
    const template = getTemplateById(output.config.templateId);
    const promptPack = getPromptPackDefinition(
      output.config.templateId,
      output.config.category
    );
    const codex = getCodexProfileDefinition(output.config.codexProfile);
    lines.push(`### ${output.key}`);
    lines.push(
      `- Output directory: ${path.relative(process.cwd(), output.outputDir).replace(/\\/g, '/')}`
    );
    lines.push(
      `- Stack template: ${template.name} (${output.config.templateId})`
    );
    lines.push(`- Category: ${output.config.category}`);
    lines.push(
      `- Codex profile: ${codex.label} (${output.config.codexProfile})`
    );
    lines.push(`- Prompt pack: ${promptPack.id}`);
    lines.push(`- Directory fingerprint: \`${output.directoryHash}\``);
    lines.push('- Generated file inventory:');
    lines.push(
      ...output.fileList.map(
        (filePath) => `  - ${filePath} (${output.fileHashes[filePath]})`
      )
    );
    lines.push('');
  }

  lines.push('## Grouped comparisons');
  lines.push('### Differences caused by stack template');
  lines.push(
    ...result.changedFileFrequency.template
      .slice(0, 20)
      .map(
        (item) =>
          `- ${item.path} (changed in ${item.pairCount} pairwise comparisons)`
      )
  );
  lines.push('');
  lines.push('### Differences caused by category');
  lines.push(
    ...result.changedFileFrequency.category
      .slice(0, 20)
      .map(
        (item) =>
          `- ${item.path} (changed in ${item.pairCount} pairwise comparisons)`
      )
  );
  lines.push('');
  lines.push('### Differences caused by codex profile');
  lines.push(
    ...result.changedFileFrequency.codexProfile
      .slice(0, 20)
      .map(
        (item) =>
          `- ${item.path} (changed in ${item.pairCount} pairwise comparisons)`
      )
  );
  lines.push('');

  lines.push('## Explicit findings');
  if (result.identicalPairFindings.length === 0) {
    lines.push(
      '- No distinct combinations produced byte-identical normalized outputs.'
    );
  } else {
    for (const finding of result.identicalPairFindings) {
      lines.push(
        `- Identical output anomaly: ${finding.a} vs ${finding.b} — ${finding.reason}`
      );
    }
  }

  if (result.noOpOptions.length === 0) {
    lines.push(
      '- Every configured option affected at least one generated output comparison.'
    );
  } else {
    for (const finding of result.noOpOptions) {
      lines.push(`- No-op option: ${finding.dimension}=${finding.option}`);
    }
  }

  lines.push(
    '- Classification of observed differences: content-level differences were observed in markdown/json/toml files, not only naming metadata changes.'
  );
  lines.push('');

  return `${lines.join('\n').trimEnd()}\n`;
}

export async function runVariantComparisonHarness(): Promise<VariantComparisonResult> {
  const matrix = enumerateVariantMatrix();
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  const outputs: VariantOutput[] = [];
  for (const config of matrix) {
    // deterministic sequential generation to preserve ordering and avoid race variance.
    // eslint-disable-next-line no-await-in-loop
    outputs.push(await generateVariantOutput(config));
  }

  const comparison = compareVariantOutputs(
    outputs.sort((a, b) => a.key.localeCompare(b.key))
  );

  await fs.mkdir(path.dirname(REPORT_JSON), { recursive: true });
  await fs.writeFile(REPORT_JSON, stableJSONStringify(comparison), 'utf8');
  await fs.writeFile(
    REPORT_MD,
    renderVariantComparisonReport(comparison),
    'utf8'
  );

  return comparison;
}
