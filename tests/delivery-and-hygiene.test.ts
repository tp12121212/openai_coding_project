import { describe, expect, test, vi } from 'vitest';
import { buildScaffold } from '../src/lib/generator/scaffold';
import { runHygieneChecks } from '../src/lib/generator/service';
import { createBranchAndPullRequest } from '../src/lib/github/api';

describe('delivery and hygiene', () => {
  test('readme and gitignore vary deterministically', () => {
    const scaffold = buildScaffold({
      schemaVersion: '3.0.0',
      projectName: 'Deterministic',
      description: 'Deterministic output',
      templateId: 'python-cli',
      category: 'automation',
      codexProfile: 'strict',
      promptPackId: 'default-engineering',
      deliveryMode: 'github-new-repo',
      initializeGit: false,
      createBranch: false,
      createWorktree: false
    });
    const readme = scaffold.files.find((file) => file.path === 'README.md')?.content ?? '';
    const gitignore = scaffold.files.find((file) => file.path === '.gitignore')?.content ?? '';
    expect(readme).toContain('Project category: automation');
    expect(readme).toContain('Delivery mode: github-new-repo');
    expect(gitignore).toContain('__pycache__/');
  });

  test('hygiene excludes dangerous paths', () => {
    const check = runHygieneChecks([
      { path: '.env', content: 'x=y' },
      { path: 'README.md', content: 'ok' },
      { path: 'keys/id_rsa', content: 'abc' }
    ]);
    expect(check.result.excludedFiles).toEqual(['.env', 'keys/id_rsa']);
    expect(check.safeFiles.map((file) => file.path)).toEqual(['README.md']);
  });

  test('existing repo mode skips collisions', async () => {
    const calls: Array<{ route: string; body?: unknown }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const route = url.replace('https://api.github.com', '');
      calls.push({ route, body: init?.body ? JSON.parse(String(init.body)) : undefined });

      if (route.includes('/git/ref/heads/main')) return new Response(JSON.stringify({ object: { sha: 'headsha' } }), { status: 200 });
      if (route.includes('/git/trees/headsha')) return new Response(JSON.stringify({ sha: 'tree', tree: [{ path: 'README.md', type: 'blob', sha: '1' }] }), { status: 200 });
      if (route.endsWith('/git/refs') && init?.method === 'POST') return new Response(JSON.stringify({ ok: true }), { status: 201 });
      if (route.endsWith('/git/blobs')) return new Response(JSON.stringify({ sha: 'blobsha' }), { status: 201 });
      if (route.endsWith('/git/commits/headsha')) return new Response(JSON.stringify({ tree: { sha: 'basetree' } }), { status: 200 });
      if (route.endsWith('/git/trees') && init?.method === 'POST') return new Response(JSON.stringify({ sha: 'newtree' }), { status: 201 });
      if (route.endsWith('/git/commits') && init?.method === 'POST') return new Response(JSON.stringify({ sha: 'newcommit' }), { status: 201 });
      if (route.includes('/git/refs/heads/scaffold%2Fupdate-') && init?.method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200 });
      if (route.endsWith('/pulls')) return new Response(JSON.stringify({ html_url: 'https://github.com/o/r/pull/1' }), { status: 201 });

      return new Response(JSON.stringify({ message: 'Unhandled' }), { status: 500 });
    }) as never);

    const result = await createBranchAndPullRequest({
      token: 't',
      owner: 'o',
      repo: 'r',
      defaultBranch: 'main',
      files: [{ path: 'README.md', content: 'existing' }, { path: 'NEW.md', content: 'new' }]
    });

    expect(result.collisions).toEqual(['README.md']);
    expect(result.filesAdded).toEqual(['NEW.md']);
    expect(result.prUrl).toContain('/pull/1');
    expect(calls.some((call) => call.route.endsWith('/pulls'))).toBe(true);
  });
});
