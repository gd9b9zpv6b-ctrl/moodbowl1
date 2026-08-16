import { describe, expect, it } from 'vitest';

import { bowlSizeToEnergyLevel } from '@/src/constants/bowl-size';
import {
  evaluateNegativeBowlFollowUp,
  isNegativeEmotion,
  isPositiveEmotion,
} from '@/src/lib/teacher-follow-up';

describe('bowl size energy mirror', () => {
  it('maps size to legacy energy_level', () => {
    expect(bowlSizeToEnergyLevel('S')).toBe(25);
    expect(bowlSizeToEnergyLevel('M')).toBe(50);
    expect(bowlSizeToEnergyLevel('L')).toBe(75);
    expect(bowlSizeToEnergyLevel('XL')).toBe(95);
  });
});

describe('teacher follow-up · negative only', () => {
  it('ignores positive emotions even at XL', () => {
    expect(isPositiveEmotion('happy')).toBe(true);
    expect(
      evaluateNegativeBowlFollowUp({ emotionKey: 'happy', size: 'XL' }).watch,
    ).toBe(false);
  });

  it('treats sad / nervous / wound / anger as negative', () => {
    expect(isNegativeEmotion('sad')).toBe(true);
    expect(isNegativeEmotion('anxious')).toBe(true);
    expect(isNegativeEmotion('hopeless')).toBe(true);
    expect(isNegativeEmotion('angry')).toBe(true);
    expect(isNegativeEmotion('calm')).toBe(false);
  });

  it('flags strong negative with no prior size as 用完仲未好', () => {
    const r = evaluateNegativeBowlFollowUp({ emotionKey: 'sad', size: 'L' });
    expect(r.watch).toBe(true);
    expect(r.cue).toBe('still_hard');
  });

  it('does not flag mild negative alone', () => {
    expect(
      evaluateNegativeBowlFollowUp({ emotionKey: 'sad', size: 'S' }).watch,
    ).toBe(false);
  });

  it('flags 多咗 / 少咗 when size changes on negative emotions', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'anxious',
        size: 'XL',
        previousSize: 'M',
      }).cue,
    ).toBe('got_stronger');

    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'S',
        previousSize: 'L',
      }).cue,
    ).toBe('got_lighter');
  });

  it('flags same strong negative as 用完仲未好', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'lonely',
        size: 'L',
        previousSize: 'L',
      }).cue,
    ).toBe('still_hard');
  });
});
