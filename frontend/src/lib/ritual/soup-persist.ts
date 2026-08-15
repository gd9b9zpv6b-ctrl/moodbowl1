import type { SoupKey } from '@/src/constants/soups';

/**
 * Live DB still enforces the original soup check constraint:
 * hot_milk_tea | cold_lemon_tea | curry | plain_congee | sweet_soup | no_appetite
 *
 * App drinks are newer keys · map them so ritual saves succeed until
 * migration 006 widens the constraint.
 */
const SOUP_TO_DB: Record<SoupKey, string> = {
  strawberry_milk: 'sweet_soup',
  marble_soda: 'cold_lemon_tea',
  lemon_juice: 'cold_lemon_tea',
  spicy_ginger: 'curry',
  bitter_tea: 'plain_congee',
  warm_milk: 'hot_milk_tea',
  plain_water: 'plain_congee',
  no_drink: 'no_appetite',
};

const DB_ALLOWED = new Set(Object.values(SOUP_TO_DB));

/** Value safe to write into diaries.soup under the current check constraint. */
export function soupForDb(soup: string | null | undefined): string | null {
  if (!soup) return null;
  if (DB_ALLOWED.has(soup)) return soup;
  if (soup in SOUP_TO_DB) return SOUP_TO_DB[soup as SoupKey];
  return 'no_appetite';
}
