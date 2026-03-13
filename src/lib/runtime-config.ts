export const REQUIRED_RUNTIME_ENV_VARS = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
] as const;

export type RuntimeEnvVar = (typeof REQUIRED_RUNTIME_ENV_VARS)[number];
export type RuntimeConfigStatus = Record<RuntimeEnvVar, 'present' | 'missing'>;

export function readRuntimeEnv(name: RuntimeEnvVar): string {
  return process.env[name]?.trim() ?? '';
}

export function getRuntimeConfigStatus(): RuntimeConfigStatus {
  return REQUIRED_RUNTIME_ENV_VARS.reduce((status, key) => {
    status[key] = readRuntimeEnv(key) ? 'present' : 'missing';
    return status;
  }, {} as RuntimeConfigStatus);
}

export function getMissingRuntimeEnvVars(): RuntimeEnvVar[] {
  const status = getRuntimeConfigStatus();
  return REQUIRED_RUNTIME_ENV_VARS.filter((key) => status[key] === 'missing');
}

export function canEnableGitHubAuth(): boolean {
  const requiredForAuth: RuntimeEnvVar[] = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];
  return requiredForAuth.every((key) => readRuntimeEnv(key));
}

let hasLoggedRuntimeConfigError = false;

export function logRuntimeConfigValidation(context: string): void {
  const missing = getMissingRuntimeEnvVars();
  if (missing.length === 0 || hasLoggedRuntimeConfigError) {
    return;
  }

  hasLoggedRuntimeConfigError = true;
  console.error(
    `[runtime-config] Missing required environment variables in ${context}: ${missing.join(', ')}. ` +
      'GitHub authentication will be disabled until these values are set in runtime configuration.'
  );
}
