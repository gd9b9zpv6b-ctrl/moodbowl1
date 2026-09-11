import { describe, expect, it } from 'vitest';

import { washCaptionForProgress } from '../wash-shower';

describe('washCaptionForProgress', () => {
  it('wipes the screen, then the bowl showers, then it comes out clean', () => {
    expect(washCaptionForProgress(0)).toBe('洗乾淨個畫面……');
    expect(washCaptionForProgress(0.25)).toBe('入去沖涼房……');
    expect(washCaptionForProgress(0.55)).toBe('沖緊涼……');
    expect(washCaptionForProgress(0.9)).toBe('出返嚟 · 乾淨曬');
  });

  it('uses a gentler diary line when there is no bowl', () => {
    expect(washCaptionForProgress(0.25, true)).toBe('入去沖一沖……');
    expect(washCaptionForProgress(0.9, true)).toBe('出返嚟 · 清爽晒');
  });
});
