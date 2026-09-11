import { describe, expect, it } from 'vitest';

import {
  DIARY_RITUAL_FOR_RELEASE,
  diaryRitualForRelease,
} from '@/src/constants/diary-ritual';
import {
  BOWL_RELEASE_ACTIONS,
  STORED_BOWL_RELEASE_KEYS,
} from '@/src/constants/bowl-release';
import { wordingFor } from '@/src/lib/i18n/wording-mode';

describe('diaryRitualForRelease', () => {
  it('maps every stored release key without inventing extra DB values', () => {
    expect(Object.keys(DIARY_RITUAL_FOR_RELEASE).sort()).toEqual(
      [...STORED_BOWL_RELEASE_KEYS].sort(),
    );
  });

  it('plays paper-folding sequences for bury, drawer, plane, and lock-box', () => {
    expect(diaryRitualForRelease('empty')).toBe('garden');
    expect(diaryRitualForRelease('set_aside')).toBe('later');
    expect(diaryRitualForRelease('send_away')).toBe('release');
    expect(diaryRitualForRelease('keep_hug')).toBe('lock');
  });

  it('keeps stream endings off paper folding so the creek scene can play', () => {
    expect(diaryRitualForRelease('let_flow')).toBeNull();
    expect(diaryRitualForRelease('wash')).toBeNull();
  });

  it('does not offer wash in the picker', () => {
    expect(BOWL_RELEASE_ACTIONS.map((action) => action.key)).toEqual([
      'empty',
      'set_aside',
      'send_away',
      'let_flow',
      'keep_hug',
    ]);
  });
});

describe('release paper-ritual copy', () => {
  it('names the four paper endings plus the stream choice in every wording band', () => {
    for (const mode of ['lower', 'upper', 'adult'] as const) {
      const pack = wordingFor(mode);
      expect(pack.release_actions.empty.label).toContain('泥土');
      expect(pack.release_actions.set_aside.label).toContain('書枱');
      expect(pack.release_actions.send_away.label).toContain('紙飛機');
      expect(pack.release_actions.keep_hug.label).toContain('鎖');
      expect(pack.release_actions.let_flow.label).toContain('紙船');
      expect(pack.release_actions.let_flow.hint).toMatch(/摺|船/);
      expect(pack.release_actions.let_flow.label).not.toMatch(/洗|沖涼/);
      expect(pack.release_actions.wash.label.length).toBeGreaterThan(0);
      expect(pack.pick_direct.length).toBeGreaterThan(0);
      expect(pack.pick_play.length).toBeGreaterThan(0);
    }
  });
});
