/**
 * Teacher follow-up cues from ritual check-ins (Scheme B).
 *
 * Rules (product):
 * - Positive (warm): ignore, EXCEPT explicit 「想老師留意」notify
 * - Negative: bowl size + handling (no after-check question)
 * - 「想老師留意」: notify only · no diary / emotion / size details
 * - 「想屋企留意」: separate from teacher notify (does not create teacher asks_help)
 * - 「蓋住放低」/「抱住留低」: only when intensity is L/XL
 * - Active release (倒/送/洗): no size-based alerts (healthy coping)
 * - 「少咗」+ active release: healthy · do not flag
 */

import {
  bowlSizeIndex,
  isBowlSize,
  type BowlSize,
} from '@/src/constants/bowl-size';
import type { BowlReleaseKey } from '@/src/constants/bowl-release';
import { EMOTION_BY_KEY, type EmotionCategory } from '@/src/constants/emotions';

const NEGATIVE_CATEGORIES: EmotionCategory[] = ['sad', 'nervous', 'wound', 'anger'];

const RELEASE_KEYS: BowlReleaseKey[] = [
  'empty',
  'set_aside',
  'send_away',
  'wash',
  'keep_hug',
];

export type TeacherFollowUpCue =
  | 'still_strong'
  | 'got_stronger'
  | 'got_lighter'
  | 'parked'
  | 'holding_on'
  | 'asks_help';

export type HandlingStance = 'parked' | 'holding' | 'releasing' | 'asks_adult' | 'unknown';

export const TEACHER_FOLLOW_UP_COPY: Record<
  TeacherFollowUpCue,
  { title: string; hint: string }
> = {
  still_strong: {
    title: '負面仲好強',
    hint: '碗大細顯示感覺仲好強烈 · 未見主動放下',
  },
  got_stronger: {
    title: '負面感覺多咗',
    hint: '碗大咗 · 感覺可能加重',
  },
  got_lighter: {
    title: '負面感覺少咗',
    hint: '碗細咗 · 未見主動放下 · 輕度留意',
  },
  parked: {
    title: '暫時放低 · 但仲好強',
    hint: '學生揀蓋住放低 · 同時碗大細偏大',
  },
  holding_on: {
    title: '抱住留低 · 仲好強',
    hint: '學生想留住呢份強烈負面感覺',
  },
  asks_help: {
    title: '可能要關注',
    hint: '學生想你留意吓 · 唔顯示其他資料',
  },
};

const CUE_PRIORITY: TeacherFollowUpCue[] = [
  'asks_help',
  'got_stronger',
  'still_strong',
  'holding_on',
  'parked',
  'got_lighter',
];

export function emotionCategoryOf(key: string | null | undefined): EmotionCategory | null {
  if (!key) return null;
  return EMOTION_BY_KEY[key]?.category ?? null;
}

export function isPositiveEmotion(key: string | null | undefined): boolean {
  return emotionCategoryOf(key) === 'warm';
}

export function isNegativeEmotion(key: string | null | undefined): boolean {
  const cat = emotionCategoryOf(key);
  return !!cat && NEGATIVE_CATEGORIES.includes(cat);
}

export function isBowlReleaseKey(value: unknown): value is BowlReleaseKey {
  return typeof value === 'string' && (RELEASE_KEYS as string[]).includes(value);
}

export function releaseKeyFromRegulation(
  keys: string[] | null | undefined,
): BowlReleaseKey | null {
  if (!keys?.length) return null;
  for (const raw of keys) {
    if (!raw.startsWith('release:')) continue;
    const key = raw.slice('release:'.length);
    if (isBowlReleaseKey(key)) return key;
  }
  return null;
}

export function handlingStanceOf(input: {
  releaseKey?: BowlReleaseKey | string | null;
  /** Teacher-notify opt-in only (not family) */
  notifyTeacher?: boolean;
  sharedWithClass?: boolean;
}): HandlingStance {
  if (input.notifyTeacher || input.sharedWithClass) return 'asks_adult';
  const key = isBowlReleaseKey(input.releaseKey) ? input.releaseKey : null;
  if (key === 'set_aside') return 'parked';
  if (key === 'keep_hug') return 'holding';
  if (key === 'empty' || key === 'send_away' || key === 'wash') return 'releasing';
  return 'unknown';
}

