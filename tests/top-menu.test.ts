import { describe, expect, test } from 'vitest';
import { topMenuItems } from '../src/components/dossier-frame';

describe('floating top menu labels', () => {
  test('uses create project files label', () => {
    expect(topMenuItems.map((item) => item.label)).toContain('Create project files');
    expect(topMenuItems.map((item) => item.label)).not.toContain('Live dossier');
  });
});
