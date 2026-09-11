import { describe, expect, it } from 'vitest';

import {
  DIARY_RITUAL_FOR_RELEASE,
  diaryRitualForRelease,
} from '@/src/constants/diary-ritual';
import { BOWL_RELEASE_ACTIONS } from '@/src/constants/bowl-release';
import { wordingFor } from '@/src/lib/i18n/wording-mode';

describe('diaryRitualForRelease', () => {
  it('maps every stored release key without inventing new DB values', () => {
    expect(Object.keys(DIARY_RITUAL_FOR_RELEASE).sort()).toEqual(
      BOWL_RELEASE_ACTIONS.map((action) => action.key).sort(),
    );
  });

  it('plays paper-folding sequences for bury, drawer, plane, and lock-box', () => {
    expect(diaryRitualForRelease('empty')).toBe('garden');
    expect(diaryRitualForRelease('set_aside')).toBe('later');
    expect(diaryRitualForRelease('send_away')).toBe('release');
    expect(diaryRitualForRelease('keep_hug')).toBe('lock');
  });

  it('keeps wash off paper folding so the shower scene can play', () => {
    expect(diaryRitualForRelease('wash')).toBeNull();
  });
});

describe('release paper-ritual copy', () => {
  it('names the four paper endings in every wording band', () => {
    for (const mode of ['lower', 'upper', 'adult'] as const) {
      const pack = wordingFor(mode);
      expect(pack.release_actions.empty.label).toContain('泥土');
      expect(pack.release_actions.set_aside.label).toContain('書枱');
      expect(pack.release_actions.send_away.label).toContain('紙飛機');
      expect(pack.release_actions.keep_hug.label).toContain('鎖');
      expect(pack.release_actions.wash.label.length).toBeGreaterThan(0);
      expect(pack.pick_direct.length).toBeGreaterThan(0);
      expect(pack.pick_play.length).toBeGreaterThan(0);
    }
  });
});
