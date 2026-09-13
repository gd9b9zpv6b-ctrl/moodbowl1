import { describe, expect, it } from 'vitest';

import { localTapInMeasuredBox, tapToPct } from '../decor-tap';

describe('localTapInMeasuredBox', () => {
  const box = { x: 40, y: 80, width: 200, height: 200 };

  it('uses locationX/Y when they look like a real tap inside the box', () => {
    expect(
      localTapInMeasuredBox({ locationX: 50, locationY: 60, pageX: 999, pageY: 999 }, box),
    ).toEqual({ x: 50, y: 60 });
  });

  it('does not treat Safari 0,0 location as a real tap', () => {
    expect(
      localTapInMeasuredBox(
        { locationX: 0, locationY: 0, clientX: 90, clientY: 130 },
        box,
      ),
    ).toEqual({ x: 50, y: 50 });
  });

  it('matches measureInWindow (viewport) with client coords', () => {
    expect(
      localTapInMeasuredBox({ clientX: 140, clientY: 180 }, box),
    ).toEqual({ x: 100, y: 100 });
  });

  it('subtracts document scroll when only page coords exist', () => {
    expect(
      localTapInMeasuredBox({ pageX: 140, pageY: 380 }, box, { x: 0, y: 200 }),
    ).toEqual({ x: 100, y: 100 });
  });
});

describe('tapToPct', () => {
  it('converts the tap to a percent on the bowl', () => {
    const pct = tapToPct(
      { clientX: 90, clientY: 130 },
      { x: 40, y: 80, width: 200, height: 200 },
    );
    expect(pct).toEqual({ x: 25, y: 25 });
  });
});
