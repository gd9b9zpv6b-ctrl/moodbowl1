import { describe, expect, it } from 'vitest';

import { SOUPS, SOUP_BY_KEY } from '@/src/constants/soups';

describe('ritual food offering', () => {
  it('shows the kid-facing food set on stable keys', () => {
    expect(SOUPS.map((s) => [s.key, s.label])).toEqual([
      ['strawberry_milk', '雪糕'],
      ['marble_soda', '天婦羅'],
      ['lemon_juice', '檸檬'],
      ['spicy_ginger', '辣椒'],
      ['bitter_tea', '苦瓜'],
      ['warm_milk', '蒸蛋'],
      ['plain_water', '白飯'],
      ['no_drink', '唔想食'],
    ]);
  });

  it('keeps lookup by key for body / persist', () => {
    expect(SOUP_BY_KEY.strawberry_milk.label).toBe('雪糕');
    expect(SOUP_BY_KEY.no_drink.label).toBe('唔想食');
  });
});
