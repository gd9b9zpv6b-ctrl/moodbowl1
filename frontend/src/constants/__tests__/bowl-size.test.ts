import { describe, expect, it } from 'vitest';

import { bowlSizeToEnergyLevel } from '@/src/constants/bowl-size';
import {
  evaluateNegativeBowlFollowUp,
  handlingStanceOf,
  isNegativeEmotion,
  TEACHER_NOTIFY_ONLY_MESSAGE,
} from '@/src/lib/teacher-follow-up';

describe('bowl size energy mirror', () => {
  it('maps size to legacy energy_level', () => {
    expect(bowlSizeToEnergyLevel('S')).toBe(25);
    expect(bowlSizeToEnergyLevel('XL')).toBe(95);
  });
});

describe('teacher follow-up · aligned rules', () => {
  it('ignores positive without teacher notify', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'happy',
        size: 'XL',
        releaseKey: 'set_aside',
      }).watch,
    ).toBe(false);
  });

  it('flags positive when student asks teacher to notice', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'happy',
      size: 'M',
      notifyTeacher: true,
    });
    expect(r.cue).toBe('asks_help');
    expect(r.notifyOnly).toBe(true);
    expect(TEACHER_NOTIFY_ONLY_MESSAGE).toContain('關注');
  });

  it('does not treat family opt-in as teacher notify', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'sad',
        size: 'S',
        sharedWithFamily: true,
      }).watch,
    ).toBe(false);
    expect(handlingStanceOf({ sharedWithClass: false, releaseKey: 'wash' })).toBe(
      'releasing',
    );
  });

  it('flags strong negative without release as 負面仲好強', () => {
    expect(
      evaluateNegativeBowlFollowUp({ emotionKey: 'sad', size: 'L' }).cue,
    ).toBe('still_strong');
  });

  it('skips size alerts when student actively released', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'XL',
        releaseKey: 'let_flow',
      }).watch,
    ).toBe(false);
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'XL',
        previousSize: 'M',
        releaseKey: 'send_away',
      }).watch,
    ).toBe(false);
  });

  it('does not flag mild park or mild hold', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'sad',
        size: 'S',
        releaseKey: 'set_aside',
      }).watch,
    ).toBe(false);
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'sad',
        size: 'M',
        releaseKey: 'keep_hug',
      }).watch,
    ).toBe(false);
  });

  it('flags park / hold only when still strong · without double-counting still_strong', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'sad',
        size: 'XL',
        releaseKey: 'set_aside',
      }).cues,
    ).toEqual(['parked']);

    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'lonely',
        size: 'L',
        releaseKey: 'keep_hug',
      }).cues,
    ).toEqual(['holding_on']);
  });

  it('flags 少咗 only when not actively releasing', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'S',
        previousSize: 'L',
        releaseKey: 'keep_hug',
      }).cues,
    ).toContain('got_lighter');

    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'S',
        previousSize: 'L',
        releaseKey: 'empty',
      }).watch,
    ).toBe(false);
  });

  it('treats negative categories correctly', () => {
    expect(isNegativeEmotion('anxious')).toBe(true);
    expect(isNegativeEmotion('calm')).toBe(false);
  });
});
