import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/auth';
import { canEnableGitHubAuth, getMissingRuntimeEnvVars } from '@/lib/runtime-config';

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  return NextResponse.json({
    authenticated: Boolean(session?.user),
    user: session?.user ?? null,
    githubAuthEnabled: canEnableGitHubAuth(),
    missingEnv: getMissingRuntimeEnvVars()
  });
}
