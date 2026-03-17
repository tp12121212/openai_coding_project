import { z } from 'zod';
import { BUILT_IN_TEMPLATE_IDS, CODEX_PROFILES, PROJECT_CATEGORIES } from '../types';
import { derivePromptPackId } from './prompts';

export const ProjectCategorySchema = z.enum(PROJECT_CATEGORIES);

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

const BaseCreateProjectRequestSchema = z.object({
  schemaVersion: z.literal('3.0.0').default('3.0.0'),
  projectName: z.string().trim().min(3).max(100),
  description: z.string().trim().min(5).max(500),
  templateId: z.enum(BUILT_IN_TEMPLATE_IDS),
  category: ProjectCategorySchema.default('automation'),
  codexProfile: z.enum(CODEX_PROFILES),
  promptPackId: z.string().trim().min(3).optional(),
  deliveryMode: DeliveryModeSchema.default('zip'),
  github: GitHubOperationSchema,
  initializeGit: z.boolean().default(false),
  createBranch: z.boolean().default(false),
  branchName: z.string().trim().min(2).max(120).optional(),
  createWorktree: z.boolean().default(false),
  worktreePath: z.string().trim().min(1).max(300).optional()
});

export const CreateProjectRequestSchema = BaseCreateProjectRequestSchema.transform((data) => {
  const derivedPromptPackId = derivePromptPackId(data.templateId, data.category);
  return {
    ...data,
    promptPackId: derivedPromptPackId
  };
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
