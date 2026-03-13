import 'next-auth';

declare module 'next-auth' {
  interface Session {
    githubAccessToken?: string;
    githubTokenType?: string;
    githubGrantedScopes?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    githubAccessToken?: string;
    githubTokenType?: string;
    githubGrantedScopes?: string[];
  }
}
