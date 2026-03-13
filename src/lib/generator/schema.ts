import { z } from 'zod';

export const ProjectCategorySchema = z.enum([
  'web-platform',
  'api-service',
  'automation',
  'security-compliance',
  'research'
]);

export const DeliveryModeSchema = z.enum(['zip', 'github-new-repo', 'github-existing-repo']);

export const GitHubVisibilitySchema = z.enum(['public', 'private']);

export const GitHubOperationSchema = z
  .object({
    repoName: z.string().trim().min(1).max(100),
    visibility: GitHubVisibilitySchema.default('private'),
    description: z.string().trim().max(300).optional(),
    existingRepoFullName: z.string().trim().min(3).max(200).optional()
  })
  .optional();

export const CreateProjectRequestSchema = z.object({
  schemaVersion: z.literal('3.0.0').default('3.0.0'),
  projectName: z.string().trim().min(3).max(100),
  description: z.string().trim().min(5).max(500),
  templateId: z.enum([
    'full-stack-saas',
    'nextjs-web-app',
    'node-api',
    'python-cli',
    'research-docs',
    'security-compliance'
  ]),
  category: ProjectCategorySchema.default('automation'),
  codexProfile: z.enum(['strict', 'balanced', 'rapid']),
  promptPackId: z.enum(['default-engineering', 'security-compliance-focused']),
  deliveryMode: DeliveryModeSchema.default('zip'),
  github: GitHubOperationSchema,
  initializeGit: z.boolean().default(false),
  createBranch: z.boolean().default(false),
  branchName: z.string().trim().min(2).max(120).optional(),
  createWorktree: z.boolean().default(false),
  worktreePath: z.string().trim().min(1).max(300).optional()
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
