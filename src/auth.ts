import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { canEnableGitHubAuth, logRuntimeConfigValidation } from '@/lib/runtime-config';

logRuntimeConfigValidation('auth configuration');

const githubAuthEnabled = canEnableGitHubAuth();

export const authOptions: NextAuthOptions = {
  providers: githubAuthEnabled
    ? [
        GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string
        })
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return githubAuthEnabled;
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
