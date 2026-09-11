import { describe, expect, it } from 'vitest';
import {
  evaluateNegativeBowlFollowUp,
  handlingStanceOf,
  TEACHER_NOTIFY_ONLY_MESSAGE,
} from '@/src/lib/teacher-follow-up';

describe('teacher follow-up · Phase A rules', () => {
  it('ignores warm emotions unless notify teacher', () => {
    const warm = evaluateNegativeBowlFollowUp({
      emotionKey: 'happy',
      size: 'XL',
      releaseKey: 'keep_hug',
    });
    expect(warm.watch).toBe(false);

    const notify = evaluateNegativeBowlFollowUp({
      emotionKey: 'happy',
      size: 'S',
      notifyTeacher: true,
    });
    expect(notify.watch).toBe(true);
    expect(notify.cue).toBe('asks_help');
    expect(notify.notifyOnly).toBe(true);
  });

  it('family notify does not create teacher asks_help', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'M',
      sharedWithFamily: true,
    });
    expect(r.cues.includes('asks_help')).toBe(false);
  });

  it('active release suppresses size-based alerts', () => {
    const washed = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'XL',
      previousSize: 'M',
      releaseKey: 'wash',
    });
    expect(washed.watch).toBe(false);

    const drifted = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'XL',
      previousSize: 'M',
      releaseKey: 'let_flow',
    });
    expect(drifted.watch).toBe(false);
    expect(handlingStanceOf({ releaseKey: 'let_flow' })).toBe('releasing');

    const shared = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'XL',
      previousSize: 'M',
      releaseKey: 'share',
    });
    expect(shared.watch).toBe(false);
    expect(handlingStanceOf({ releaseKey: 'share' })).toBe('releasing');
    expect(handlingStanceOf({ releaseKey: 'share' })).not.toBe('asks_adult');
  });

  it('parked / holding only alert at L/XL', () => {
    const smallPark = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'M',
      releaseKey: 'set_aside',
    });
    expect(smallPark.cues.includes('parked')).toBe(false);

    const bigPark = evaluateNegativeBowlFollowUp({
      emotionKey: 'sad',
      size: 'L',
      releaseKey: 'set_aside',
    });
    expect(bigPark.cues.includes('parked')).toBe(true);
  });

  it('size increase → got_stronger', () => {
    const r = evaluateNegativeBowlFollowUp({
      emotionKey: 'angry',
      size: 'XL',
      previousSize: 'S',
    });
    expect(r.cue).toBe('got_stronger');
  });

  it('notify-only copy stays detail-free', () => {
    expect(TEACHER_NOTIFY_ONLY_MESSAGE).not.toMatch(/日記|碗|情緒/);
    expect(handlingStanceOf({ notifyTeacher: true })).toBe('asks_adult');
  });
});
