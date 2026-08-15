import { describe, expect, it } from 'vitest';

import { resolveWanjaiMood } from '@/src/lib/ritual/wanjai-mood';

describe('resolveWanjaiMood', () => {
  it('stays neutral with no chips', () => {
    expect(resolveWanjaiMood([])).toBe('neutral');
  });

  it('goes anxious for sweat / shake / heart', () => {
    expect(resolveWanjaiMood(['sweaty_palms', 'shaky'])).toBe('anxious');
    expect(resolveWanjaiMood(['heart_fast', 'belly_full'])).toBe('anxious');
  });

  it('goes fiery for fists / heat', () => {
    expect(resolveWanjaiMood(['fists_clench', 'heat_rising'])).toBe('fiery');
  });

  it('goes heavy for tears / shoulders', () => {
    expect(resolveWanjaiMood(['teary', 'shoulders_heavy'])).toBe('heavy');
  });

  it('goes warm for smile / jump', () => {
    expect(resolveWanjaiMood(['smile_wide', 'want_jump'])).toBe('warm');
  });
});
