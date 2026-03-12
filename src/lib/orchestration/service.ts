import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createProjectScaffold } from '../generator/service';
import { CreateProjectRequest } from '../generator/schema';
import { stableJSONStringify } from '../utils/deterministic';
import { createRepository, initializeAndPushRepository, setRepositoryVariables } from '../github/api';
import { OrchestrationJob, persistJob, upsertJob } from './store';

interface OrchestrationStep {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'manual_required' | 'disabled';
  detail: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function writeBundle(outputPath: string, filesWritten: string[]): Promise<string> {
  const bundlePath = path.join(outputPath, 'scaffold.bundle.json');
  const bundle = {
    schemaVersion: '1.0.0',
    files: filesWritten
  };
  await fs.writeFile(bundlePath, stableJSONStringify(bundle), 'utf8');
  return bundlePath;
}

export async function runOrchestration(
  request: CreateProjectRequest,
  outputRoot: string
): Promise<{ job: OrchestrationJob; jobPath: string }> {
  const jobId = randomUUID();
  const steps: OrchestrationStep[] = [
    { id: 'phase-1-scaffold', status: 'pending', detail: 'Generate deterministic scaffold artifacts.' },
    { id: 'phase-2-github', status: 'pending', detail: 'Create GitHub repository and optional initial push.' },
    { id: 'phase-3-bootstrap-pack', status: 'pending', detail: 'Generate bootstrap pack and manual finalization.' },
    {
      id: 'phase-4-chatgpt-internal',
      status: process.env.ENABLE_UNSUPPORTED_AUTOMATION === 'true' ? 'pending' : 'disabled',
      detail: 'Internal ChatGPT project creation is unsupported via public API and disabled by default.'
    }
  ];

  const baseJob: OrchestrationJob = {
    id: jobId,
    state: 'running',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    result: { steps }
  };
  upsertJob(baseJob);

  try {
    steps[0]!.status = 'running';
    const scaffold = await createProjectScaffold(request, outputRoot);
    steps[0]!.status = 'completed';

    const bundlePath = await writeBundle(scaffold.outputPath, scaffold.filesWritten);

    const githubResult: Record<string, unknown> = {
      enabled: Boolean(request.github?.enabled),
      repoUrl: null,
      variablesConfigured: [],
      secrets: 'manual-only'
    };

    if (request.github?.enabled) {
      steps[1]!.status = 'running';
      if (!request.github.token) {
        throw new Error('GitHub token is required when github.enabled=true.');
      }
      const repoResult = await createRepository({
        owner: request.github.owner,
        repo: request.github.repo,
        private: request.github.private,
        description: request.github.description,
        token: request.github.token
      });

      githubResult.repoUrl = repoResult.html_url;
      const variablesConfigured = await setRepositoryVariables(
        request.github.token,
        request.github.owner,
        request.github.repo,
        request.github.variables
      );
      githubResult.variablesConfigured = variablesConfigured;

      if (request.github.pushInitialContent) {
        const branchName = request.branchName ?? 'main';
        await initializeAndPushRepository(scaffold.outputPath, branchName, repoResult.clone_url, request.github.token);
      }
      steps[1]!.status = 'completed';
    } else {
      steps[1]!.status = 'manual_required';
      steps[1]!.detail = 'GitHub automation skipped. Exported scaffold can be pushed manually.';
    }

    steps[2]!.status = 'completed';

    if (steps[3]!.status !== 'disabled') {
      steps[3]!.status = 'manual_required';
    }

    const completed: OrchestrationJob = {
      ...baseJob,
      state: 'completed',
      updatedAt: nowIso(),
      result: {
        steps,
        outputPath: scaffold.outputPath,
        manifestPath: scaffold.manifestPath,
        bundlePath,
        filesWritten: scaffold.filesWritten,
        github: githubResult,
        manualFinalization: {
          required: true,
          checklistPath: path.join(scaffold.outputPath, 'BOOTSTRAP', 'MANUAL_FINALIZATION.md')
        }
      }
    };

    upsertJob(completed);
    const jobPath = await persistJob(outputRoot, completed);
    return { job: completed, jobPath };
  } catch (error) {
    const failed: OrchestrationJob = {
      ...baseJob,
      state: 'failed',
      updatedAt: nowIso(),
      error: error instanceof Error ? error.message : 'Unknown orchestration error',
      result: { steps }
    };
    upsertJob(failed);
    const jobPath = await persistJob(outputRoot, failed);
    return { job: failed, jobPath };
  }
}
