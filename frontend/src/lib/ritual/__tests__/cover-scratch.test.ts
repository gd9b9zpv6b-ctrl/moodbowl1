import { describe, expect, it } from 'vitest';

import {
  BALLOON_COLUMNS,
  BALLOON_ROWS,
  COVER_COLUMNS,
  COVER_ROWS,
  bowlIndexAt,
  coverCellAt,
  farEnoughFromLast,
  shouldDiscoverAfterHits,
} from '../cover-scratch';

describe('coverCellAt', () => {
  it('maps the top-left of the sheet to cell 0', () => {
    expect(coverCellAt(4, 4, 320, 400, COVER_COLUMNS, COVER_ROWS)).toBe(0);
  });

  it('maps the bottom-right of the sand sheet to the last cell', () => {
    expect(coverCellAt(319, 399, 320, 400, COVER_COLUMNS, COVER_ROWS)).toBe(
      COVER_COLUMNS * COVER_ROWS - 1,
    );
  });

  it('uses the balloon grid when the sky is packed with balloons', () => {
    expect(coverCellAt(200, 220, 320, 400, BALLOON_COLUMNS, BALLOON_ROWS)).toBeGreaterThan(0);
  });
});

describe('bowlIndexAt', () => {
  it('finds the bowl sitting under that spot', () => {
    expect(bowlIndexAt(40, 40, 320, 400, 6)).toBe(0);
    expect(bowlIndexAt(300, 40, 320, 400, 6)).toBe(2);
  });

  it('returns null when the grid cell is empty', () => {
    expect(bowlIndexAt(300, 380, 320, 400, 5)).toBeNull();
  });
});

describe('scratch helpers', () => {
  it('needs a few wipes over the same bowl before it counts as found', () => {
    expect(shouldDiscoverAfterHits(2)).toBe(false);
    expect(shouldDiscoverAfterHits(3)).toBe(true);
  });

  it('ignores tiny jitters so one tap does not clear the whole sheet', () => {
    expect(farEnoughFromLast(10, 10, { x: 10, y: 10 }, true)).toBe(true);
    expect(farEnoughFromLast(12, 11, { x: 10, y: 10 }, false)).toBe(false);
    expect(farEnoughFromLast(20, 10, { x: 10, y: 10 }, false)).toBe(true);
  });
});
