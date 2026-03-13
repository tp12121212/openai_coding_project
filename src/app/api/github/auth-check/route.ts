import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/auth';
import { detectGitHubCapabilities } from '@/lib/github/api';

function inferRepoCreateCapability(scopes: string[]): boolean | 'unknown' {
  if (scopes.length === 0) return 'unknown';
  return scopes.includes('repo') || scopes.includes('public_repo');
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  const accessToken = session?.githubAccessToken;

  if (!session?.user) {
    return NextResponse.json({
      authenticated: false,
      accessTokenPresent: false,
      repoCreateCapability: 'unknown',
      repoListCapability: 'unknown',
      tokenType: 'unknown',
      grantedScopes: []
    });
  }

  const grantedScopes = session.githubGrantedScopes ?? [];
  const capability = accessToken ? await detectGitHubCapabilities(accessToken) : null;
  const repoCreateCapability = capability?.repoCreateCapability ?? inferRepoCreateCapability(grantedScopes);

  return NextResponse.json({
    authenticated: true,
    accessTokenPresent: Boolean(accessToken),
    repoCreateCapability,
    repoListCapability: capability?.repoListCapability ?? 'unknown',
    tokenType: session.githubTokenType ?? capability?.tokenType ?? 'unknown',
    grantedScopes: capability?.tokenScopes.length ? capability.tokenScopes : grantedScopes
  });
}
