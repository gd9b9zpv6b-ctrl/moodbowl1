import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MinorAgeBand } from '@/src/lib/experience-mode';

const KEY = '@moodbowl/minor-age-band/v1';

export const MinorAgeBandStorage = {
  async get(): Promise<MinorAgeBand> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw === 'lower' ? 'lower' : 'upper';
  },
  async set(band: MinorAgeBand): Promise<void> {
    await AsyncStorage.setItem(KEY, band);
  },
};
