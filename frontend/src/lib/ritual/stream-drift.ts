/** Timing + copy for fold-a-boat, then let it drift. */

export const STREAM_DURATION_MS = 6800;

export type StreamPhase = 'page' | 'folding' | 'boat' | 'drifting';

export function streamPhaseForProgress(progress: number): StreamPhase {
  if (progress < 0.14) return 'page';
  if (progress < 0.42) return 'folding';
  if (progress < 0.52) return 'boat';
  return 'drifting';
}

export function streamCaptionForProgress(progress: number, diaryMode = false): string {
  const phase = streamPhaseForProgress(progress);
  if (phase === 'page') return diaryMode ? '攤開呢頁……' : '攤開一張紙……';
  if (phase === 'folding') return '摺成一隻紙船……';
  if (phase === 'boat') return '放入小河……';
  return diaryMode ? '紙船跟水慢慢走' : '紙船跟水慢慢走 · 流水帶走';
}

/** New picker key, plus retired wash rows that still play this scene. */
export function usesStreamDriftScene(
  key: string | null | undefined,
): boolean {
  return key === 'let_flow' || key === 'wash';
}
