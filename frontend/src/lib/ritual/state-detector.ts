import type { BodyChipKey } from '@/src/constants/body-chips';
import type { SoupKey } from '@/src/constants/soups';

export type NSState =
  | 'sympathetic_fire'
  | 'dorsal_sad'
  | 'dorsal_freeze'
  | 'sympathetic_anxious'
  | 'ventral_regulated'
  | 'unspoken';

/**
 * Body chips clarify ambiguous drink choices (e.g. sweet drink while sad).
 * Interoceptive signals are checked before drink priors.
 */
export function detectState(soup: SoupKey | null, chips: BodyChipKey[]): NSState {
  const has = (key: BodyChipKey) => chips.includes(key);

  // Body-first · clarification over craving metaphor
  if (has('teary') || has('curled_up')) {
    return 'dorsal_sad';
  }
  if (has('shoulders_heavy') || (has('head_heavy') && has('throat_tight'))) {
    return 'dorsal_sad';
  }
  if (has('heart_fast') && (has('chest_tight') || has('face_flush'))) {
    return 'sympathetic_fire';
  }
  if (has('heart_fast') || has('sweaty_palms') || (has('face_flush') && has('belly_full'))) {
    return 'sympathetic_anxious';
  }
  if ((has('head_heavy') && has('soft_hands')) || (has('throat_tight') && has('soft_hands'))) {
    return 'dorsal_freeze';
  }
  if (has('chest_warm') && (has('floaty') || has('want_jump'))) {
    return 'ventral_regulated';
  }

  // Drink priors · used when body is sparse / skipped
  if (soup === 'spicy_ginger') return 'sympathetic_fire';
  if (soup === 'no_drink' || soup === 'bitter_tea') return 'dorsal_sad';
  if (soup === 'plain_water') return 'dorsal_freeze';
  if (soup === 'marble_soda') return 'sympathetic_anxious';
  if (soup === 'strawberry_milk' || soup === 'warm_milk') return 'ventral_regulated';

  return 'unspoken';
}
