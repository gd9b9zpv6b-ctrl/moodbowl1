/**
 * Teacher follow-up cues from ritual check-ins (Scheme B, simplified).
 *
 * Positive (warm) emotions are ignored.
 * For negative emotions, teachers watch when the feeling:
 *   - still_hard  · 用完都冇好啲（仲係咁強 / 冇改善）
 *   - got_stronger · 負面感覺多咗（碗大咗）
 *   - got_lighter  · 負面感覺少咗（碗細咗 · 都可能要關心）
 */

import {
  bowlSizeIndex,
  isBowlSize,
  type BowlSize,
} from '@/src/constants/bowl-size';
import { EMOTION_BY_KEY, type EmotionCategory } from '@/src/constants/emotions';

const NEGATIVE_CATEGORIES: EmotionCategory[] = ['sad', 'nervous', 'wound', 'anger'];

export type TeacherFollowUpCue = 'still_hard' | 'got_stronger' | 'got_lighter';

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
};

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

export type FollowUpEvaluation = {
  watch: boolean;
  cue: TeacherFollowUpCue | null;
  label: string | null;
};

/**
 * Decide whether a check-in should surface on the teacher follow-up list.
 * Positive emotions always return watch:false.
 */
export function evaluateNegativeBowlFollowUp(input: {
  emotionKey: string | null | undefined;
  size: BowlSize | string | null | undefined;
  previousSize?: BowlSize | string | null;
}): FollowUpEvaluation {
  if (!isNegativeEmotion(input.emotionKey)) {
    return { watch: false, cue: null, label: null };
  }

  const size: BowlSize = isBowlSize(input.size) ? input.size : 'M';
  const prev = isBowlSize(input.previousSize) ? input.previousSize : null;
  const idx = bowlSizeIndex(size);

  if (prev) {
    const prevIdx = bowlSizeIndex(prev);
    if (idx > prevIdx) {
      return withCue('got_stronger');
    }
    if (idx < prevIdx) {
      return withCue('got_lighter');
    }
    // Same intensity · 「用完都冇好啲」when still clearly strong, or any same negative stay
    if (idx >= 2) {
      return withCue('still_hard');
    }
    return { watch: false, cue: null, label: null };
  }

  // First / no prior size · only flag strong negative intensity
  if (idx >= 2) {
    return withCue('still_hard');
  }
  return { watch: false, cue: null, label: null };
}

function withCue(cue: TeacherFollowUpCue): FollowUpEvaluation {
  return {
    watch: true,
    cue,
    label: TEACHER_FOLLOW_UP_COPY[cue].title,
  };
}

/** @deprecated use evaluateNegativeBowlFollowUp — size alone is not enough */
export function needsTeacherFollowUp(size: BowlSize | string | null | undefined): boolean {
  return evaluateNegativeBowlFollowUp({
    emotionKey: 'sad',
    size,
  }).watch;
}
