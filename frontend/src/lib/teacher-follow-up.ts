/**
 * Teacher follow-up cues from ritual check-ins (Scheme B).
 *
 * Rules (product):
 * - Positive (warm): ignore, EXCEPT explicit 「想老師留意」notify
 * - Negative: use bowl size + handling choice (no after-check question)
 * - 「想老師留意」: notify only · no diary / emotion / size details in that alert
 * - 「蓋住放低」: only watch when intensity is L/XL (respect mild park)
 * - 「少咗」+ active release (倒/送/洗): treat as healthy · do not flag
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
  | 'still_strong' // was still_hard · 負面仲好強 (size L/XL or stayed strong)
  | 'got_stronger'
  | 'got_lighter'
  | 'parked'
  | 'holding_on'
  | 'asks_help';

/** How the student chose to handle today's feeling (from release screen). */
export type HandlingStance = 'parked' | 'holding' | 'releasing' | 'asks_adult' | 'unknown';

export const TEACHER_FOLLOW_UP_COPY: Record<
  TeacherFollowUpCue,
  { title: string; hint: string }
> = {
  still_strong: {
    title: '負面仲好強',
    hint: '碗大細顯示感覺仲好強烈',
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
    title: '抱住留低',
    hint: '學生想留住呢份負面感覺',
  },
  asks_help: {
    title: '可能要關注',
    hint: '學生想你留意吓 · 唔顯示其他資料',
  },
};

/** Cue priority when several fire at once (highest first). */
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
  /** Student opted in · notify teacher to pay attention (no content) */
  notifyTeacher?: boolean;
  sharedWithClass?: boolean;
  sharedWithFamily?: boolean;
}): HandlingStance {
  if (input.notifyTeacher || input.sharedWithClass || input.sharedWithFamily) {
    return 'asks_adult';
  }
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
  /**
   * When true, teacher UI must show only 「可能要關注」—
   * no emotion / size / release details for this notify path.
   */
  notifyOnly: boolean;
};

/**
 * Decide whether a check-in should surface on the teacher follow-up list.
 */
export function evaluateNegativeBowlFollowUp(input: {
  emotionKey: string | null | undefined;
  size: BowlSize | string | null | undefined;
  previousSize?: BowlSize | string | null;
  releaseKey?: BowlReleaseKey | string | null;
  regulationKeys?: string[] | null;
  /** Explicit teacher-notify opt-in (preferred name) */
  notifyTeacher?: boolean;
  /** @deprecated alias · same as notifyTeacher / shared_with_class flag */
  sharedWithClass?: boolean;
  sharedWithFamily?: boolean;
}): FollowUpEvaluation {
  const releaseKey =
    (isBowlReleaseKey(input.releaseKey) ? input.releaseKey : null) ||
    releaseKeyFromRegulation(input.regulationKeys);

  const notifyTeacher = !!(
    input.notifyTeacher ||
    input.sharedWithClass ||
    input.sharedWithFamily
  );

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

  // Explicit notify · always watch · and mark notify-only (no extra payload)
  if (notifyTeacher) {
    cues.push('asks_help');
  }

  const negative = isNegativeEmotion(input.emotionKey);
  const positive = isPositiveEmotion(input.emotionKey);

  // Positive: only the notify path counts
  if (positive && !notifyTeacher) {
    return empty;
  }
  if (!negative && !notifyTeacher) {
    return empty;
  }

  if (negative) {
    const size: BowlSize = isBowlSize(input.size) ? input.size : 'M';
    const prev = isBowlSize(input.previousSize) ? input.previousSize : null;
    const idx = bowlSizeIndex(size);
    const strong = idx >= 2; // L / XL
    const isReleasing =
      releaseKey === 'empty' || releaseKey === 'send_away' || releaseKey === 'wash';
    const isParked = releaseKey === 'set_aside' || handling === 'parked';
    const isHolding = releaseKey === 'keep_hug' || handling === 'holding';

    // Intensity trend from bowl size (no after-check question)
    if (prev) {
      const prevIdx = bowlSizeIndex(prev);
      if (idx > prevIdx) {
        cues.push('got_stronger');
      } else if (idx < prevIdx) {
        // 少咗 + 主動放下 = healthy · skip
        if (!isReleasing) {
          cues.push('got_lighter');
        }
      } else if (strong) {
        cues.push('still_strong');
      }
    } else if (strong) {
      cues.push('still_strong');
    }

    // 蓋住放低 · only when still strong (respect mild park)
    if (isParked && strong) {
      cues.push('parked');
    }

    // 抱住留低 negative · watch
    if (isHolding) {
      cues.push('holding_on');
    }
  }

  const ordered = CUE_PRIORITY.filter((c) => cues.includes(c));
  if (ordered.length === 0) {
    return empty;
  }

  const notifyOnly = ordered[0] === 'asks_help' || (notifyTeacher && ordered.includes('asks_help'));

  return {
    watch: true,
    cues: ordered,
    cue: ordered[0],
    label: TEACHER_FOLLOW_UP_COPY[ordered[0]].title,
    handling,
    // If student asked for attention, the notify card itself stays detail-free.
    // Other automated cues may still appear in aggregate reports.
    notifyOnly: notifyTeacher,
  };
}

/** Minimal teacher-facing line for the notify-only path. */
export const TEACHER_NOTIFY_ONLY_MESSAGE = '可能要關注呢位學生';

/** @deprecated */
export function needsTeacherFollowUp(size: BowlSize | string | null | undefined): boolean {
  return evaluateNegativeBowlFollowUp({
    emotionKey: 'sad',
    size,
  }).watch;
}
