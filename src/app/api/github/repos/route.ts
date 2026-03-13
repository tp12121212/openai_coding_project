import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { listRepositories } from '@/lib/github/api';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.githubAccessToken) {
    return NextResponse.json({ error: 'Not authenticated with GitHub.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const search = url.searchParams.get('search') ?? '';

  try {
    const result = await listRepositories(session.githubAccessToken, Number.isFinite(page) ? page : 1, search);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GitHub fetch failed.' }, { status: 502 });
  }
}
