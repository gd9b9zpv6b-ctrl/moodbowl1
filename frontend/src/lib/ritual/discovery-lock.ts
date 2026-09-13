import type { EmotionCategory } from '@/src/constants/emotions';

/** First play in this diary wins. Later taps cannot steal the lock. */
export function lockDiscoveryCategory(
  current: EmotionCategory | null | undefined,
  next: EmotionCategory,
): EmotionCategory {
  return current ?? next;
}

/** Unstarted diaries can switch games. After a play, only the locked game stays. */
export function canSwitchDiscovery(
  locked: EmotionCategory | null | undefined,
  next: EmotionCategory,
): boolean {
  return !locked || locked === next;
}
