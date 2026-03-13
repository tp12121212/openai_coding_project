import { NextResponse } from 'next/server';
import { canEnableGitHubAuth, getMissingRuntimeEnvVars, getRuntimeConfigStatus, logRuntimeConfigValidation } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  logRuntimeConfigValidation('runtime config check endpoint');
  return NextResponse.json(
    {
      githubAuthEnabled: canEnableGitHubAuth(),
      missing: getMissingRuntimeEnvVars(),
      status: getRuntimeConfigStatus()
    },
    { status: 200 }
  );
}
