/** Timing + copy for the creek / paper-boat release. */

export const STREAM_DURATION_MS = 5200;

export function streamCaptionForProgress(progress: number, diaryMode = false): string {
  if (progress < 0.16) return diaryMode ? '摺成紙船……' : '輕輕放到水面……';
  if (progress < 0.42) return diaryMode ? '放入小河……' : '放入小河……';
  if (progress < 0.78) return '等佢自己漂走……';
  return diaryMode ? '紙船漂遠咗' : '漂遠咗 · 流水帶走';
}

/** New picker key, plus retired wash rows that still play this scene. */
export function usesStreamDriftScene(
  key: string | null | undefined,
): boolean {
  return key === 'let_flow' || key === 'wash';
}
