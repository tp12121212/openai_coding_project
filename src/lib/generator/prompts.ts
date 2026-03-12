import { PromptPackId } from '../types';

interface PromptFile {
  fileName: string;
  content: string;
}

const basePromptGuidance = [
  'Inspect existing modules before implementing new code.',
  'Follow current naming patterns and error-handling style.',
  'Produce runnable code and include tests for new logic.',
  'Validate output with lint, typecheck, and tests.',
  'Explain assumptions and any non-obvious tradeoffs.'
].join('\n- ');

const promptTuples: Array<{ fileName: string; objective: string }> = [
  { fileName: '01-bootstrap-and-inventory.md', objective: 'Bootstrap project and inventory architecture constraints.' },
  { fileName: '02-design-plan.md', objective: 'Design a deterministic implementation plan before coding.' },
  { fileName: '03-implement-feature.md', objective: 'Implement a feature incrementally and validate with tests.' },
  { fileName: '04-fix-bug.md', objective: 'Diagnose bug root cause and provide deterministic fix.' },
  { fileName: '05-validate-and-test.md', objective: 'Run comprehensive validation and explain failures.' },
  { fileName: '06-deep-codebase-review.md', objective: 'Review architecture consistency and technical debt.' },
  { fileName: '07-release-readiness.md', objective: 'Prepare release checklist and deployment readiness notes.' }
];

const defaultPrompts: PromptFile[] = promptTuples.map((entry) => ({
  fileName: entry.fileName,
  content: `# ${entry.objective}\n\nUse this prompt to guide a coding agent.\n\n- ${basePromptGuidance}\n`
}));

const securityPrompts: PromptFile[] = defaultPrompts.map((prompt) => ({
  ...prompt,
  content: `${prompt.content}\n## Security/Compliance focus\n- Prioritize architecture review and data handling risks.\n- Require deterministic output for rule packs and manifests.\n- Use safe non-destructive scripting defaults.\n`
}));

export function getPromptPack(packId: PromptPackId): PromptFile[] {
  return packId === 'security-compliance-focused' ? securityPrompts : defaultPrompts;
}
