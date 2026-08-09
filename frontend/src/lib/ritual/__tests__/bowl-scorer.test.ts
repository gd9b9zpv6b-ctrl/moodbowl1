import { describe, expect, it } from 'vitest';

import { scoreBowls } from '../bowl-scorer';

describe('scoreBowls', () => {
  it('returns 6 default candidates including hollow', () => {
    const { default: candidates } = scoreBowls('hot_milk_tea', ['chest_warm']);
    expect(candidates).toHaveLength(6);
    expect(candidates.map((b) => b.key)).toContain('hollow');
  });

  it('keeps expanded list at most 12 for curry + heart_fast + chest_tight', () => {
    const { default: candidates, expanded } = scoreBowls('curry', [
      'heart_fast',
      'chest_tight',
    ]);
    expect(candidates).toHaveLength(6);
    expect(candidates.map((b) => b.key)).toContain('hollow');
    expect(expanded.length).toBeLessThanOrEqual(12);
  });
});
