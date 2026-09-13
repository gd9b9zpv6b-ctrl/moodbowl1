import { describe, expect, it } from 'vitest';

import { BODY_CHIP_BY_KEY } from '@/src/constants/body-chips';
import { SOUPS } from '@/src/constants/soups';
import { suggestChipsForSoup } from '@/src/lib/ritual/body-suggest';

describe('suggestChipsForSoup', () => {
  it('offers three existing chips for every food', () => {
    for (const soup of SOUPS) {
      const hints = suggestChipsForSoup(soup.key);
      expect(hints).toHaveLength(3);
      for (const key of hints) {
        expect(BODY_CHIP_BY_KEY[key]).toBeTruthy();
      }
    }
  });

  it('gives a gentle fallback when no food was picked', () => {
    expect(suggestChipsForSoup(null)).toEqual(['chest_warm', 'head_heavy', 'want_jump']);
  });

  it('matches spicy food to heat / fists, not a blank scan', () => {
    expect(suggestChipsForSoup('spicy_ginger')).toEqual([
      'heat_rising',
      'fists_clench',
      'jaw_clench',
    ]);
  });
});
