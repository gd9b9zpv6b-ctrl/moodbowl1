import { describe, expect, it } from 'vitest';

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
  it('exposes distinct soup titles per mode', () => {
    expect(wordingFor('lower').soup_title).not.toBe(wordingFor('adult').soup_title);
    expect(wordingFor('upper').soup_title).not.toBe(wordingFor('adult').soup_title);
  });

  it('labels modes for profile UI', () => {
    expect(wordingModeLabel('lower')).toContain('P1');
    expect(wordingModeLabel('upper')).toContain('P4');
    expect(wordingModeLabel('adult')).toContain('Adult');
  });
});
