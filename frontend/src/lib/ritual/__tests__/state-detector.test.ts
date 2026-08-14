import { describe, expect, it } from 'vitest';

import { detectState } from '../state-detector';

describe('detectState', () => {
  it('lets body chips clarify a sweet-drink craving as sadness', () => {
    expect(detectState('strawberry_milk', ['teary'])).toBe('dorsal_sad');
    expect(detectState('strawberry_milk', ['curled_up'])).toBe('dorsal_sad');
  });

  it('detects sympathetic_fire from spicy_ginger', () => {
    expect(detectState('spicy_ginger', [])).toBe('sympathetic_fire');
  });

  it('detects sympathetic_fire from heart_fast + chest_tight', () => {
    expect(detectState('lemon_juice', ['heart_fast', 'chest_tight'])).toBe(
      'sympathetic_fire',
    );
  });

  it('detects dorsal_sad from no_drink', () => {
    expect(detectState('no_drink', [])).toBe('dorsal_sad');
  });

  it('detects dorsal_sad from bitter_tea', () => {
    expect(detectState('bitter_tea', [])).toBe('dorsal_sad');
  });

  it('detects dorsal_freeze from plain_water', () => {
    expect(detectState('plain_water', [])).toBe('dorsal_freeze');
  });

  it('detects dorsal_freeze from head_heavy + soft_hands', () => {
    expect(detectState('lemon_juice', ['head_heavy', 'soft_hands'])).toBe(
      'dorsal_freeze',
    );
  });

  it('detects sympathetic_anxious from marble_soda', () => {
    expect(detectState('marble_soda', [])).toBe('sympathetic_anxious');
  });

  it('detects sympathetic_anxious from heart_fast + belly_full', () => {
    expect(detectState('lemon_juice', ['heart_fast', 'belly_full'])).toBe(
      'sympathetic_anxious',
    );
  });

  it('detects ventral_regulated from strawberry_milk alone', () => {
    expect(detectState('strawberry_milk', [])).toBe('ventral_regulated');
  });

  it('detects ventral_regulated from warm body signals', () => {
    expect(detectState('bitter_tea', ['chest_warm', 'floaty'])).toBe(
      'ventral_regulated',
    );
  });

  it('detects unspoken as fallback', () => {
    expect(detectState('lemon_juice', [])).toBe('unspoken');
    expect(detectState(null, [])).toBe('unspoken');
  });
});
