import { afterEach, describe, expect, test } from 'vitest';
import { canEnableGitHubAuth, getRuntimeConfigStatus } from '../src/lib/runtime-config';

const original = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
};

afterEach(() => {
  process.env.NEXTAUTH_URL = original.NEXTAUTH_URL;
  process.env.NEXTAUTH_SECRET = original.NEXTAUTH_SECRET;
  process.env.GITHUB_CLIENT_ID = original.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = original.GITHUB_CLIENT_SECRET;
});

describe('runtime config checks', () => {
  test('reports missing and present env vars without exposing values', () => {
    process.env.NEXTAUTH_URL = 'https://codex.killercloud.com.au';
    process.env.NEXTAUTH_SECRET = '';
    process.env.GITHUB_CLIENT_ID = 'abc';
    process.env.GITHUB_CLIENT_SECRET = '';

    expect(getRuntimeConfigStatus()).toEqual({
      NEXTAUTH_URL: 'present',
      NEXTAUTH_SECRET: 'missing',
      GITHUB_CLIENT_ID: 'present',
      GITHUB_CLIENT_SECRET: 'missing'
    });
  });

  test('enables github auth only when all required runtime vars exist', () => {
    process.env.NEXTAUTH_URL = 'https://codex.killercloud.com.au';
    process.env.NEXTAUTH_SECRET = 'secret';
    process.env.GITHUB_CLIENT_ID = 'client';
    process.env.GITHUB_CLIENT_SECRET = 'client-secret';
    expect(canEnableGitHubAuth()).toBe(true);

    process.env.GITHUB_CLIENT_SECRET = '';
    expect(canEnableGitHubAuth()).toBe(false);
  });
});
