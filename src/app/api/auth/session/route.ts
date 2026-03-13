import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/auth';
import { canEnableGitHubAuth, getMissingRuntimeEnvVars } from '@/lib/runtime-config';

function hasRepoCreateScope(scopes: string[]): boolean {
  return scopes.includes('repo') || scopes.includes('public_repo');
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  const grantedScopes = session?.githubGrantedScopes ?? [];
  const accessTokenPresent = Boolean(session?.githubAccessToken);

  return NextResponse.json({
    authenticated: Boolean(session?.user && accessTokenPresent),
    user: session?.user ?? null,
    githubAuthEnabled: canEnableGitHubAuth(),
    missingEnv: getMissingRuntimeEnvVars(),
    accessTokenPresent,
    tokenType: session?.githubTokenType ?? 'unknown',
    grantedScopes,
    repoCreateCapability: accessTokenPresent ? hasRepoCreateScope(grantedScopes) : false
  });
}
