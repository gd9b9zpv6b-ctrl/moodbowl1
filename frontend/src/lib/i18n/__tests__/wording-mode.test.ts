import { describe, expect, it } from 'vitest';

import { BODY_CHIPS, BODY_REGIONS } from '@/src/constants/body-chips';
import { resolveWordingMode, wordingFor, wordingModeLabel } from '@/src/lib/i18n/wording-mode';

describe('resolveWordingMode', () => {
  it('uses adult for teacher / counsellor / parent / school_admin', () => {
    expect(resolveWordingMode({ role: 'teacher' })).toBe('adult');
    expect(resolveWordingMode({ role: 'counsellor' })).toBe('adult');
    expect(resolveWordingMode({ role: 'parent' })).toBe('adult');
    expect(resolveWordingMode({ role: 'school_admin' })).toBe('adult');
  });

  it('uses minor band for students', () => {
    expect(resolveWordingMode({ role: 'student', minorBand: 'lower' })).toBe('lower');
    expect(resolveWordingMode({ role: 'student', minorBand: 'upper' })).toBe('upper');
    expect(resolveWordingMode({ role: 'student' })).toBe('upper');
  });
});

describe('wording packs', () => {
  it('exposes bowl-spirit drink invitation titles', () => {
    expect(wordingFor('lower').soup_title).toContain('碗星靈');
    expect(wordingFor('upper').soup_title).toContain('碗星靈');
    expect(wordingFor('adult').soup_title).toContain('碗星靈');
    expect(wordingFor('lower').soup_offer_done('草莓牛奶')).toContain('草莓牛奶');
    expect(wordingFor('adult').soup_title).not.toBe(wordingFor('lower').soup_title);
  });

  it('covers every body chip and region label', () => {
    for (const mode of ['lower', 'upper', 'adult'] as const) {
      const pack = wordingFor(mode);
      for (const chip of BODY_CHIPS) {
        expect(pack.chip_labels[chip.key]?.length).toBeGreaterThan(0);
      }
      for (const region of BODY_REGIONS) {
        expect(pack.region_labels[region.key]?.length).toBeGreaterThan(0);
      }
      expect(pack.body_vessel.length).toBeGreaterThan(0);
    }
  });

  it('labels modes for profile UI', () => {
    expect(wordingModeLabel('lower')).toContain('P1');
    expect(wordingModeLabel('upper')).toContain('P4');
    expect(wordingModeLabel('adult')).toContain('Adult');
  });
});
