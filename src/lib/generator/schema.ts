import { z } from 'zod';

export const CreateProjectRequestSchema = z.object({
  projectName: z.string().min(3).max(100),
  description: z.string().min(5).max(500),
  localPath: z.string().min(1),
  templateId: z.enum([
    'full-stack-saas',
    'nextjs-web-app',
    'node-api',
    'python-cli',
    'research-docs',
    'security-compliance'
  ]),
  codexProfile: z.enum(['strict', 'balanced', 'rapid']),
  promptPackId: z.enum(['default-engineering', 'security-compliance-focused']),
  initializeGit: z.boolean().default(false),
  createBranch: z.boolean().default(false),
  branchName: z.string().trim().min(2).max(120).optional(),
  createWorktree: z.boolean().default(false),
  worktreePath: z.string().trim().min(1).max(300).optional()
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
