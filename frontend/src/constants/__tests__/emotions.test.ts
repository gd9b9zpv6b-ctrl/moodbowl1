import { describe, expect, it } from 'vitest';

import {
  EMOTION_BY_KEY,
  EMOTION_CATEGORIES,
  EMOTIONS,
  UNPICKED_BOWL_KEY,
  emotionForBowlKey,
  resolvedBowlKey,
} from '@/src/constants/emotions';

describe('emotion bowl family', () => {
  it('gives every emotion a mascot image', () => {
    const missing = EMOTIONS.filter((e) => !e.image).map((e) => e.key);
    expect(missing).toEqual([]);
  });

  it('falls back to 樹洞 when no bowl was picked', () => {
    expect(UNPICKED_BOWL_KEY).toBe('hollow');
    expect(resolvedBowlKey(null)).toBe('hollow');
    expect(resolvedBowlKey(undefined)).toBe('hollow');
    expect(resolvedBowlKey('not-a-bowl')).toBe('hollow');
    expect(resolvedBowlKey('sad')).toBe('sad');
    expect(emotionForBowlKey(null).label).toBe('樹洞');
    expect(emotionForBowlKey('sad').key).toBe('sad');
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
