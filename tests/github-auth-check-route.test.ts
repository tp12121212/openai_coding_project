import { beforeEach, describe, expect, test, vi } from 'vitest';

const getServerSession = vi.fn();
const detectGitHubCapabilities = vi.fn();

vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('../src/auth', () => ({ getAuthOptions: () => ({}) }));
vi.mock('../src/lib/github/api', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/github/api')>('../src/lib/github/api');
  return {
    ...actual,
    detectGitHubCapabilities
  };
});

describe('GET /api/github/auth-check', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('returns unauthenticated response when session is absent', async () => {
    getServerSession.mockResolvedValue(null);
    const { GET } = await import('../src/app/api/github/auth-check/route');

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      authenticated: false,
      accessTokenPresent: false,
      repoCreateCapability: 'unknown',
      repoListCapability: 'unknown',
      tokenType: 'unknown',
      grantedScopes: [],
      authStatus: 'unknown',
      reauthorizeRequired: false
    });
  });

  test('returns sanitized capability summary for authenticated valid session', async () => {
    getServerSession.mockResolvedValue({
      user: { name: 'Test User' },
      githubAccessToken: 'secret-token',
      githubTokenType: 'bearer',
      githubGrantedScopes: ['read:user']
    });
    detectGitHubCapabilities.mockResolvedValue({
      tokenPresent: true,
      tokenScopes: ['repo', 'read:user'],
      repoListCapability: true,
      repoCreateCapability: true,
      tokenType: 'oauth',
      authStatus: 'valid'
    });

    const { GET } = await import('../src/app/api/github/auth-check/route');
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.accessTokenPresent).toBe(true);
    expect(body.repoListCapability).toBe(true);
    expect(body.repoCreateCapability).toBe(true);
    expect(body.tokenType).toBe('bearer');
    expect(body.grantedScopes).toEqual(['repo', 'read:user']);
    expect(body.authStatus).toBe('valid');
    expect(body.reauthorizeRequired).toBe(false);
    expect(JSON.stringify(body)).not.toContain('secret-token');
  });

  test.each(['revoked', 'expired', 'missing_repo_access', 'missing_installation_permissions', 'missing_scopes'])(
    'marks reauthorizeRequired when auth status is %s',
    async (authStatus) => {
      getServerSession.mockResolvedValue({
        user: { name: 'Test User' },
        githubAccessToken: 'secret-token',
        githubTokenType: 'bearer',
        githubGrantedScopes: ['read:user']
      });
      detectGitHubCapabilities.mockResolvedValue({
        tokenPresent: true,
        tokenScopes: ['read:user'],
        repoListCapability: false,
        repoCreateCapability: false,
        tokenType: 'oauth',
        authStatus
      });

      const { GET } = await import('../src/app/api/github/auth-check/route');
      const res = await GET();
      const body = await res.json();

      expect(body.reauthorizeRequired).toBe(true);
      expect(body.authStatus).toBe(authStatus);
    }
  );
});
