import fs from 'node:fs/promises';
import path from 'node:path';
import { stableJSONStringify } from '../utils/deterministic';

export type JobState = 'queued' | 'running' | 'completed' | 'failed';

export interface OrchestrationJob {
  id: string;
  state: JobState;
  createdAt: string;
  updatedAt: string;
  result?: Record<string, unknown>;
  error?: string;
}

const jobs = new Map<string, OrchestrationJob>();

export function upsertJob(job: OrchestrationJob): OrchestrationJob {
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): OrchestrationJob | undefined {
  return jobs.get(id);
}

export async function persistJob(outputRoot: string, job: OrchestrationJob): Promise<string> {
  const dir = path.join(outputRoot, '.orchestration', 'jobs');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${job.id}.json`);
  await fs.writeFile(filePath, stableJSONStringify(job), 'utf8');
  return filePath;
}
