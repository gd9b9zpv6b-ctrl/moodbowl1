import { describe, expect, it } from 'vitest';

import { BODY_CHIPS } from '@/src/constants/body-chips';
import { EMOTION_CATEGORIES } from '@/src/constants/emotions';
import { SOUPS } from '@/src/constants/soups';

import { discoveryBowlsForCategory, scoreBowls } from '../bowl-scorer';

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

  it('still returns 6 bowls for toilet + butterflies + curl-up', () => {
    const { default: candidates } = scoreBowls('plain_water', [
      'need_toilet',
      'belly_full',
      'curled_up',
    ]);
    expect(candidates).toHaveLength(6);
    expect(candidates.filter((b) => b.key !== 'hollow')).toHaveLength(5);
    const nervous = candidates.filter((b) => b.category === 'nervous');
    expect(nervous.length).toBeGreaterThanOrEqual(2);
  });

  it('fills a discovery scene from the scored shortlist so a combo is never empty', () => {
    const scored = scoreBowls('plain_water', ['need_toilet', 'belly_full', 'curled_up']);
    const bowls = discoveryBowlsForCategory('nervous', scored);
    expect(bowls.length).toBeGreaterThan(0);
    expect(bowls.every((b) => b.category === 'nervous')).toBe(true);
  });

  it('still returns 6 bowls when soup is skipped (no_drink) and chips are empty', () => {
    const { default: candidates } = scoreBowls('no_drink', []);
    expect(candidates).toHaveLength(6);
    expect(candidates.map((b) => b.key)).toContain('hollow');
  });

  it('returns 6 bowls for every soup, with or without a body chip', () => {
    for (const soup of SOUPS) {
      expect(scoreBowls(soup.key, []).default).toHaveLength(6);
      expect(scoreBowls(soup.key, ['curled_up']).default).toHaveLength(6);
    }
  });

  it('returns bowls in every discovery category even from an empty shortlist', () => {
    const empty = { default: [], expanded: [] };
    for (const category of EMOTION_CATEGORIES) {
      const bowls = discoveryBowlsForCategory(category.key, empty);
      expect(bowls.length).toBeGreaterThan(0);
      expect(bowls.every((b) => b.category === category.key)).toBe(true);
    }
  });

  it('scores every body chip without throwing', () => {
    for (const chip of BODY_CHIPS) {
      const { default: candidates } = scoreBowls('plain_water', [chip.key]);
      expect(candidates).toHaveLength(6);
    }
  });
});
