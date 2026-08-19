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
  it('exposes bowl-spirit food invitation titles', () => {
    expect(wordingFor('lower').soup_title).toContain('碗星靈');
    expect(wordingFor('upper').soup_title).toContain('碗星靈');
    expect(wordingFor('adult').soup_title).toContain('碗星靈');
    expect(wordingFor('lower').soup_title).toContain('食');
    expect(wordingFor('upper').soup_title).toContain('食');
    expect(wordingFor('adult').soup_title).toContain('食');
    expect(wordingFor('lower').soup_offer_done('雪糕')).toContain('雪糕');
    expect(wordingFor('adult').soup_title).not.toBe(wordingFor('lower').soup_title);
    expect(wordingFor('lower').soup_title).not.toBe(wordingFor('upper').soup_title);
  });

  it('keeps bridge wording on 留意 tone (notify · not share content)', () => {
    expect(wordingFor('lower').bridge_by_state.sympathetic_fire).toBe(
      '返返靜咗未呀? 想唔想有人留意吓你?',
    );
    expect(wordingFor('upper').bridge_by_state.dorsal_sad).toBe(
      '而家冇咁重未? 想唔想有人留意吓你?',
    );
    expect(wordingFor('lower').bridge_eyebrow).toContain('留意');
    expect(wordingFor('lower').regulate_by_state.sympathetic_fire).toBe('同碗一齊發洩');
    expect(wordingFor('upper').regulate_by_state.dorsal_freeze).toBe('碗想搞醒你');
    expect(wordingFor('lower').release_done_title).toBe('你搞掂啦');
  });

  it('never surfaces internal ritual jargon like 過橋 in user copy', () => {
    for (const mode of ['lower', 'upper', 'adult'] as const) {
      const pack = wordingFor(mode);
      const blob = JSON.stringify(pack);
      expect(blob).not.toContain('過橋');
      expect(pack.bridge_eyebrow).not.toContain('過橋');
    }
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
