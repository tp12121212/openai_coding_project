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
            clientSecret: readRuntimeEnv('GITHUB_CLIENT_SECRET'),
            authorization: 'https://github.com/login/oauth/authorize?scope=read:user%20user:email%20repo'
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
        if (typeof account?.token_type === 'string') {
          token.githubTokenType = account.token_type;
        }
        if (typeof account?.scope === 'string') {
          token.githubGrantedScopes = account.scope
            .split(/[\s,]+/)
            .map((scope) => scope.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        }
        return token;
      },
      async session({ session, token }) {
        if (token.githubAccessToken) {
          (session as { githubAccessToken?: string }).githubAccessToken = String(token.githubAccessToken);
        }
        if (token.githubTokenType) {
          (session as { githubTokenType?: string }).githubTokenType = String(token.githubTokenType);
        }
        if (Array.isArray(token.githubGrantedScopes)) {
          (session as { githubGrantedScopes?: string[] }).githubGrantedScopes = token.githubGrantedScopes.map(String);
        }
        return session;
      }
    }
  };
}
