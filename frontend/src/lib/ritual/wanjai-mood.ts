import type { BodyChipKey } from '@/src/constants/body-chips';

export type WanjaiMood = 'neutral' | 'anxious' | 'warm' | 'heavy' | 'fiery';

const FIRE_CHIPS: BodyChipKey[] = [
  'fists_clench',
  'jaw_clench',
  'breath_fast',
  'heat_rising',
  'body_tense',
  'face_flush',
];
const ANXIOUS_CHIPS: BodyChipKey[] = [
  'sweaty_palms',
  'shaky',
  'need_toilet',
  'belly_full',
  'heart_fast',
];
const HEAVY_CHIPS: BodyChipKey[] = [
  'teary',
  'curled_up',
  'no_appetite',
  'throat_tight',
  'chest_tight',
  'shoulders_heavy',
  'eyelids_heavy',
  'head_heavy',
  'brain_blank',
  'soft_hands',
];
const WARM_CHIPS: BodyChipKey[] = [
  'chest_warm',
  'want_jump',
  'smile_wide',
  'eyes_bright',
];

function countHits(selected: BodyChipKey[], keys: BodyChipKey[]) {
  return selected.filter((k) => keys.includes(k)).length;
}

/**
 * Soft stage mood from somatic chips · base 碗仔 art stays blank (no face).
 * Decorations (💧 ⭐ …) carry the feeling on top.
 */
export function resolveWanjaiMood(selected: BodyChipKey[]): WanjaiMood {
  if (selected.length === 0) return 'neutral';
  const fire = countHits(selected, FIRE_CHIPS);
  const anxious = countHits(selected, ANXIOUS_CHIPS);
  const heavy = countHits(selected, HEAVY_CHIPS);
  const warm = countHits(selected, WARM_CHIPS);
  const ranked: { mood: WanjaiMood; n: number }[] = [
    { mood: 'fiery', n: fire },
    { mood: 'anxious', n: anxious },
    { mood: 'heavy', n: heavy },
    { mood: 'warm', n: warm },
  ].sort((a, b) => b.n - a.n);
  return ranked[0].n > 0 ? ranked[0].mood : 'neutral';
}
