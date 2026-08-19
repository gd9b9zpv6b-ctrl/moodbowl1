import { describe, expect, it } from 'vitest';

import { EMOTION_BY_KEY, EMOTION_CATEGORIES, EMOTIONS } from '@/src/constants/emotions';

describe('emotion bowl family', () => {
  it('gives every emotion a mascot image', () => {
    const missing = EMOTIONS.filter((e) => !e.image).map((e) => e.key);
    expect(missing).toEqual([]);
  });

  it('keeps unique keys and category membership', () => {
    const keys = EMOTIONS.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    const categoryKeys = new Set(EMOTION_CATEGORIES.map((c) => c.key));
    for (const emotion of EMOTIONS) {
      expect(categoryKeys.has(emotion.category)).toBe(true);
      expect(EMOTION_BY_KEY[emotion.key]?.key).toBe(emotion.key);
    }
  });
});
