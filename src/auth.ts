import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? 'disabled-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? 'disabled-client-secret'
    })
  ],
  callbacks: {
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
