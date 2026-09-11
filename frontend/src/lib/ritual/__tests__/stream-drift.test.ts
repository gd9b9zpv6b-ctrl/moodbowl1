import { describe, expect, it } from 'vitest';

import {
  streamCaptionForProgress,
  streamPhaseForProgress,
  usesStreamDriftScene,
} from '../stream-drift';

describe('streamPhaseForProgress', () => {
  it('folds a boat before the craft starts drifting', () => {
    expect(streamPhaseForProgress(0)).toBe('page');
    expect(streamPhaseForProgress(0.28)).toBe('folding');
    expect(streamPhaseForProgress(0.46)).toBe('boat');
    expect(streamPhaseForProgress(0.7)).toBe('drifting');
  });
});

describe('streamCaptionForProgress', () => {
  it('names the fold first, then the drift', () => {
    expect(streamCaptionForProgress(0)).toBe('攤開一張紙……');
    expect(streamCaptionForProgress(0.28)).toBe('摺成一隻紙船……');
    expect(streamCaptionForProgress(0.46)).toBe('放入小河……');
    expect(streamCaptionForProgress(0.8)).toBe('紙船漂遠咗 · 流水帶走');
  });

  it('uses the diary page when there is no bowl', () => {
    expect(streamCaptionForProgress(0, true)).toBe('攤開呢頁……');
    expect(streamCaptionForProgress(0.28, true)).toBe('摺成一隻紙船……');
    expect(streamCaptionForProgress(0.8, true)).toBe('紙船漂遠咗');
  });
});

describe('usesStreamDriftScene', () => {
  it('plays for the new picker key and retired wash rows', () => {
    expect(usesStreamDriftScene('let_flow')).toBe(true);
    expect(usesStreamDriftScene('wash')).toBe(true);
    expect(usesStreamDriftScene('send_away')).toBe(false);
  });
});
