import { describe, expect, it } from 'vitest';

import { BODY_CHIPS, BODY_CHIP_BY_KEY } from '@/src/constants/body-chips';

describe('body chip regions', () => {
  it('puts face / mouth / throat chips on head', () => {
    expect(BODY_CHIP_BY_KEY.smile_wide.region).toBe('head');
    expect(BODY_CHIP_BY_KEY.face_flush.region).toBe('head');
    expect(BODY_CHIP_BY_KEY.jaw_clench.region).toBe('head');
    expect(BODY_CHIP_BY_KEY.teary.region).toBe('head');
    expect(BODY_CHIP_BY_KEY.throat_tight.region).toBe('head');
  });

  it('puts shoulders with chest, not hands', () => {
    expect(BODY_CHIP_BY_KEY.shoulders_heavy.region).toBe('chest');
    expect(BODY_CHIP_BY_KEY.heart_fast.region).toBe('chest');
  });

  it('keeps belly / hands / legs coherent', () => {
    expect(BODY_CHIP_BY_KEY.belly_full.region).toBe('belly');
    expect(BODY_CHIP_BY_KEY.fists_clench.region).toBe('hands');
    expect(BODY_CHIP_BY_KEY.want_jump.region).toBe('whole');
    expect(BODY_CHIP_BY_KEY.curled_up.region).toBe('whole');
  });

  it('does not leave smile on legs/whole', () => {
    expect(BODY_CHIPS.find((c) => c.key === 'smile_wide')?.region).not.toBe('whole');
  });
});
