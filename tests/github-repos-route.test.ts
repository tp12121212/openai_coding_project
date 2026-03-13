import { beforeEach, describe, expect, test, vi } from 'vitest';

const getServerSession = vi.fn();
const listRepositories = vi.fn();

vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('../src/auth', () => ({ getAuthOptions: () => ({}) }));
vi.mock('../src/lib/github/api', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/github/api')>('../src/lib/github/api');
  return {
    ...actual,
    listRepositories
  };
});

describe('GET /api/github/repos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('returns 401 when token missing', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'User' } });
    const { GET } = await import('../src/app/api/github/repos/route');
    const res = await GET(new Request('http://localhost/api/github/repos?page=1&search='));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Not authenticated with GitHub');
  });

  test('returns repo list payload on success', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'User' }, githubAccessToken: 'token' });
    listRepositories.mockResolvedValue({ repos: [{ full_name: 'o/r' }], hasNextPage: false });

    const { GET } = await import('../src/app/api/github/repos/route');
    const res = await GET(new Request('http://localhost/api/github/repos?page=1&search=o/'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ repos: [{ full_name: 'o/r' }], hasNextPage: false });
  });
});
