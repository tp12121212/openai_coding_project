import { BuiltInTemplateId, ProjectCategory, PromptPackId } from '../types';

export interface PromptFile {
  fileName: string;
  content: string;
}

export interface PromptPackDefinition {
  id: PromptPackId;
  templateId: BuiltInTemplateId;
  category: ProjectCategory;
  label: string;
  description: string;
  templateGuidance: string[];
  categoryGuidance: string[];
}

const promptTuples: Array<{ fileName: string; objective: string }> = [
  { fileName: '01-bootstrap-and-inventory.md', objective: 'Bootstrap project and inventory architecture constraints.' },
  { fileName: '02-design-plan.md', objective: 'Design a deterministic implementation plan before coding.' },
  { fileName: '03-implement-feature.md', objective: 'Implement a feature incrementally and validate with tests.' },
  { fileName: '04-fix-bug.md', objective: 'Diagnose bug root cause and provide deterministic fix.' },
  { fileName: '05-validate-and-test.md', objective: 'Run comprehensive validation and explain failures.' },
  { fileName: '06-deep-codebase-review.md', objective: 'Review architecture consistency and technical debt.' },
  { fileName: '07-release-readiness.md', objective: 'Prepare release checklist and deployment readiness notes.' }
];

const basePromptGuidance = [
  'Inspect existing modules before implementing new code.',
  'Follow current naming patterns and error-handling style.',
  'Produce runnable code and include tests for new logic.',
  'Validate output with lint, typecheck, and tests.',
  'Explain assumptions and any non-obvious tradeoffs.'
];

const TEMPLATE_GUIDANCE: Record<BuiltInTemplateId, { label: string; description: string; guidance: string[] }> = {
  'full-stack-saas': {
    label: 'Full Stack SaaS',
    description: 'Coordinates web, API, and background-job concerns for tenancy and billing-aware systems.',
    guidance: [
      'Keep boundaries explicit between frontend, API, and background workers.',
      'Prioritize authn/authz and tenancy-safe data access patterns.',
      'Prefer API contracts and async job payload schemas before implementation.'
    ]
  },
  'nextjs-web-app': {
    label: 'Next.js Web App',
    description: 'Optimized for app-router UX, server/client component boundaries, and CI-ready delivery.',
    guidance: [
      'Use App Router conventions and keep server/client boundaries explicit.',
      'Prefer typed data-fetching patterns with clear loading/error states.',
      'Keep build-time and runtime constraints visible for deployment stability.'
    ]
  },
  'node-api': {
    label: 'Node API Service',
    description: 'Focused on deterministic API contracts and service-level reliability controls.',
    guidance: [
      'Define contract-first request/response schemas and validation paths.',
      'Model services as stateless components with explicit dependency boundaries.',
      'Require robust health checks and predictable error surfaces.'
    ]
  },
  'python-cli': {
    label: 'Python CLI',
    description: 'Emphasizes reproducible command behavior and packaging-ready command structure.',
    guidance: [
      'Design command tree and CLI UX before adding command handlers.',
      'Normalize stdout/stderr formatting and non-zero exit behavior.',
      'Use fixtures for argument parsing and command-level integration tests.'
    ]
  },
  'research-docs': {
    label: 'Research/Docs Workspace',
    description: 'Prioritizes evidence-backed documentation workflows and structured decision records.',
    guidance: [
      'Capture evidence sources and assumptions for every recommendation.',
      'Separate facts, open questions, and decisions in document structure.',
      'Keep references and follow-up actions deterministic and reviewable.'
    ]
  },
  'security-compliance': {
    label: 'Security/Compliance Coding Project',
    description: 'Built for Purview-style classification, DLP automation, and deterministic validation.',
    guidance: [
      'Design detection pipeline as pattern -> candidate -> validation -> scoring -> decision.',
      'Keep generated rule packs and manifests deterministic and schema-oriented.',
      'Use non-destructive automation defaults and least-privilege operations.'
    ]
  }
};

