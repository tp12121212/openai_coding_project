import { describe, expect, test } from 'vitest';
import { getAuthOptions } from '../src/auth';

describe('auth options', () => {
  test('github provider requests repo scope and callbacks persist token metadata', async () => {
    process.env.NEXTAUTH_URL = 'https://example.com';
    process.env.NEXTAUTH_SECRET = 'secret';
    process.env.GITHUB_CLIENT_ID = 'client';
    process.env.GITHUB_CLIENT_SECRET = 'client-secret';

    const options = getAuthOptions();
    expect(options.providers?.length).toBe(1);

    const jwt = await options.callbacks!.jwt!({
      token: {},
      account: { access_token: 'abc', token_type: 'bearer', scope: 'repo user:email read:user' }
    } as never);

    expect(jwt.githubAccessToken).toBe('abc');
    expect(jwt.githubTokenType).toBe('bearer');
    expect(jwt.githubGrantedScopes).toEqual(['read:user', 'repo', 'user:email']);

    const session = await options.callbacks!.session!({
      session: { user: { name: 'a', email: 'b@example.com', image: null }, expires: 'x' },
      token: jwt
    } as never);

    expect((session as { githubAccessToken?: string }).githubAccessToken).toBe('abc');
    expect((session as { githubTokenType?: string }).githubTokenType).toBe('bearer');
    expect((session as { githubGrantedScopes?: string[] }).githubGrantedScopes).toEqual(['read:user', 'repo', 'user:email']);
  });

  test('signIn callback blocks when runtime auth config is missing', async () => {
    process.env.NEXTAUTH_URL = '';
    process.env.NEXTAUTH_SECRET = '';
    process.env.GITHUB_CLIENT_ID = '';
    process.env.GITHUB_CLIENT_SECRET = '';

    const options = getAuthOptions();
    const allow = await options.callbacks!.signIn!({ user: { id: 'x' } } as never);

    expect(allow).toBe(false);
  });
});
