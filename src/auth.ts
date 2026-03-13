import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { canEnableGitHubAuth, logRuntimeConfigValidation, readRuntimeEnv } from '@/lib/runtime-config';

export function getAuthOptions(): NextAuthOptions {
  logRuntimeConfigValidation('auth configuration');
  const githubAuthEnabled = canEnableGitHubAuth();

  return {
    providers: githubAuthEnabled
      ? [
          GitHubProvider({
            clientId: readRuntimeEnv('GITHUB_CLIENT_ID'),
            clientSecret: readRuntimeEnv('GITHUB_CLIENT_SECRET')
          })
        ]
      : [],
    secret: readRuntimeEnv('NEXTAUTH_SECRET'),
    callbacks: {
      async signIn() {
        return canEnableGitHubAuth();
      },
      async jwt({ token, account }) {
        if (account?.access_token) {
          token.githubAccessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.githubAccessToken) {
          (session as { githubAccessToken?: string }).githubAccessToken = String(token.githubAccessToken);
        }
        return session;
      }
    }
  };
}
