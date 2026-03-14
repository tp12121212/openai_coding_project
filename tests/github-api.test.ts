import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { commitToDefaultBranch, createBranchAndPullRequest, createRepository, detectGitHubCapabilities, isGitHubApiError, listRepositories, mapGitHubErrorForClient } from '../src/lib/github/api';

describe('github api integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });
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

  test('initializes empty repositories via contents API then commits scaffold files', async () => {
    const calls: Array<{ route: string; method: string; body?: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ route, method, body });

        if (route === '/repos/o/r' && method === 'GET') {
          return new Response(JSON.stringify({ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'main', owner: { login: 'o' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/ref/heads/main' && method === 'GET') {
          const initialized = calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT');
          if (!initialized) return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
          return new Response(JSON.stringify({ object: { sha: 'head-sha' } }), { status: 200 });
        }
        if (route.startsWith('/repos/o/r/commits?sha=main') && method === 'GET') {
          const initialized = calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT');
          return new Response(JSON.stringify(initialized ? [{ sha: 'head-sha' }] : []), { status: 200 });
        }
        if (route === '/repos/o/r/contents/README.md' && method === 'PUT') {
          return new Response(JSON.stringify({ content: { path: 'README.md' }, commit: { sha: 'init-commit' } }), { status: 201 });
        }
        if (route === '/repos/o/r/git/blobs' && method === 'POST') {
          return new Response(JSON.stringify({ sha: `blob-${calls.length}` }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits/head-sha' && method === 'GET') {
          return new Response(JSON.stringify({ tree: { sha: 'base-tree' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/trees' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'tree-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'commit-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/refs/heads/main' && method === 'PATCH') {
          return new Response(JSON.stringify({ ref: 'refs/heads/main' }), { status: 200 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await commitToDefaultBranch('token', 'o', 'r', 'main', [
      { path: 'README.md', content: 'first file' },
      { path: 'src/main.ts', content: 'console.log(1);' }
    ]);

    expect(calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT')).toBe(true);
    expect(calls.some((call) => call.route === '/repos/o/r/git/blobs' && call.method === 'POST')).toBe(true);
    expect(calls.some((call) => call.route === '/repos/o/r/git/refs/heads/main' && call.method === 'PATCH')).toBe(true);
  });

  test('skips initialization for existing repositories with branch head', async () => {
    const calls: Array<{ route: string; method: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        calls.push({ route, method });

        if (route === '/repos/o/r' && method === 'GET') {
          return new Response(JSON.stringify({ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'main', owner: { login: 'o' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/ref/heads/main' && method === 'GET') {
          return new Response(JSON.stringify({ object: { sha: 'head-sha' } }), { status: 200 });
        }
        if (route.startsWith('/repos/o/r/commits?sha=main') && method === 'GET') {
          return new Response(JSON.stringify([{ sha: 'head-sha' }]), { status: 200 });
        }
        if (route === '/repos/o/r/git/blobs' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'blob-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits/head-sha' && method === 'GET') {
          return new Response(JSON.stringify({ tree: { sha: 'base-tree' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/trees' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'tree-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'commit-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/refs/heads/main' && method === 'PATCH') {
          return new Response(JSON.stringify({ ref: 'refs/heads/main' }), { status: 200 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await commitToDefaultBranch('token', 'o', 'r', 'main', [{ path: 'README.md', content: 'first file' }]);

    expect(calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT')).toBe(false);
  });

  test('initializes empty existing repository instead of failing with missing branch head', async () => {
    const calls: Array<{ route: string; method: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        calls.push({ route, method });

        if (route === '/repos/o/r' && method === 'GET') {
          return new Response(JSON.stringify({ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'main', owner: { login: 'o' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/ref/heads/main' && method === 'GET') {
          const initialized = calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT');
          if (!initialized) return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
          return new Response(JSON.stringify({ object: { sha: 'head-sha' } }), { status: 200 });
        }
        if (route.startsWith('/repos/o/r/commits?sha=main') && method === 'GET') {
          const initialized = calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT');
          return new Response(JSON.stringify(initialized ? [{ sha: 'head-sha' }] : []), { status: 200 });
        }
        if (route === '/repos/o/r/contents/README.md' && method === 'PUT') {
          return new Response(JSON.stringify({ content: { path: 'README.md' }, commit: { sha: 'init-commit' } }), { status: 201 });
        }
        if (route === '/repos/o/r/git/trees/head-sha?recursive=1' && method === 'GET') {
          return new Response(JSON.stringify({ sha: 'tree-sha', tree: [] }), { status: 200 });
        }
        if (route === '/repos/o/r/git/refs' && method === 'POST') {
          return new Response(JSON.stringify({ ref: 'refs/heads/scaffold/update-abcd1234' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/blobs' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'blob-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits/head-sha' && method === 'GET') {
          return new Response(JSON.stringify({ tree: { sha: 'base-tree' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/trees' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'new-tree' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'new-commit' }), { status: 201 });
        }
        if (route.startsWith('/repos/o/r/git/refs/heads/scaffold%2Fupdate-') && method === 'PATCH') {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (route === '/repos/o/r/pulls' && method === 'POST') {
          return new Response(JSON.stringify({ html_url: 'https://github.com/o/r/pull/1' }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    const result = await createBranchAndPullRequest({
      token: 'token',
      owner: 'o',
      repo: 'r',
      defaultBranch: 'main',
      files: [{ path: 'README.md', content: 'first file' }]
    });

    expect(result.prUrl).toBe('https://github.com/o/r/pull/1');
    expect(calls.some((call) => call.route === '/repos/o/r/contents/README.md' && call.method === 'PUT')).toBe(true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('supports non-main default branch names', async () => {
    const pulls: Array<{ base?: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;

        if (route === '/repos/o/r' && method === 'GET') {
          return new Response(JSON.stringify({ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'trunk', owner: { login: 'o' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/ref/heads/trunk' && method === 'GET') {
          return new Response(JSON.stringify({ object: { sha: 'head-sha' } }), { status: 200 });
        }
        if (route.startsWith('/repos/o/r/commits?sha=trunk') && method === 'GET') {
          return new Response(JSON.stringify([{ sha: 'head-sha' }]), { status: 200 });
        }
        if (route === '/repos/o/r/git/trees/head-sha?recursive=1' && method === 'GET') {
          return new Response(JSON.stringify({ sha: 'tree-sha', tree: [] }), { status: 200 });
        }
        if (route === '/repos/o/r/git/refs' && method === 'POST') {
          return new Response(JSON.stringify({ ref: 'refs/heads/scaffold/update-abcd1234' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/blobs' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'blob-sha' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits/head-sha' && method === 'GET') {
          return new Response(JSON.stringify({ tree: { sha: 'base-tree' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/trees' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'new-tree' }), { status: 201 });
        }
        if (route === '/repos/o/r/git/commits' && method === 'POST') {
          return new Response(JSON.stringify({ sha: 'new-commit' }), { status: 201 });
        }
        if (route.startsWith('/repos/o/r/git/refs/heads/scaffold%2Fupdate-') && method === 'PATCH') {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (route === '/repos/o/r/pulls' && method === 'POST') {
          pulls.push(body ?? {});
          return new Response(JSON.stringify({ html_url: 'https://github.com/o/r/pull/2' }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    const result = await createBranchAndPullRequest({
      token: 'token',
      owner: 'o',
      repo: 'r',
      defaultBranch: 'main',
      files: [{ path: 'README.md', content: 'first file' }]
    });

    expect(result.prUrl).toContain('/pull/2');
    expect(pulls[0]?.base).toBe('trunk');
  });

  test('returns deterministic workflow error payload when empty-repo initialization fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const route = url.replace('https://api.github.com', '');
        const method = init?.method ?? 'GET';

        if (route === '/repos/o/r' && method === 'GET') {
          return new Response(JSON.stringify({ name: 'r', full_name: 'o/r', private: true, html_url: 'https://github.com/o/r', default_branch: 'main', owner: { login: 'o' } }), { status: 200 });
        }
        if (route === '/repos/o/r/git/ref/heads/main' && method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }
        if (route.startsWith('/repos/o/r/commits?sha=main') && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (route === '/repos/o/r/contents/README.md' && method === 'PUT') {
          return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
        }

        return new Response(JSON.stringify({ message: `Unhandled: ${method} ${route}` }), { status: 500 });
      }) as never
    );

    await expect(commitToDefaultBranch('token', 'o', 'r', 'main', [{ path: 'README.md', content: 'first file' }])).rejects.toThrow(
      '"code":"GITHUB_EMPTY_REPO_INIT_FAILED"'
    );

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[github] API request failed', expect.objectContaining({ endpoint: '/repos/o/r/contents/README.md', status: 403 }));
  });

  test('detects revoked, expired, and missing repo access auth states', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/user')) {
          return new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401, headers: { 'x-oauth-scopes': 'repo' } });
        }
        return new Response(JSON.stringify([]), { status: 200, headers: { 'x-oauth-scopes': 'repo' } });
      }) as never
    );
    await expect(detectGitHubCapabilities('token')).resolves.toMatchObject({ authStatus: 'revoked' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/user')) {
          return new Response(JSON.stringify({ message: 'Requires authentication' }), { status: 401, headers: { 'x-oauth-scopes': 'repo' } });
        }
        return new Response(JSON.stringify([]), { status: 200, headers: { 'x-oauth-scopes': 'repo' } });
      }) as never
    );
    await expect(detectGitHubCapabilities('token')).resolves.toMatchObject({ authStatus: 'expired' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/user')) {
          return new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { 'x-oauth-scopes': 'read:user' } });
        }
        return new Response(JSON.stringify({ message: 'Resource not accessible by integration' }), { status: 403 });
      }) as never
    );
    await expect(detectGitHubCapabilities('token')).resolves.toMatchObject({ authStatus: 'missing_installation_permissions' });
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
