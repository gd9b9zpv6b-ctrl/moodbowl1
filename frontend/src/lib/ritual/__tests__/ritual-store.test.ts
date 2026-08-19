import { beforeEach, describe, expect, it } from 'vitest';

import { UNPICKED_BOWL_KEY } from '@/src/constants/emotions';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

describe('ritual store bowl fallback', () => {
  beforeEach(() => {
    useRitualStore.getState().reset();
  });

  it('assigns 樹洞 when nothing was picked', () => {
    expect(useRitualStore.getState().selectedBowlKey).toBeNull();
    useRitualStore.getState().ensureBowl();
    expect(useRitualStore.getState().selectedBowlKey).toBe(UNPICKED_BOWL_KEY);
  });

  it('does not overwrite a bowl the user already picked', () => {
    useRitualStore.getState().setBowl('sad');
    useRitualStore.getState().ensureBowl();
    expect(useRitualStore.getState().selectedBowlKey).toBe('sad');
  });
});
