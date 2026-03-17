import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  BUILT_IN_TEMPLATE_IDS,
  CODEX_PROFILES,
  PROJECT_CATEGORIES
} from '../src/lib/types';
import { runVariantComparisonHarness } from '../src/lib/generator/variant-comparison';

const REPORT_JSON_PATH = path.resolve(
  process.cwd(),
  'reports/scaffold-variant-comparison.json'
);
const REPORT_MD_PATH = path.resolve(
  process.cwd(),
  'reports/scaffold-variant-comparison.md'
);

describe('scaffold variant comparison harness', () => {
  test('generates deterministic variant report and validates selection impact', async () => {
    const comparison = await runVariantComparisonHarness();

    const expectedCount =
      BUILT_IN_TEMPLATE_IDS.length *
      PROJECT_CATEGORIES.length *
      CODEX_PROFILES.length;
    expect(comparison.outputs).toHaveLength(expectedCount);
    expect(comparison.matrix).toHaveLength(expectedCount);

    expect(comparison.identicalPairFindings).toEqual([]);
    expect(comparison.noOpOptions).toEqual([]);

    expect(comparison.changedFilesByDimension.template.length).toBeGreaterThan(
      0
    );
    expect(comparison.changedFilesByDimension.category.length).toBeGreaterThan(
      0
    );
    expect(
      comparison.changedFilesByDimension.codexProfile.length
    ).toBeGreaterThan(0);

    for (const output of comparison.outputs) {
      const manifestPath = path.join(output.outputDir, 'project.scaffold.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');

      expect(manifestContent).toContain(
        `"templateId": "${output.config.templateId}"`
      );
      expect(manifestContent).toContain(
        `"category": "${output.config.category}"`
      );
      expect(manifestContent).toContain(
        `"codexProfile": "${output.config.codexProfile}"`
      );
      expect(manifestContent).toContain(
        `"packId": "${output.config.templateId}--${output.config.category}"`
      );

      const codexConfigPath = path.join(output.outputDir, '.codex/config.toml');
      const codexConfig = await fs.readFile(codexConfigPath, 'utf8');
      expect(codexConfig).toContain(
        `profile = "${output.config.codexProfile}"`
      );
    }

    const reportJson = await fs.readFile(REPORT_JSON_PATH, 'utf8');
    const reportMd = await fs.readFile(REPORT_MD_PATH, 'utf8');

    expect(reportJson.length).toBeGreaterThan(100);
    expect(reportMd).toContain('# Scaffold Variant Comparison Report');
    expect(reportMd).toContain('## Grouped comparisons');
  }, 120_000);
});
