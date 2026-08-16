import { describe, expect, it } from 'vitest';

import {
  bowlSizeMeta,
  bowlSizeToEnergyLevel,
  needsTeacherFollowUp,
} from '@/src/constants/bowl-size';

describe('bowl size · teacher follow-up signal (Scheme B)', () => {
  it('maps size to legacy energy_level', () => {
    expect(bowlSizeToEnergyLevel('S')).toBe(25);
    expect(bowlSizeToEnergyLevel('M')).toBe(50);
    expect(bowlSizeToEnergyLevel('L')).toBe(75);
    expect(bowlSizeToEnergyLevel('XL')).toBe(95);
    expect(bowlSizeToEnergyLevel(null)).toBe(50);
  });

  it('flags L and XL for teacher follow-up', () => {
    expect(needsTeacherFollowUp('S')).toBe(false);
    expect(needsTeacherFollowUp('M')).toBe(false);
    expect(needsTeacherFollowUp('L')).toBe(true);
    expect(needsTeacherFollowUp('XL')).toBe(true);
  });

  it('exposes teacher-facing hints without kid jargon', () => {
    expect(bowlSizeMeta('XL').teacherHint).toContain('跟進');
    expect(bowlSizeMeta('S').hint).toBe('淡淡地');
  });
});
