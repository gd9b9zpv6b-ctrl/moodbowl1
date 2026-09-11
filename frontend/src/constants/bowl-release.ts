export type BowlReleaseKey =
  | 'empty'
  | 'set_aside'
  | 'send_away'
  | 'wash'
  | 'let_flow'
  | 'keep_hug';

export type BowlReleaseDef = {
  key: BowlReleaseKey;
  emoji: string;
};

/**
 * Keys that may already sit in `diaries.bowl_release`.
 * Includes retired picker choices so old rows stay readable.
 */
export const STORED_BOWL_RELEASE_KEYS: readonly BowlReleaseKey[] = [
  'empty',
  'set_aside',
  'send_away',
  'wash',
  'let_flow',
  'keep_hug',
];

/**
 * Symbolic actions · what to do with today's bowl after writing.
 * Copy is age-banded in wording packs.
 * `wash` stays stored for historical rows but is not offered here.
 */
export const BOWL_RELEASE_ACTIONS: BowlReleaseDef[] = [
  { key: 'empty', emoji: '🌱' },
  { key: 'set_aside', emoji: '🗄️' },
  { key: 'send_away', emoji: '✈️' },
  { key: 'let_flow', emoji: '🌊' },
  { key: 'keep_hug', emoji: '🔒' },
];

/** Bury / send / stream (and retired wash) · healthy active release. */
export function isReleasingReleaseKey(
  key: BowlReleaseKey | string | null | undefined,
): boolean {
  return key === 'empty' || key === 'send_away' || key === 'wash' || key === 'let_flow';
}
