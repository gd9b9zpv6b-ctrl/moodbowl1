import type { BodyChipKey } from '@/src/constants/body-chips';
import type { SoupKey } from '@/src/constants/soups';

/**
 * Easy first taps after food · 3 familiar chips, not a full scan.
 * Keys stay inside the existing BODY_CHIPS set.
 */
const HINTS: Record<SoupKey, BodyChipKey[]> = {
  strawberry_milk: ['smile_wide', 'chest_warm', 'want_jump'],
  marble_soda: ['want_jump', 'heart_fast', 'shaky'],
  lemon_juice: ['teary', 'chest_tight', 'throat_tight'],
  spicy_ginger: ['heat_rising', 'fists_clench', 'jaw_clench'],
  bitter_tea: ['eyelids_heavy', 'no_appetite', 'curled_up'],
  warm_milk: ['chest_warm', 'soft_hands', 'floaty'],
  plain_water: ['brain_blank', 'head_heavy', 'floaty'],
  no_drink: ['no_appetite', 'curled_up', 'brain_blank'],
};

const FALLBACK: BodyChipKey[] = ['chest_warm', 'head_heavy', 'want_jump'];

export function suggestChipsForSoup(soup: SoupKey | null | undefined): BodyChipKey[] {
  if (!soup) return FALLBACK;
  return HINTS[soup] ?? FALLBACK;
}
