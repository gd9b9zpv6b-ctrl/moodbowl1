import { describe, expect, it } from 'vitest';

import {
  decodeDecorations,
  encodeDecorations,
  type PlacedDecoration,
} from '@/src/constants/bowl-decorations';

describe('bowl decorations encode/decode', () => {
  it('round-trips positioned decorations', () => {
    const items: PlacedDecoration[] = [
      { key: 'star', x: 18, y: 12 },
      { key: 'heart', x: 70, y: 22 },
    ];
    const raw = encodeDecorations(items);
    expect(raw).toBe('decor:star@18,12;heart@70,22');
    expect(decodeDecorations(raw)).toEqual(items);
  });

  it('maps legacy key lists onto default slots', () => {
    const decoded = decodeDecorations('decor:star,bow');
    expect(decoded).toHaveLength(2);
    expect(decoded[0].key).toBe('star');
    expect(decoded[1].key).toBe('bow');
    expect(decoded[0].x).toBeGreaterThan(0);
    expect(decoded[0].y).toBeGreaterThan(0);
  });
});
