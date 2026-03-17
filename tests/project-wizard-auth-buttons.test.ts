import { describe, expect, test } from 'vitest';
import {
  defaultFormState,
  DELIVERY_TARGET_SECTION_TITLE,
  resolveGitHubAuthButtons,
  shouldShowGitHubSignInForMode
} from '../src/components/project-wizard';

describe('github auth button visibility', () => {
  test('default delivery mode is download ZIP', () => {
    expect(defaultFormState.deliveryMode).toBe('zip');
    expect(shouldShowGitHubSignInForMode(defaultFormState.deliveryMode)).toBe(false);
  });

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

  test('shows github sign-in controls only for github delivery modes', () => {
    expect(shouldShowGitHubSignInForMode('zip')).toBe(false);
    expect(shouldShowGitHubSignInForMode('github-new-repo')).toBe(true);
    expect(shouldShowGitHubSignInForMode('github-existing-repo')).toBe(true);
  });

  test('github sign-in controls are associated with delivery target section', () => {
    expect(DELIVERY_TARGET_SECTION_TITLE).toBe('Delivery target and repository behavior');
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
