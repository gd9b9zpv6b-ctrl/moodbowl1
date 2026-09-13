import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/src/lib/supabase-client';

export type FeaturedByDate = Record<string, string>;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function featuredStorageKey(userId: string) {
  return `@moodbowl/featured-by-date/${userId}`;
}

export function parseFeaturedByDate(raw: unknown): FeaturedByDate {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: FeaturedByDate = {};
  for (const [date, id] of Object.entries(raw as Record<string, unknown>)) {
    if (DATE_KEY.test(date) && typeof id === 'string' && id.trim()) {
      out[date] = id.trim();
    }
  }
  return out;
}

export function withFeaturedEntry(
  current: FeaturedByDate | null | undefined,
  date: string,
  entryId: string,
): FeaturedByDate {
  if (!DATE_KEY.test(date) || !entryId.trim()) {
    return parseFeaturedByDate(current);
  }
  return { ...parseFeaturedByDate(current), [date]: entryId.trim() };
}

export function mergeFeaturedByDate(...maps: unknown[]): FeaturedByDate {
  return maps.reduce<FeaturedByDate>(
    (acc, raw) => ({ ...acc, ...parseFeaturedByDate(raw) }),
    {},
  );
}

export async function readLocalFeaturedByDate(userId: string): Promise<FeaturedByDate> {
  try {
    const raw = await AsyncStorage.getItem(featuredStorageKey(userId));
    return parseFeaturedByDate(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

/** Later maps win. Local cache is last so a pick still stuck on this device is kept. */
export async function loadFeaturedByDate(
  userId: string,
  ...cloud: unknown[]
): Promise<FeaturedByDate> {
  const local = await readLocalFeaturedByDate(userId);
  return mergeFeaturedByDate(...cloud, local);
}

export async function persistFeaturedByDate(
  userId: string,
  map: FeaturedByDate,
): Promise<FeaturedByDate> {
  const clean = parseFeaturedByDate(map);
  try {
    await AsyncStorage.setItem(featuredStorageKey(userId), JSON.stringify(clean));
  } catch {
    // Cloud write may still succeed.
  }
  try {
    await supabase.auth.updateUser({ data: { featured_by_date: clean } });
  } catch {
    // Local cache still holds the pick for this device.
  }
  return clean;
}