export type FollowUpEvaluation = {
  watch: boolean;
  cues: TeacherFollowUpCue[];
  cue: TeacherFollowUpCue | null;
  label: string | null;
  handling: HandlingStance;
  /** Teacher notify card must stay detail-free */
  notifyOnly: boolean;
};

export function evaluateNegativeBowlFollowUp(input: {
  emotionKey: string | null | undefined;
  size: BowlSize | string | null | undefined;
  previousSize?: BowlSize | string | null;
  releaseKey?: BowlReleaseKey | string | null;
  regulationKeys?: string[] | null;
  /** Explicit teacher-notify opt-in */
  notifyTeacher?: boolean;
  /** Alias for teacher notify · NOT family */
  sharedWithClass?: boolean;
  /**
   * Family opt-in is stored separately and must NOT create teacher asks_help.
   * Accepted only so callers do not accidentally wire it into notifyTeacher.
   */
  sharedWithFamily?: boolean;
}): FollowUpEvaluation {
  const releaseKey =
    (isBowlReleaseKey(input.releaseKey) ? input.releaseKey : null) ||
    releaseKeyFromRegulation(input.regulationKeys);

  // Family notify is intentionally excluded from teacher asks_help
  const notifyTeacher = !!(input.notifyTeacher || input.sharedWithClass);

  const handling = handlingStanceOf({
    releaseKey,
    notifyTeacher,
  });

  const empty: FollowUpEvaluation = {
    watch: false,
    cues: [],
    cue: null,
    label: null,
    handling,
    notifyOnly: false,
  };

  const cues: TeacherFollowUpCue[] = [];

  if (notifyTeacher) {
    cues.push('asks_help');
  }

  const negative = isNegativeEmotion(input.emotionKey);
  const positive = isPositiveEmotion(input.emotionKey);

  if (positive && !notifyTeacher) return empty;
  if (!negative && !notifyTeacher) return empty;

  if (negative) {
    const size: BowlSize = isBowlSize(input.size) ? input.size : 'M';
    const prev = isBowlSize(input.previousSize) ? input.previousSize : null;
    const idx = bowlSizeIndex(size);
    const strong = idx >= 2; // L / XL
    const isReleasing =
      releaseKey === 'empty' || releaseKey === 'send_away' || releaseKey === 'wash';
    const isParked = releaseKey === 'set_aside';
    const isHolding = releaseKey === 'keep_hug';

    // Active release = healthy coping · no size-based teacher alerts
    if (!isReleasing) {
      if (prev) {
        const prevIdx = bowlSizeIndex(prev);
        if (idx > prevIdx) {
          cues.push('got_stronger');
        } else if (idx < prevIdx) {
          cues.push('got_lighter');
        } else if (strong && !isParked && !isHolding) {
          // parked / holding already carry「仲好強」· avoid double-count
          cues.push('still_strong');
        }
      } else if (strong && !isParked && !isHolding) {
        cues.push('still_strong');
      }

      if (isParked && strong) cues.push('parked');
      if (isHolding && strong) cues.push('holding_on');
    }
  }

  const ordered = CUE_PRIORITY.filter((c) => cues.includes(c));
  if (ordered.length === 0) return empty;

  return {
    watch: true,
    cues: ordered,
    cue: ordered[0],
    label: TEACHER_FOLLOW_UP_COPY[ordered[0]].title,
    handling,
    notifyOnly: notifyTeacher,
  };
}

export const TEACHER_NOTIFY_ONLY_MESSAGE = '可能要關注呢位學生';

/** @deprecated */
export function needsTeacherFollowUp(size: BowlSize | string | null | undefined): boolean {
  return evaluateNegativeBowlFollowUp({
    emotionKey: 'sad',
    size,
  }).watch;
}
