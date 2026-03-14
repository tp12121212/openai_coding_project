import { describe, expect, test } from 'vitest';
import { resolveGitHubAuthButtons } from '../src/components/project-wizard';

describe('github auth button visibility', () => {
  test('shows sign-in when logged out', () => {
    expect(resolveGitHubAuthButtons({ githubRuntimeReady: true, authenticated: false, reauthorizeRequired: false })).toEqual({
      showSignIn: true,
      showReauthorize: false,
      showSignOut: false
    });
  });

  test('hides re-authorize when session is valid', () => {
    expect(resolveGitHubAuthButtons({ githubRuntimeReady: true, authenticated: true, reauthorizeRequired: false })).toEqual({
      showSignIn: false,
      showReauthorize: false,
      showSignOut: true
    });
  });

  test('shows re-authorize for revoked token state', () => {
    expect(resolveGitHubAuthButtons({ githubRuntimeReady: true, authenticated: true, reauthorizeRequired: true })).toEqual({
      showSignIn: false,
      showReauthorize: true,
      showSignOut: true
    });
  });

  test('never shows sign-in and re-authorize simultaneously', () => {
    const states = [
      { githubRuntimeReady: true, authenticated: false, reauthorizeRequired: false },
      { githubRuntimeReady: true, authenticated: true, reauthorizeRequired: false },
      { githubRuntimeReady: true, authenticated: true, reauthorizeRequired: true },
      { githubRuntimeReady: false, authenticated: false, reauthorizeRequired: false },
      { githubRuntimeReady: false, authenticated: true, reauthorizeRequired: true }
    ] as const;

    for (const state of states) {
      const resolved = resolveGitHubAuthButtons(state);
      expect(resolved.showSignIn && resolved.showReauthorize).toBe(false);
    }
  });
});
