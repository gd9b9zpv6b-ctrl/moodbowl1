/**
 * Teacher follow-up cues from ritual check-ins (Scheme B, simplified).
 *
 * Positive (warm) emotions are ignored.
 *
 * For negative emotions, combine:
 *   1) intensity trend — 仲未好 / 多咗 / 少咗
 *   2) how the student wants to handle it — release action + share-to-adult
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
  | 'still_hard'
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
  still_hard: {
    title: '用完仲未好',
    hint: '負面情緒仲喺 · 強度冇明顯放鬆',
  },
  got_stronger: {
    title: '負面感覺多咗',
    hint: '碗大咗 · 感覺可能加重',
  },
  got_lighter: {
    title: '負面感覺少咗',
    hint: '碗細咗 · 都可能要關心一下',
  },
  parked: {
    title: '暫時唔處理',
    hint: '學生揀咗蓋住放低 · 想遲啲先算',
  },
  holding_on: {
    title: '抱住留低',
    hint: '學生想留住呢份感覺 · 負面時值得留意',
  },
  asks_help: {
    title: '想話俾大人聽',
    hint: '學生主動想話俾老師 / 屋企人聽',
  },
};

/** Cue priority when several fire at once (highest first). */
const CUE_PRIORITY: TeacherFollowUpCue[] = [
  'asks_help',
  'parked',
  'holding_on',
  'got_stronger',
  'still_hard',
  'got_lighter',
];

export function emotionCategoryOf(key: string | null | undefined): EmotionCategory | null {
  if (!key) return null;
  return EMOTION_BY_KEY[key]?.category ?? null;
}

/** 溫暖／正面 — 老師報告唔使為呢啲跟進 */
export function isPositiveEmotion(key: string | null | undefined): boolean {
  return emotionCategoryOf(key) === 'warm';
}

/** 傷心／緊張／傷口／憤怒 — 跟進訊號只睇呢啲 */
export function isNegativeEmotion(key: string | null | undefined): boolean {
  const cat = emotionCategoryOf(key);
  return !!cat && NEGATIVE_CATEGORIES.includes(cat);
}

export function isBowlReleaseKey(value: unknown): value is BowlReleaseKey {
  return typeof value === 'string' && (RELEASE_KEYS as string[]).includes(value);
}

/** Parse `release:set_aside` style keys from regulation history. */
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
  sharedWithClass?: boolean;
  sharedWithFamily?: boolean;
}): HandlingStance {
  if (input.sharedWithClass || input.sharedWithFamily) return 'asks_adult';
  const key = isBowlReleaseKey(input.releaseKey) ? input.releaseKey : null;
  if (key === 'set_aside') return 'parked';
  if (key === 'keep_hug') return 'holding';
  if (key === 'empty' || key === 'send_away' || key === 'wash') return 'releasing';
  return 'unknown';
}

export type FollowUpEvaluation = {
  watch: boolean;
  /** All matching cues · ordered by teacher priority */
  cues: TeacherFollowUpCue[];
  /** Highest-priority cue · or null */
  cue: TeacherFollowUpCue | null;
  label: string | null;
  handling: HandlingStance;
};

/**
 * Decide whether a check-in should surface on the teacher follow-up list.
 * Positive emotions always return watch:false.
 */
export function evaluateNegativeBowlFollowUp(input: {
  emotionKey: string | null | undefined;
  size: BowlSize | string | null | undefined;
  previousSize?: BowlSize | string | null;
  releaseKey?: BowlReleaseKey | string | null;
  /** Prefer explicit releaseKey; else parse from regulation activity keys */
  regulationKeys?: string[] | null;
  sharedWithClass?: boolean;
  sharedWithFamily?: boolean;
}): FollowUpEvaluation {
  const releaseKey =
    (isBowlReleaseKey(input.releaseKey) ? input.releaseKey : null) ||
    releaseKeyFromRegulation(input.regulationKeys);

  const handling = handlingStanceOf({
    releaseKey,
    sharedWithClass: input.sharedWithClass,
    sharedWithFamily: input.sharedWithFamily,
  });

  const empty: FollowUpEvaluation = {
    watch: false,
    cues: [],
    cue: null,
    label: null,
    handling,
  };

  if (!isNegativeEmotion(input.emotionKey)) {
    return empty;
  }

  const cues: TeacherFollowUpCue[] = [];

  // --- How they want to handle it ---
  if (handling === 'asks_adult') {
    cues.push('asks_help');
  }
  if (handling === 'parked' || releaseKey === 'set_aside') {
    cues.push('parked');
  }
  if (handling === 'holding' || releaseKey === 'keep_hug') {
    cues.push('holding_on');
  }

  // --- Intensity trend ---
  const size: BowlSize = isBowlSize(input.size) ? input.size : 'M';
  const prev = isBowlSize(input.previousSize) ? input.previousSize : null;
  const idx = bowlSizeIndex(size);

  if (prev) {
    const prevIdx = bowlSizeIndex(prev);
    if (idx > prevIdx) cues.push('got_stronger');
    else if (idx < prevIdx) cues.push('got_lighter');
    else if (idx >= 2) cues.push('still_hard');
  } else if (idx >= 2) {
    cues.push('still_hard');
  }

  const ordered = CUE_PRIORITY.filter((c) => cues.includes(c));
  if (ordered.length === 0) {
    return empty;
  }

  return {
    watch: true,
    cues: ordered,
    cue: ordered[0],
    label: TEACHER_FOLLOW_UP_COPY[ordered[0]].title,
    handling,
  };
}

/** @deprecated use evaluateNegativeBowlFollowUp — size alone is not enough */
export function needsTeacherFollowUp(size: BowlSize | string | null | undefined): boolean {
  return evaluateNegativeBowlFollowUp({
    emotionKey: 'sad',
    size,
  }).watch;
}
