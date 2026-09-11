import { describe, expect, it } from 'vitest';

import {
  streamCaptionForProgress,
  usesStreamDriftScene,
} from '../stream-drift';

describe('streamCaptionForProgress', () => {
  it('walks the bowl from the bank to drifting away', () => {
    expect(streamCaptionForProgress(0)).toBe('輕輕放到水面……');
    expect(streamCaptionForProgress(0.25)).toBe('放入小河……');
    expect(streamCaptionForProgress(0.55)).toBe('等佢自己漂走……');
    expect(streamCaptionForProgress(0.9)).toBe('漂遠咗 · 流水帶走');
  });

  it('uses a paper-boat line in diary mode', () => {
    expect(streamCaptionForProgress(0, true)).toBe('摺成紙船……');
    expect(streamCaptionForProgress(0.25, true)).toBe('放入小河……');
    expect(streamCaptionForProgress(0.9, true)).toBe('紙船漂遠咗');
  });
});

describe('usesStreamDriftScene', () => {
  it('plays for the new picker key and retired wash rows', () => {
    expect(usesStreamDriftScene('let_flow')).toBe(true);
    expect(usesStreamDriftScene('wash')).toBe(true);
    expect(usesStreamDriftScene('send_away')).toBe(false);
  });
});
