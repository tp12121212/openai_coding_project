import { z } from 'zod';

const GitHubVariableSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.string().max(2048)
});

const GitHubSecretReferenceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  source: z.enum(['manual-only'])
});

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
  worktreePath: z.string().trim().min(1).max(300).optional(),
  github: z
    .object({
      enabled: z.boolean().default(false),
      owner: z.string().trim().min(1).max(100),
      repo: z.string().trim().min(1).max(100),
      private: z.boolean().default(true),
      description: z.string().max(300).optional(),
      pushInitialContent: z.boolean().default(false),
      token: z.string().trim().min(1).optional(),
      variables: z.array(GitHubVariableSchema).default([]),
      secretReferences: z.array(GitHubSecretReferenceSchema).default([])
    })
    .optional()
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
