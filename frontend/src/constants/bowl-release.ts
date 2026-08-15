export type BowlReleaseKey =
  | 'empty'
  | 'set_aside'
  | 'send_away'
  | 'wash'
  | 'keep_hug';

export type BowlReleaseDef = {
  key: BowlReleaseKey;
  emoji: string;
};

/**
 * Symbolic actions · what to do with today's bowl after writing.
 * Copy is age-banded in wording packs.
 */
export const BOWL_RELEASE_ACTIONS: BowlReleaseDef[] = [
  { key: 'empty', emoji: '🥣' },
  { key: 'set_aside', emoji: '🫙' },
  { key: 'send_away', emoji: '🕊️' },
  { key: 'wash', emoji: '💧' },
  { key: 'keep_hug', emoji: '🤗' },
];
