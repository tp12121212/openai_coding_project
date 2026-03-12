import { BuiltInTemplateId } from '../types';

export interface TemplateDefinition {
  id: BuiltInTemplateId;
  name: string;
  description: string;
  language: string;
  runtime: string;
  tasks: string[];
}

const builtInTemplates: TemplateDefinition[] = [
  {
    id: 'full-stack-saas',
    name: 'Full Stack SaaS',
    description: 'Web + API + background jobs with billing/auth starter conventions.',
    language: 'TypeScript',
    runtime: 'Node.js',
    tasks: ['Define tenancy model', 'Set API boundaries', 'Plan billing lifecycle']
  },
  {
    id: 'nextjs-web-app',
    name: 'Next.js Web App',
    description: 'Modern Next.js app router starter with APIs and CI baseline.',
    language: 'TypeScript',
    runtime: 'Node.js',
    tasks: ['Map pages/routes', 'Set component standards', 'Enable CI gates']
  },
  {
    id: 'node-api',
    name: 'Node API Service',
    description: 'Headless service optimized for deterministic API contracts.',
    language: 'TypeScript',
    runtime: 'Node.js',
    tasks: ['Define OpenAPI contract', 'Create validator pipeline', 'Add health checks']
  },
  {
    id: 'python-cli',
    name: 'Python CLI',
    description: 'Structured CLI project with deterministic command output.',
    language: 'Python',
    runtime: 'Python 3.12',
    tasks: ['Define command tree', 'Plan packaging', 'Add fixture-based tests']
  },
  {
    id: 'research-docs',
    name: 'Research/Docs Workspace',
    description: 'Documentation-heavy project scaffold for design and analysis.',
    language: 'Markdown',
    runtime: 'N/A',
    tasks: ['Capture research questions', 'Define evidence sources', 'Plan review cadence']
  },
  {
    id: 'security-compliance',
    name: 'Security/Compliance Coding Project',
    description: 'Purview-style classification, DLP automation and validation-oriented scaffold.',
    language: 'TypeScript + Python',
    runtime: 'Node.js + Python',
    tasks: [
      'Run architecture review prompts',
      'Define deterministic validation strategy',
      'Implement safe scripting guardrails'
    ]
  }
];

export function getBuiltInTemplates(): TemplateDefinition[] {
  return builtInTemplates.map((template) => ({ ...template, tasks: [...template.tasks] }));
}

export function getTemplateById(id: BuiltInTemplateId): TemplateDefinition {
  const template = builtInTemplates.find((item) => item.id === id);
  if (!template) {
    throw new Error(`Unknown template: ${id}`);
  }
  return { ...template, tasks: [...template.tasks] };
}
