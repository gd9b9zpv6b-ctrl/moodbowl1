import { describe, expect, it } from 'vitest';

import { bowlSizeToEnergyLevel } from '@/src/constants/bowl-size';
import {
  evaluateNegativeBowlFollowUp,
  handlingStanceOf,
  isNegativeEmotion,
  isPositiveEmotion,
  releaseKeyFromRegulation,
} from '@/src/lib/teacher-follow-up';

describe('bowl size energy mirror', () => {
  it('maps size to legacy energy_level', () => {
    expect(bowlSizeToEnergyLevel('S')).toBe(25);
    expect(bowlSizeToEnergyLevel('M')).toBe(50);
    expect(bowlSizeToEnergyLevel('L')).toBe(75);
    expect(bowlSizeToEnergyLevel('XL')).toBe(95);
  });
});

describe('teacher follow-up · negative + handling', () => {
  it('ignores positive emotions even at XL with parked release', () => {
    expect(isPositiveEmotion('happy')).toBe(true);
    expect(
      evaluateNegativeBowlFollowUp({
        emotionKey: 'happy',
        size: 'XL',
        releaseKey: 'set_aside',
      }).watch,
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

  it('does not flag mild negative alone without handling cue', () => {
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

  it('flags 暫時唔處理 even when size is mild', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'S',
      releaseKey: 'set_aside',
    });
    expect(r.watch).toBe(true);
    expect(r.cue).toBe('parked');
    expect(r.handling).toBe('parked');
  });

  it('flags 抱住留低 for negative keep_hug', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'lonely',
      size: 'M',
      releaseKey: 'keep_hug',
    });
    expect(r.cues).toContain('holding_on');
    expect(r.handling).toBe('holding');
  });

  it('prioritises 想話俾大人聽 over other cues', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'anxious',
      size: 'XL',
      previousSize: 'M',
      releaseKey: 'wash',
      sharedWithClass: true,
    });
    expect(r.cue).toBe('asks_help');
    expect(r.cues).toContain('got_stronger');
    expect(r.handling).toBe('asks_adult');
  });

  it('parses release key from regulation activity list', () => {
    expect(releaseKeyFromRegulation(['breath_4_7_8', 'release:send_away'])).toBe(
      'send_away',
    );
    expect(handlingStanceOf({ releaseKey: 'empty' })).toBe('releasing');
  });
});
