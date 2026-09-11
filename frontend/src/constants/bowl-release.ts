export type BowlReleaseKey =
  | 'empty'
  | 'set_aside'
  | 'send_away'
  | 'share'
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
  'share',
  'wash',
  'let_flow',
  'keep_hug',
];

/**
 * Symbolic actions · what to do with today's bowl after writing.
 * Copy is age-banded in wording packs.
 * `wash` and `set_aside` stay stored for historical rows but are not offered here.
 */
export const BOWL_RELEASE_ACTIONS: BowlReleaseDef[] = [
  { key: 'empty', emoji: '🌱' },
  { key: 'share', emoji: '✉️' },
  { key: 'send_away', emoji: '✈️' },
  { key: 'let_flow', emoji: '🌊' },
  { key: 'keep_hug', emoji: '🔒' },
];

/** Bury / envelope / send / stream (and retired wash) · healthy active release. */
export function isReleasingReleaseKey(
  key: BowlReleaseKey | string | null | undefined,
): boolean {
  return (
    key === 'empty' ||
    key === 'send_away' ||
    key === 'share' ||
    key === 'wash' ||
    key === 'let_flow'
  );
}

/**
 * Write attempts for `diaries.bowl_release`.
 * `let_flow` is new · live DBs that still have migration 007 reject it.
 * Fall back to retired `wash` (same releasing stance), then omit the column.
 */
export function bowlReleaseWriteAttempts(
  key: BowlReleaseKey | null | undefined,
): Array<BowlReleaseKey | null> {
  if (!key) return [null];
  if (key === 'let_flow') return ['let_flow', 'wash', null];
  if (key === 'share') return ['share', 'send_away', null];
  return [key, null];
}

export function isBowlReleaseConstraintError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  if (error.code === '23514') return message.includes('bowl_release');
  return (
    message.includes('bowl_release') &&
    (message.includes('check') || message.includes('violat') || message.includes('invalid'))
  );
}
