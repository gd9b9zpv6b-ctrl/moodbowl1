/** Timing + copy for the wash shower ritual. Stored release key stays `wash`. */

export const WASH_DURATION_MS = 5400;

export function washCaptionForProgress(progress: number, diaryMode = false): string {
  if (progress < 0.16) return '洗乾淨個畫面……';
  if (progress < 0.4) return diaryMode ? '入去沖一沖……' : '入去沖涼房……';
  if (progress < 0.72) return diaryMode ? '沖走殘留……' : '沖緊涼……';
  return diaryMode ? '出返嚟 · 清爽晒' : '出返嚟 · 乾淨曬';
}
