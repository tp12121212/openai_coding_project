import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { canEnableGitHubAuth, getMissingRuntimeEnvVars } from '@/lib/runtime-config';

export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json({
    authenticated: Boolean(session?.user),
    user: session?.user ?? null,
    githubAuthEnabled: canEnableGitHubAuth(),
    missingEnv: getMissingRuntimeEnvVars()
  });
}
