import { describe, expect, it } from 'vitest';

import { bowlSizeToEnergyLevel } from '@/src/constants/bowl-size';
import {
  evaluateNegativeBowlFollowUp,
  handlingStanceOf,
  isNegativeEmotion,
  isPositiveEmotion,
  releaseKeyFromRegulation,
  TEACHER_NOTIFY_ONLY_MESSAGE,
} from '@/src/lib/teacher-follow-up';

describe('bowl size energy mirror', () => {
  it('maps size to legacy energy_level', () => {
    expect(bowlSizeToEnergyLevel('S')).toBe(25);
    expect(bowlSizeToEnergyLevel('XL')).toBe(95);
  });
});

describe('teacher follow-up · product rules', () => {
  it('ignores positive without notify', () => {
    expect(isPositiveEmotion('happy')).toBe(true);
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'happy',
        size: 'XL',
        releaseKey: 'set_aside',
      }).watch,
    ).toBe(false);
  });

  it('flags positive when student asks teacher to notice (notify-only)', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'happy',
      size: 'M',
      notifyTeacher: true,
    });
    expect(r.watch).toBe(true);
    expect(r.cue).toBe('asks_help');
    expect(r.notifyOnly).toBe(true);
    expect(TEACHER_NOTIFY_ONLY_MESSAGE).toContain('關注');
  });

  it('treats sad / nervous / wound / anger as negative', () => {
    expect(isNegativeEmotion('sad')).toBe(true);
    expect(isNegativeEmotion('anxious')).toBe(true);
    expect(isNegativeEmotion('calm')).toBe(false);
  });

  it('flags strong negative size as 負面仲好強 (no after-check)', () => {
    const r = evaluateNegativeBowlFollowUp({ emotionKey: 'sad', size: 'L' });
    expect(r.watch).toBe(true);
    expect(r.cue).toBe('still_strong');
  });

  it('does not flag mild park alone', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'sad',
        size: 'S',
        releaseKey: 'set_aside',
      }).watch,
    ).toBe(false);
  });

  it('flags park only when size is still strong', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'XL',
      releaseKey: 'set_aside',
    });
    expect(r.cues).toContain('parked');
    expect(r.cues).toContain('still_strong');
  });

  it('skips 少咗 when student actively released', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'S',
        previousSize: 'L',
        releaseKey: 'wash',
      }).watch,
    ).toBe(false);
  });

  it('flags 少咗 when not actively releasing', () => {
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'angry',
        size: 'S',
        previousSize: 'L',
        releaseKey: 'keep_hug',
      }).cues,
    ).toEqual(expect.arrayContaining(['got_lighter', 'holding_on']));
  });

  it('prioritises notify · and marks notifyOnly', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'anxious',
      size: 'XL',
      previousSize: 'M',
      releaseKey: 'wash',
      sharedWithClass: true,
    });
    expect(r.cue).toBe('asks_help');
    expect(r.notifyOnly).toBe(true);
    expect(r.cues).toContain('got_stronger');
  });

  it('parses release from regulation keys', () => {
    expect(releaseKeyFromRegulation(['breath_4_7_8', 'release:send_away'])).toBe(
      'send_away',
    );
    expect(handlingStanceOf({ releaseKey: 'empty' })).toBe('releasing');
  });
});
