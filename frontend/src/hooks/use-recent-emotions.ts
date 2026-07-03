import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@moodful/recent-emotions';
const MAX_RECENT = 8;

/**
 * Tracks the user's most recently picked emotion keys in local storage.
 * The list is ordered from most-recent → older, deduped.
 */
export function useRecentEmotions() {
  const [recent, setRecent] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRecent(arr.slice(0, MAX_RECENT));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const track = useCallback(
    async (keys: string[]) => {
      const next = [
        ...keys,
        ...recent.filter((k) => !keys.includes(k)),
      ].slice(0, MAX_RECENT);
      setRecent(next);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [recent],
  );

  return { recent, track, reload: load };
}
