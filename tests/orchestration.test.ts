import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { runOrchestration } from '../src/lib/orchestration/service';

describe('orchestration flow', () => {
  test('zip delivery mode works without github auth', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestration-'));
    const { job, jobPath } = await runOrchestration(
      {
        schemaVersion: '3.0.0',
        projectName: 'Orchestration Test Project',
        description: 'Validate orchestration status behavior',
        templateId: 'node-api',
        category: 'api-service',
        codexProfile: 'strict',
        promptPackId: 'default-engineering',
        deliveryMode: 'zip',
        initializeGit: false,
        createBranch: false,
        createWorktree: false
      },
      temp
    );

    expect(job.state).toBe('completed');
    const persisted = await fs.readFile(jobPath, 'utf8');
    expect(persisted).toContain('"mode": "zip"');
  });

  test('github-new-repo delivery initializes empty repositories deterministically', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestration-gh-new-'));
    let blobCreateCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';

        if (route === '/user/repos' && method === 'POST') {
          return new Response(
            JSON.stringify({
              name: 'new-repo',
              full_name: 'owner/new-repo',
              private: true,
              html_url: 'https://github.com/owner/new-repo',
              default_branch: 'main',
              owner: { login: 'owner' }
            }),
            { status: 201 }
          );
        }

        if (route === '/repos/owner/new-repo/git/ref/heads/main' && method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }

        if (route === '/repos/owner/new-repo/git/blobs' && method === 'POST') {
          blobCreateCount += 1;
          if (blobCreateCount === 1) {
            return new Response(JSON.stringify({ message: 'Git Repository is empty.' }), { status: 409 });
          }
          return new Response(JSON.stringify({ sha: 'blobsha' }), { status: 201 });
        }

        if (route === '/repos/owner/new-repo/git/trees' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'tree-sha' }), { status: 201 });
        }

        if (route === '/repos/owner/new-repo/git/commits' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'commit-sha' }), { status: 201 });
        }

        if (route === '/repos/owner/new-repo/git/refs' && method === 'POST') {
          return new Response(JSON.stringify({ ref: 'refs/heads/main' }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    const { job } = await runOrchestration(
      {
        schemaVersion: '3.0.0',
        projectName: 'Orchestration GH New Repo',
        description: 'Validate orchestration github-new-repo behavior',
        templateId: 'node-api',
        category: 'api-service',
        codexProfile: 'strict',
        promptPackId: 'default-engineering',
        deliveryMode: 'github-new-repo',
        initializeGit: false,
        createBranch: false,
        createWorktree: false,
        github: {
          repoName: 'new-repo',
          visibility: 'private',
          description: 'repo description'
        }
      },
      temp,
      'token'
    );

    expect(job.state).toBe('completed');
    expect(job.result?.steps).toEqual([
      { id: 'phase-1-scaffold', status: 'completed', detail: 'Generate deterministic scaffold artifacts.' },
      { id: 'phase-2-delivery', status: 'completed', detail: 'Deliver scaffold via zip or GitHub flow.' },
      { id: 'phase-3-bootstrap-pack', status: 'completed', detail: 'Generate bootstrap and hygiene metadata.' }
    ]);

    expect(job.result?.delivery).toMatchObject({
      mode: 'github-new-repo',
      repoUrl: 'https://github.com/owner/new-repo',
      branchName: null,
      prUrl: null,
      filesAdded: [],
      filesSkipped: [],
      collisions: []
    });
  });
});
