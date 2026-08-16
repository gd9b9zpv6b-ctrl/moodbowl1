import { describe, expect, it } from 'vitest';

import {
  COUNSELLOR_TRIAGE_COPY,
  apiAlertToSignal,
  buildCounsellorCase,
  splitCounsellorCases,
  triageApiAlert,
  triageSignal,
} from '@/src/lib/counsellor-triage';

describe('counsellor triage rules', () => {
  it('marks crisis / safety signals as urgent', () => {
    expect(triageSignal('crisis_keyword')).toBe('urgent');
    expect(triageSignal('blocked_crisis_post')).toBe('urgent');
    expect(triageSignal('safety_somatic')).toBe('urgent');
  });

  it('marks pattern / soft signals as follow_up', () => {
    expect(triageSignal('checkin_absent')).toBe('follow_up');
    expect(triageSignal('checkin_drop')).toBe('follow_up');
    expect(triageSignal('emotion_swing')).toBe('follow_up');
    expect(triageSignal('bowl_watch')).toBe('follow_up');
    expect(triageSignal('teacher_notify')).toBe('follow_up');
    expect(triageSignal('blocked_profanity_post')).toBe('follow_up');
  });

  it('keeps copy priority aligned with triageSignal', () => {
    for (const [kind, meta] of Object.entries(COUNSELLOR_TRIAGE_COPY)) {
      expect(triageSignal(kind as keyof typeof COUNSELLOR_TRIAGE_COPY)).toBe(meta.priority);
    }
  });

  it('triages API alerts by alert_type', () => {
    expect(triageApiAlert({ alert_type: 'crisis_keyword' })).toBe('urgent');
    expect(triageApiAlert({ alert_type: 'blocked_crisis_post' })).toBe('urgent');
    expect(triageApiAlert({ alert_type: 'blocked_profanity_post' })).toBe('follow_up');
    expect(apiAlertToSignal({ alert_type: 'blocked_profanity_post' })).toBe(
      'blocked_profanity_post',
    );
  });

  it('splits mock cases with the same rules', () => {
    const { urgent, followUp } = splitCounsellorCases([
      { id: '1', name: 'A', className: '6A', signal: 'crisis_keyword', days: 1 },
      { id: '2', name: 'B', className: '5B', signal: 'safety_somatic', days: 2 },
      { id: '3', name: 'C', className: '5B', signal: 'checkin_absent', days: 3 },
      { id: '4', name: 'D', className: '4C', signal: 'emotion_swing', days: 4 },
      { id: '5', name: 'E', className: '6B', signal: 'checkin_drop', days: 5 },
    ]);
    expect(urgent).toHaveLength(2);
    expect(followUp).toHaveLength(3);
    expect(urgent.every((c) => c.sev === 'high')).toBe(true);
    expect(buildCounsellorCase({
      id: 'x',
      name: 'X',
      className: '1A',
      signal: 'bowl_watch',
    }).reason).toBe('系統負面提示');
  });
});
