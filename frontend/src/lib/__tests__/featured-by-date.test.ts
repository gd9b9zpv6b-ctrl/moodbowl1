import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem, updateUser } = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem, setItem },
}));

vi.mock('@/src/lib/supabase-client', () => ({
  supabase: { auth: { updateUser } },
}));

import {
  featuredStorageKey,
  loadFeaturedByDate,
  mergeFeaturedByDate,
  parseFeaturedByDate,
  persistFeaturedByDate,
  withFeaturedEntry,
} from '@/src/lib/featured-by-date';

describe('featured-by-date', () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
    updateUser.mockReset();
    updateUser.mockResolvedValue({ data: {}, error: null });
    setItem.mockResolvedValue(undefined);
  });

  it('keeps only YYYY-MM-DD → entry id pairs', () => {
    expect(
      parseFeaturedByDate({
        '2026-09-13': 'entry-a',
        nope: 'entry-b',
        '2026-09-14': 12,
        '2026-09-15': '  entry-c  ',
      }),
    ).toEqual({
      '2026-09-13': 'entry-a',
      '2026-09-15': 'entry-c',
    });
  });

  it('sets the representative entry for one day without dropping others', () => {
    expect(
      withFeaturedEntry({ '2026-09-12': 'old' }, '2026-09-13', 'entry-new'),
    ).toEqual({
      '2026-09-12': 'old',
      '2026-09-13': 'entry-new',
    });
  });

  it('lets later maps win when merging', () => {
    expect(
      mergeFeaturedByDate(
        { '2026-09-13': 'cloud' },
        { '2026-09-13': 'local', '2026-09-14': 'other' },
      ),
    ).toEqual({
      '2026-09-13': 'local',
      '2026-09-14': 'other',
    });
  });

  it('loads local cache over stale cloud so a device pick is not lost', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ '2026-09-13': 'picked-here' }),
    );
    await expect(
      loadFeaturedByDate('user-1', { '2026-09-13': 'stale-cloud' }),
    ).resolves.toEqual({ '2026-09-13': 'picked-here' });
    expect(getItem).toHaveBeenCalledWith(featuredStorageKey('user-1'));
  });

  it('persists the pick locally and onto the auth profile', async () => {
    await persistFeaturedByDate('user-1', { '2026-09-13': 'entry-a' });
    expect(setItem).toHaveBeenCalledWith(
      featuredStorageKey('user-1'),
      JSON.stringify({ '2026-09-13': 'entry-a' }),
    );
    expect(updateUser).toHaveBeenCalledWith({
      data: { featured_by_date: { '2026-09-13': 'entry-a' } },
    });
  });
});
