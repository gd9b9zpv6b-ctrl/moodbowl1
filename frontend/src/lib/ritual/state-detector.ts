import type { BodyChipKey } from '@/src/constants/body-chips';
import type { SoupKey } from '@/src/constants/soups';

export type NSState =
  | 'sympathetic_fire'
  | 'dorsal_sad'
  | 'dorsal_freeze'
  | 'sympathetic_anxious'
  | 'ventral_regulated'
  | 'unspoken';

export function detectState(soup: SoupKey | null, chips: BodyChipKey[]): NSState {
  const has = (key: BodyChipKey) => chips.includes(key);

  if (soup === 'spicy_ginger' || (has('heart_fast') && has('chest_tight'))) {
    return 'sympathetic_fire';
  }
  if (soup === 'no_drink' || soup === 'bitter_tea' || has('curled_up') || has('teary')) {
    return 'dorsal_sad';
  }
  if (soup === 'plain_water' || (has('head_heavy') && has('soft_hands'))) {
    return 'dorsal_freeze';
  }
  if (soup === 'marble_soda' || (has('heart_fast') && has('belly_full'))) {
    return 'sympathetic_anxious';
  }
  if (soup === 'strawberry_milk' || soup === 'warm_milk') {
    return 'ventral_regulated';
  }
  return 'unspoken';
}
