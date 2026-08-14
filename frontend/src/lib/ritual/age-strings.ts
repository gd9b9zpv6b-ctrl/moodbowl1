/**
 * Age-band helpers — backed by the three wording packs (lower / upper / adult).
 * Prefer wordingFor() from @/src/lib/i18n/wording-mode for new call sites.
 */
import { wordingFor, type WordingMode } from '@/src/lib/i18n/wording-mode';

export type AgeGroup = 'lower' | 'upper' | 'adult';

export function soupTitleForAge(ageGroup: AgeGroup): string {
  return wordingFor(ageGroup as WordingMode).soup_title;
}

export function bodyTitleForAge(ageGroup: AgeGroup): string {
  return wordingFor(ageGroup as WordingMode).body_title;
}

export function pickTitleForAge(ageGroup: AgeGroup): string {
  return wordingFor(ageGroup as WordingMode).pick_title;
}

export function diaryPlaceholderForAge(ageGroup: AgeGroup): string {
  return wordingFor(ageGroup as WordingMode).talk_placeholder;
}
