import { describe, expect, it } from 'vitest';

import { detectState } from '../state-detector';

describe('detectState', () => {
  it('detects sympathetic_fire from curry', () => {
    expect(detectState('curry', [])).toBe('sympathetic_fire');
  });

  it('detects sympathetic_fire from heart_fast + chest_tight', () => {
    expect(detectState('cold_lemon_tea', ['heart_fast', 'chest_tight'])).toBe(
      'sympathetic_fire',
    );
  });

  it('detects dorsal_sad from no_appetite', () => {
    expect(detectState('no_appetite', [])).toBe('dorsal_sad');
  });

  it('detects dorsal_sad from curled_up', () => {
    expect(detectState('cold_lemon_tea', ['curled_up'])).toBe('dorsal_sad');
  });

  it('detects dorsal_freeze from plain_congee', () => {
    expect(detectState('plain_congee', [])).toBe('dorsal_freeze');
  });

  it('detects dorsal_freeze from head_heavy + soft_hands', () => {
    expect(detectState('cold_lemon_tea', ['head_heavy', 'soft_hands'])).toBe(
      'dorsal_freeze',
    );
  });

  it('detects sympathetic_anxious from heart_fast + belly_full', () => {
    expect(detectState('cold_lemon_tea', ['heart_fast', 'belly_full'])).toBe(
      'sympathetic_anxious',
    );
  });

  it('detects ventral_regulated from sweet_soup', () => {
    expect(detectState('sweet_soup', [])).toBe('ventral_regulated');
  });

  it('detects ventral_regulated from hot_milk_tea', () => {
    expect(detectState('hot_milk_tea', [])).toBe('ventral_regulated');
  });

  it('detects unspoken as fallback', () => {
    expect(detectState('cold_lemon_tea', [])).toBe('unspoken');
    expect(detectState(null, [])).toBe('unspoken');
  });
});
