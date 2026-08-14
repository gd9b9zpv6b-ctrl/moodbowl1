import { describe, expect, it } from 'vitest';

import { scoreBowls } from '../bowl-scorer';

describe('scoreBowls', () => {
  it('returns 6 default candidates including hollow', () => {
    const { default: candidates } = scoreBowls('warm_milk', ['chest_warm']);
    expect(candidates).toHaveLength(6);
    expect(candidates.map((b) => b.key)).toContain('hollow');
  });

  it('keeps expanded list at most 12 for spicy_ginger + heart_fast + chest_tight', () => {
    const { default: candidates, expanded } = scoreBowls('spicy_ginger', [
      'heart_fast',
      'chest_tight',
    ]);
    expect(candidates).toHaveLength(6);
    expect(candidates.map((b) => b.key)).toContain('hollow');
    expect(expanded.length).toBeLessThanOrEqual(12);
  });

  it('lets teary clarify strawberry_milk toward sad bowls over warm', () => {
    const { default: withBody } = scoreBowls('strawberry_milk', ['teary']);
    const { default: drinkOnly } = scoreBowls('strawberry_milk', []);

    const sadKeys = new Set(['sad', 'lonely', 'in-pain', 'hollow', 'abandoned', 'unloved']);
    const warmKeys = new Set(['happy', 'content', 'loved', 'grateful', 'peaceful']);

    const bodySad = withBody.filter((b) => sadKeys.has(b.key)).length;
    const bodyWarm = withBody.filter((b) => warmKeys.has(b.key)).length;
    const onlyWarm = drinkOnly.filter((b) => warmKeys.has(b.key)).length;

    expect(bodySad).toBeGreaterThanOrEqual(2);
    expect(bodySad).toBeGreaterThan(bodyWarm);
    expect(onlyWarm).toBeGreaterThanOrEqual(2);
  });
});
