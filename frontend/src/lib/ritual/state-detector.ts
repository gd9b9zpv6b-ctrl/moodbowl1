import type { BodyChipKey } from '@/src/constants/body-chips';
import type { SoupKey } from '@/src/constants/soups';

export type NSState =
  | 'sympathetic_fire'
  | 'dorsal_sad'
  | 'dorsal_freeze'
  | 'sympathetic_anxious'
  | 'ventral_regulated'
  | 'unspoken';

const ANGER_CHIPS: BodyChipKey[] = [
  'fists_clench',
  'jaw_clench',
  'breath_fast',
  'heat_rising',
  'body_tense',
];

const ANXIETY_CHIPS: BodyChipKey[] = [
  'sweaty_palms',
  'shaky',
  'need_toilet',
  'belly_full',
  'heart_fast',
];

const SAD_CHIPS: BodyChipKey[] = [
  'teary',
  'curled_up',
  'no_appetite',
  'throat_tight',
  'chest_tight',
  'shoulders_heavy',
];

const FATIGUE_CHIPS: BodyChipKey[] = [
  'eyelids_heavy',
  'head_heavy',
  'brain_blank',
  'soft_hands',
];

const JOY_CHIPS: BodyChipKey[] = [
  'chest_warm',
  'want_jump',
  'smile_wide',
  'eyes_bright',
];

/**
 * Body chips clarify ambiguous food choices (e.g. ice cream while sad).
 * Interoceptive signals are checked before food priors.
 */
export function detectState(soup: SoupKey | null, chips: BodyChipKey[]): NSState {
  const has = (key: BodyChipKey) => chips.includes(key);
  const anyOf = (keys: BodyChipKey[]) => keys.some(has);
  const countOf = (keys: BodyChipKey[]) => keys.filter(has).length;

  // Body-first · clarification over craving metaphor
  if (has('teary') || has('curled_up') || has('no_appetite')) {
    return 'dorsal_sad';
  }

  // Anger cluster · fists / jaw / heat / tense
  if (
    anyOf(ANGER_CHIPS) ||
    (has('face_flush') && (has('heart_fast') || has('breath_fast'))) ||
    (has('heart_fast') && has('chest_tight'))
  ) {
    return 'sympathetic_fire';
  }

  // Anxiety · palms / shake / toilet / belly butterflies / heart
  if (anyOf(ANXIETY_CHIPS)) {
    return 'sympathetic_anxious';
  }

  // Joy / regulated before fatigue (floaty can pair with warm)
  if (countOf(JOY_CHIPS) >= 1 || (has('chest_warm') && has('floaty'))) {
    return 'ventral_regulated';
  }

  // Sad pressure / heavy shoulders
  if (anyOf(SAD_CHIPS)) {
    return 'dorsal_sad';
  }

  // Fatigue / freeze · heavy lids, blank mind, soft body
  if (anyOf(FATIGUE_CHIPS) || has('floaty')) {
    return 'dorsal_freeze';
  }

  // Drink priors · used when body is sparse / skipped
  if (soup === 'spicy_ginger') return 'sympathetic_fire';
  if (soup === 'no_drink' || soup === 'bitter_tea') return 'dorsal_sad';
  if (soup === 'plain_water') return 'dorsal_freeze';
  if (soup === 'marble_soda') return 'sympathetic_anxious';
  if (soup === 'strawberry_milk' || soup === 'warm_milk') return 'ventral_regulated';

  return 'unspoken';
}
