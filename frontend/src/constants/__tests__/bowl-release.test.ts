import { describe, expect, it } from 'vitest';

import {
  bowlReleaseWriteAttempts,
  isBowlReleaseConstraintError,
} from '@/src/constants/bowl-release';

describe('bowlReleaseWriteAttempts', () => {
  it('tries let_flow, then retired wash, then omits the key', () => {
    expect(bowlReleaseWriteAttempts('let_flow')).toEqual(['let_flow', 'wash', null]);
  });

  it('tries share, then send_away, then omits the key', () => {
    expect(bowlReleaseWriteAttempts('share')).toEqual(['share', 'send_away', null]);
  });

  it('only falls back to omit for already-allowed keys', () => {
    expect(bowlReleaseWriteAttempts('empty')).toEqual(['empty', null]);
    expect(bowlReleaseWriteAttempts(null)).toEqual([null]);
  });
});

describe('isBowlReleaseConstraintError', () => {
  it('matches the live check-constraint message', () => {
    expect(
      isBowlReleaseConstraintError({
        code: '23514',
        message: 'new row for relation "diaries" violates check constraint "diaries_bowl_release_check"',
      }),
    ).toBe(true);
  });

  it('ignores other check constraints', () => {
    expect(
      isBowlReleaseConstraintError({
        code: '23514',
        message: 'new row violates check constraint "diaries_bowl_size_check"',
      }),
    ).toBe(false);
  });
});
