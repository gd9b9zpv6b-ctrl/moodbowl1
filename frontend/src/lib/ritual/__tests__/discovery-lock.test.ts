import { describe, expect, it } from 'vitest';

import { canSwitchDiscovery, lockDiscoveryCategory } from '@/src/lib/ritual/discovery-lock';

describe('discovery lock', () => {
  it('does not lock a game until the first play', () => {
    expect(canSwitchDiscovery(null, 'sad')).toBe(true);
    expect(canSwitchDiscovery(null, 'anger')).toBe(true);
  });

  it('keeps the first game after a play starts', () => {
    expect(lockDiscoveryCategory(null, 'sad')).toBe('sad');
    expect(lockDiscoveryCategory('sad', 'anger')).toBe('sad');
    expect(canSwitchDiscovery('sad', 'sad')).toBe(true);
    expect(canSwitchDiscovery('sad', 'anger')).toBe(false);
  });
});