const CATEGORY_GUIDANCE: Record<ProjectCategory, { label: string; description: string; guidance: string[] }> = {
  'web-platform': {
    label: 'Web Platform',
    description: 'Targets user-facing product surfaces, usability, and production web operations.',
    guidance: [
      'Enforce accessible UX patterns and observable UI state transitions.',
      'Prioritize latency budgets, caching strategy, and rollout safety.',
      'Document browser/runtime compatibility constraints and recovery paths.'
    ]
  },
  'api-service': {
    label: 'API Service',
    description: 'Centers on service contracts, integration safety, and backward-compatible evolution.',
    guidance: [
      'Define versioning and deprecation policy for API evolution.',
      'Make idempotency, retries, and rate limits explicit in design.',
      'Include integration contract tests for critical endpoints.'
    ]
  },
  automation: {
    label: 'Automation',
    description: 'Optimizes scripted workflows for reproducibility and operator reliability.',
    guidance: [
      'Make scripts idempotent and safe to re-run across environments.',
      'Prefer explicit configuration schemas over implicit environment assumptions.',
      'Emit actionable logs with deterministic ordering and clear failure modes.'
    ]
  },
  'security-compliance': {
    label: 'Security/Compliance',
    description: 'Emphasizes policy controls, validation rigor, and data-protection requirements.',
    guidance: [
      'Map requirements to enforceable controls with validation evidence.',
      'Treat sensitive paths and policy outputs as high-assurance deterministic artifacts.',
      'Require abuse-case tests and explicit risk acceptance notes when needed.'
    ]
  },
  research: {
    label: 'Research',
    description: 'Optimizes exploratory analysis while preserving reproducible documentation outputs.',
    guidance: [
      'Define hypothesis, evaluation criteria, and evidence collection upfront.',
      'Record alternatives considered with clear rationale and tradeoffs.',
      'Maintain deterministic templates for findings and recommendation summaries.'
    ]
  }
};

export function derivePromptPackId(templateId: BuiltInTemplateId, category: ProjectCategory): PromptPackId {
  return `${templateId}--${category}`;
}

function buildPromptFiles(definition: PromptPackDefinition): PromptFile[] {
  return promptTuples.map((entry) => ({
    fileName: entry.fileName,
    content: [
      `# ${entry.objective}`,
      '',
      'Use this prompt to guide a coding agent.',
      '',
      '## Core guidance',
      ...basePromptGuidance.map((line) => `- ${line}`),
      '',
      `## Prompt pack context (${definition.id})`,
      `- Template: ${TEMPLATE_GUIDANCE[definition.templateId].label}`,
      `- Category: ${CATEGORY_GUIDANCE[definition.category].label}`,
      `- Pack summary: ${definition.description}`,
      '',
      '## Template-specific guidance',
      ...definition.templateGuidance.map((line) => `- ${line}`),
      '',
      '## Category-specific guidance',
      ...definition.categoryGuidance.map((line) => `- ${line}`)
    ].join('\n')
  }));
}

export function getPromptPackDefinition(templateId: BuiltInTemplateId, category: ProjectCategory): PromptPackDefinition {
  const template = TEMPLATE_GUIDANCE[templateId];
  const categoryMeta = CATEGORY_GUIDANCE[category];
  return {
    id: derivePromptPackId(templateId, category),
    templateId,
    category,
    label: `${template.label} + ${categoryMeta.label}`,
    description: `${template.description} ${categoryMeta.description}`,
    templateGuidance: [...template.guidance],
    categoryGuidance: [...categoryMeta.guidance]
  };
}

export function listPromptPackDefinitions(): PromptPackDefinition[] {
  return (Object.keys(TEMPLATE_GUIDANCE) as BuiltInTemplateId[])
    .sort((a, b) => a.localeCompare(b))
    .flatMap((templateId) =>
      (Object.keys(CATEGORY_GUIDANCE) as ProjectCategory[])
        .sort((a, b) => a.localeCompare(b))
        .map((category) => getPromptPackDefinition(templateId, category))
    );
}

export function getPromptPack(templateId: BuiltInTemplateId, category: ProjectCategory): PromptFile[] {
  return buildPromptFiles(getPromptPackDefinition(templateId, category));
}
