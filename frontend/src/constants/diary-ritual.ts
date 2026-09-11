import type { BowlReleaseKey } from '@/src/constants/bowl-release';

export type DiaryRitualKey = 'release' | 'share' | 'garden' | 'lock' | 'later';

/**
 * Paper-folding diary endings from the animation preview.
 * Stored `bowl_release` keys stay stable for teacher follow-up + DB.
 *
 * `share` plays the envelope fold. Notify-teacher stays a separate switch
 * and does not send diary content.
 * `let_flow` (and retired `wash` rows) fold a paper boat, then drift on the creek.
 * Retired `set_aside` still maps to the drawer paper ritual for old rows.
 */
export const DIARY_RITUAL_FOR_RELEASE: Record<BowlReleaseKey, DiaryRitualKey | null> = {
  empty: 'garden',
  set_aside: 'later',
  send_away: 'release',
  share: 'share',
  wash: null,
  let_flow: null,
  keep_hug: 'lock',
};

export function diaryRitualForRelease(action: BowlReleaseKey): DiaryRitualKey | null {
  return DIARY_RITUAL_FOR_RELEASE[action];
}
