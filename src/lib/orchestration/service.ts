import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createProjectScaffold, createZipBuffer } from '../generator/service';
import { CreateProjectRequest } from '../generator/schema';
import { stableJSONStringify } from '../utils/deterministic';
import { createBranchAndPullRequest, createRepository, commitToDefaultBranch, getRepo } from '../github/api';
import { OrchestrationJob, persistJob, upsertJob } from './store';

interface OrchestrationStep {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'manual_required' | 'disabled';
  detail: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function requireGitHubToken(request: CreateProjectRequest, token?: string): string {
  if (request.deliveryMode === 'zip') {
    return '';
  }
  if (!token) {
    throw new Error('GitHub authentication is required for this delivery mode.');
  }
  return token;
}

export async function runOrchestration(
  request: CreateProjectRequest,
  outputRoot: string,
  githubToken?: string
): Promise<{ job: OrchestrationJob; jobPath: string }> {
  const jobId = randomUUID();
  const steps: OrchestrationStep[] = [
    { id: 'phase-1-scaffold', status: 'pending', detail: 'Generate deterministic scaffold artifacts.' },
    { id: 'phase-2-delivery', status: 'pending', detail: 'Deliver scaffold via zip or GitHub flow.' },
    { id: 'phase-3-bootstrap-pack', status: 'pending', detail: 'Generate bootstrap and hygiene metadata.' }
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

    steps[1]!.status = 'running';
    const zipBuffer = await createZipBuffer(scaffold.files);
    const zipFileName = `${request.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'scaffold'}.zip`;
    const zipPath = path.join(scaffold.outputPath, zipFileName);
    await fs.writeFile(zipPath, zipBuffer);

    const deliveryResult: Record<string, unknown> = {
      mode: request.deliveryMode,
      zipPath,
      repoUrl: null,
      branchName: null,
      prUrl: null,
      filesAdded: [],
      filesSkipped: [],
      collisions: []
    };

    if (request.deliveryMode === 'github-new-repo') {
      const token = requireGitHubToken(request, githubToken);
      if (!request.github?.repoName) throw new Error('Repo name is required.');
      const repo = await createRepository(token, {
        repoName: request.github.repoName,
        visibility: request.github.visibility,
        description: request.github.description
      });
      await commitToDefaultBranch(token, repo.owner.login, repo.name, repo.default_branch, scaffold.files);
      deliveryResult.repoUrl = repo.html_url;
    } else if (request.deliveryMode === 'github-existing-repo') {
      const token = requireGitHubToken(request, githubToken);
      if (!request.github?.existingRepoFullName) throw new Error('Existing repository selection is required.');
      const repo = await getRepo(token, request.github.existingRepoFullName);
      const prResult = await createBranchAndPullRequest({
        token,
        owner: repo.owner.login,
        repo: repo.name,
        defaultBranch: repo.default_branch,
        files: scaffold.files
      });
      deliveryResult.repoUrl = repo.html_url;
      deliveryResult.branchName = prResult.branchName;
      deliveryResult.prUrl = prResult.prUrl;
      deliveryResult.filesAdded = prResult.filesAdded;
      deliveryResult.filesSkipped = prResult.filesSkipped;
      deliveryResult.collisions = prResult.collisions;
    }
    steps[1]!.status = 'completed';

    steps[2]!.status = 'completed';

    const completed: OrchestrationJob = {
      ...baseJob,
      state: 'completed',
      updatedAt: nowIso(),
      result: {
        steps,
        outputPath: scaffold.outputPath,
        manifestPath: scaffold.manifestPath,
        bundlePath: zipPath,
        filesWritten: scaffold.filesWritten,
        delivery: deliveryResult,
        hygiene: scaffold.hygiene
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
      result: { steps: steps.map((step) => ({ ...step, status: step.status === 'running' ? 'failed' : step.status })) }
    };

    upsertJob(failed);
    const jobPath = await persistJob(outputRoot, failed);
    return { job: failed, jobPath };
  }
}

export async function exportBundleMetadata(outputPath: string, filesWritten: string[]): Promise<string> {
  const bundlePath = path.join(outputPath, 'scaffold.bundle.json');
  await fs.writeFile(bundlePath, stableJSONStringify({ schemaVersion: '1.0.0', files: filesWritten }), 'utf8');
  return bundlePath;
}
