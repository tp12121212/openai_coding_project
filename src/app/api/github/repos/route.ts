import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/auth';
import { listRepositories, mapGitHubErrorForClient } from '@/lib/github/api';

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.githubAccessToken) {
    return NextResponse.json({ error: 'Not authenticated with GitHub.', guidance: 'Sign in with GitHub and retry.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const search = url.searchParams.get('search') ?? '';

  try {
    const result = await listRepositories(session.githubAccessToken, Number.isFinite(page) ? page : 1, search);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapGitHubErrorForClient(error);
    return NextResponse.json(mapped, { status: 502 });
  }
}
