import { describe, expect, it } from 'vitest';

import { breathShapeForActivity } from '../breath-shape';

describe('breathShapeForActivity', () => {
  it('uses an ice cube for 冰塊呼吸', () => {
    expect(breathShapeForActivity('ice_breath')).toBe('ice');
  });

  it('uses a bowl when sitting with the bowl', () => {
    expect(breathShapeForActivity('sit_with_bowl')).toBe('bowl');
  });

  it('uses a soft wind orb for gentle breath names', () => {
    expect(breathShapeForActivity('soft_breath')).toBe('wind');
    expect(breathShapeForActivity('wake_breath')).toBe('wind');
  });
});
