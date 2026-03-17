import { CODEX_PROFILES, CodexProfile } from '../types';

export interface CodexProfileDefinition {
  id: CodexProfile;
  label: string;
  helpText: string;
}

const PROFILE_DEFINITIONS: Record<CodexProfile, CodexProfileDefinition> = {
  strict: {
    id: 'strict',
    label: 'Strict',
    helpText: 'Smallest, safest, review-first changes; best for production-sensitive work.'
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    helpText: 'Moderate autonomy and implementation breadth; good default for normal feature work.'
  },
  rapid: {
    id: 'rapid',
    label: 'Rapid',
    helpText: 'Faster, broader changes with less conservatism; suited to prototypes and spikes.'
  }
};

export function getCodexProfileDefinition(profile: CodexProfile): CodexProfileDefinition {
  return PROFILE_DEFINITIONS[profile];
}

export function listCodexProfileDefinitions(): CodexProfileDefinition[] {
  return [...CODEX_PROFILES].map((profile) => PROFILE_DEFINITIONS[profile]);
}
