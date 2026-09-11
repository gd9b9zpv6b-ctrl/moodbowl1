import type { BowlReleaseKey } from '@/src/constants/bowl-release';

export type DiaryRitualKey = 'release' | 'share' | 'garden' | 'lock' | 'later';

/**
 * Paper-folding diary endings from the animation preview.
 * Stored `bowl_release` keys stay stable for teacher follow-up + DB.
 *
 * `share` (envelope) is reserved for a future send-to-adult flow —
 * notify-teacher is a switch, not a release ending.
 * `let_flow` (and retired `wash` rows) play the creek scene, not paper folding.
 */
export const DIARY_RITUAL_FOR_RELEASE: Record<BowlReleaseKey, DiaryRitualKey | null> = {
  empty: 'garden',
  set_aside: 'later',
  send_away: 'release',
  wash: null,
  let_flow: null,
  keep_hug: 'lock',
};

export function diaryRitualForRelease(action: BowlReleaseKey): DiaryRitualKey | null {
  return DIARY_RITUAL_FOR_RELEASE[action];
}
