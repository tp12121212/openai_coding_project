import { describe, expect, test, vi } from 'vitest';
import { createRepository, isGitHubApiError, listRepositories, mapGitHubErrorForClient } from '../src/lib/github/api';

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

  test('returns actionable repository-name-conflict diagnostics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: 'Repository creation failed. name already exists on this account',
            documentation_url: 'https://docs.github.com/rest/repos/repos#create-a-repository-for-the-authenticated-user'
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
