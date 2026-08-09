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

  if (soup === 'curry' || (has('heart_fast') && has('chest_tight'))) {
    return 'sympathetic_fire';
  }
  if (soup === 'no_appetite' || has('curled_up') || has('teary')) {
    return 'dorsal_sad';
  }
  if (soup === 'plain_congee' || (has('head_heavy') && has('soft_hands'))) {
    return 'dorsal_freeze';
  }
  if (has('heart_fast') && has('belly_full')) {
    return 'sympathetic_anxious';
  }
  if (soup === 'sweet_soup' || soup === 'hot_milk_tea') {
    return 'ventral_regulated';
  }
  return 'unspoken';
}
