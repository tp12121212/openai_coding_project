import { describe, expect, test, vi } from 'vitest';
import { commitToDefaultBranch, createRepository, isGitHubApiError, listRepositories, mapGitHubErrorForClient } from '../src/lib/github/api';

describe('github api integration', () => {
  test('sends required headers for list and create requests', async () => {
    const calls: Array<{ route: string; headers: HeadersInit | undefined; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ route: url.replace('https://api.github.com', ''), headers: init?.headers, body: init?.body ? JSON.parse(String(init.body)) : undefined });

        if (url.includes('/user/repos?')) {
          return new Response(JSON.stringify([{ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'main', owner: { login: 'o' } }]), { status: 200 });
        }

        return new Response(JSON.stringify({ name: 'r2', full_name: 'o/r2', private: true, html_url: 'https://github.com/o/r2', default_branch: 'main', owner: { login: 'o' } }), { status: 201 });
      }) as never
    );

    await listRepositories('token', 1, '');
    await createRepository('token', { repoName: 'r2', visibility: 'private', description: 'desc' });

    expect(calls[0]?.route).toContain('/user/repos?per_page=50&page=1&sort=updated');
    expect(calls[1]?.route).toBe('/user/repos');

    const listHeaders = new Headers(calls[0]?.headers);
    expect(listHeaders.get('accept')).toBe('application/vnd.github+json');
    expect(listHeaders.get('authorization')).toBe('Bearer token');
    expect(listHeaders.get('x-github-api-version')).toBe('2022-11-28');

    expect(calls[1]?.body).toEqual({ name: 'r2', private: true, description: 'desc', auto_init: false });
  });

  test('returns actionable insufficient-scope diagnostics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ message: 'Not Found', documentation_url: 'https://docs.github.com/rest/repos/repos#create-a-repository-for-the-authenticated-user' }),
          {
            status: 404,
            headers: {
              'x-oauth-scopes': 'read:user, user:email',
              'x-accepted-oauth-scopes': 'repo',
              'x-github-request-id': 'abc123'
            }
          }
        )) as never
    );

    await expect(createRepository('token', { repoName: 'x', visibility: 'private' })).rejects.toThrow();

    try {
      await createRepository('token', { repoName: 'x', visibility: 'private' });
    } catch (error) {
      expect(isGitHubApiError(error)).toBe(true);
      const mapped = mapGitHubErrorForClient(error);
      expect(mapped.error).toContain('GitHub API /user/repos failed (404)');
      expect(mapped.error).toContain('possibleCause=token or scope permission issue');
      expect(mapped.diagnostics?.tokenScopes).toEqual(['read:user', 'user:email']);
      expect(mapped.diagnostics?.acceptedScopes).toEqual(['repo']);
      expect(mapped.diagnostics?.documentationUrl).toContain('create-a-repository-for-the-authenticated-user');
    }
  });



  test('initializes empty repositories without requiring an existing default-branch head', async () => {
    const calls: Array<{ route: string; method: string; body?: unknown }> = [];
    let blobCreateCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ route, method, body });

        if (route.includes('/git/ref/heads/main') && method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }

        if (route.endsWith('/git/blobs') && method === 'POST') {
          blobCreateCount += 1;
          if (blobCreateCount === 1) {
            return new Response(
              JSON.stringify({
                message: 'Git Repository is empty.',
                documentation_url: 'https://docs.github.com/rest/git/blobs#create-a-blob'
              }),
              { status: 409 }
            );
          }
          return new Response(JSON.stringify({ sha: 'blobsha' }), { status: 201 });
        }

        if (route.endsWith('/git/trees') && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'newtree' }), { status: 201 });
        }

        if (route.endsWith('/git/commits') && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'newcommit' }), { status: 201 });
        }

        if (route.endsWith('/git/refs') && method === 'POST') {
          return new Response(JSON.stringify({ ok: true }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await commitToDefaultBranch('token', 'o', 'r', 'main', [
      { path: 'README.md', content: 'first file' },
      { path: 'src/main.ts', content: 'console.log(1);' }
    ]);

    expect(calls.some((call) => call.route.endsWith('/git/blobs') && call.method === 'POST')).toBe(true);
    const treeCall = calls.find((call) => call.route.endsWith('/git/trees') && call.method === 'POST');
    expect(treeCall).toBeDefined();
    expect(treeCall?.body).toMatchObject({
      tree: [
        { content: 'first file', mode: '100644', path: 'README.md', type: 'blob' },
        { content: 'console.log(1);', mode: '100644', path: 'src/main.ts', type: 'blob' }
      ]
    });
    expect(calls.some((call) => call.route.endsWith('/git/refs') && call.method === 'POST' && (call.body as { ref?: string } | undefined)?.ref === 'refs/heads/main')).toBe(true);
  });



  test('normalizes blank default branch to main when creating refs', async () => {
    const calls: Array<{ route: string; method: string; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ route, method, body });

        if (route.includes('/git/ref/heads/main') && method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }

        if (route.endsWith('/git/blobs') && method === 'POST') {
          return new Response(
            JSON.stringify({
              message: 'Git Repository is empty.',
              documentation_url: 'https://docs.github.com/rest/git/blobs#create-a-blob'
            }),
            { status: 409 }
          );
        }

        if (route.endsWith('/git/trees') && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'newtree' }), { status: 201 });
        }

        if (route.endsWith('/git/commits') && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'newcommit' }), { status: 201 });
        }

        if (route.endsWith('/git/refs') && method === 'POST') {
          return new Response(JSON.stringify({ ok: true }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await commitToDefaultBranch('token', 'o', 'r', '   ', [{ path: 'README.md', content: 'first file' }]);

    expect(calls.some((call) => call.route.includes('/git/ref/heads/main') && call.method === 'GET')).toBe(true);
    expect(calls.some((call) => call.route.endsWith('/git/refs') && call.method === 'POST' && (call.body as { ref?: string } | undefined)?.ref === 'refs/heads/main')).toBe(true);
  });

  test('returns deterministic initialization error payload if empty-repo initialization fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';

        if (route.includes('/git/ref/heads/main') && method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }

        if (route.endsWith('/git/blobs') && method === 'POST') {
          return new Response(
            JSON.stringify({
              message: 'Git Repository is empty.',
              documentation_url: 'https://docs.github.com/rest/git/blobs#create-a-blob'
            }),
            { status: 409 }
          );
        }

        if (route.endsWith('/git/trees') && method === 'POST') {
          return new Response(JSON.stringify({ message: 'validation failed' }), { status: 422 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await expect(commitToDefaultBranch('token', 'o', 'r', 'main', [{ path: 'README.md', content: 'first file' }])).rejects.toThrow(
      'GitHub repository initialization failed: {"code":"EMPTY_REPO_INIT_FAILED","branch":"main"'
    );
  });

  test('returns actionable repository-name-conflict diagnostics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: 'Repository creation failed.',
            documentation_url: 'https://docs.github.com/rest/repos/repos#create-a-repository-for-the-authenticated-user',
            errors: [{ resource: 'Repository', field: 'name', code: 'custom', message: 'name already exists on this account' }]
          }),
          { status: 422 }
        )) as never
    );

    try {
      await createRepository('token', { repoName: 'existing-repo', visibility: 'private' });
    } catch (error) {
      expect(isGitHubApiError(error)).toBe(true);
      const mapped = mapGitHubErrorForClient(error);
      expect(mapped.error).toContain('GitHub API /user/repos failed (422)');
      expect(mapped.error).toContain('possibleCause=repository name is already in use for this GitHub account');
    }
  });
});
