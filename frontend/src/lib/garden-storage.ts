import AsyncStorage from '@react-native-async-storage/async-storage';

import { Plot, PLOT_COUNT } from '@/src/constants/garden';

const KEYS = {
  plots: '@garden/plots/v1',
  hearts: '@garden/hearts/v1',
  rice: '@garden/rice/v1',
  demo: '@garden/demo/v1',
  harvests: '@garden/harvests/v1',
  avatar: '@garden/avatar/v1',
};

function emptyPlots(): Plot[] {
  return Array.from({ length: PLOT_COUNT }, (_, i) => ({ id: i, stage: 'empty' }));
}

export const GardenStorage = {
  async getPlots(): Promise<Plot[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.plots);
      if (!raw) return emptyPlots();
      const parsed = JSON.parse(raw) as Plot[];
      // Ensure length matches expected PLOT_COUNT (padded with empty).
      if (parsed.length !== PLOT_COUNT) {
        const filled = emptyPlots();
        parsed.forEach((p, i) => (i < PLOT_COUNT ? (filled[i] = p) : null));
        return filled;
      }
      return parsed;
    } catch {
      return emptyPlots();
    }
  },

  async setPlots(plots: Plot[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.plots, JSON.stringify(plots));
  },

  async getHearts(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.hearts);
    if (raw == null) {
      // Seed with 15 hearts for first-time users (enough to demo)
      await AsyncStorage.setItem(KEYS.hearts, '15');
      return 15;
    }
    return Number(raw) || 0;
  },

  async setHearts(n: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.hearts, String(Math.max(0, n)));
  },

  async getRice(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.rice);
    return raw ? Number(raw) : 0;
  },

  async setRice(n: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.rice, String(Math.max(0, n)));
  },

  async getDemo(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(KEYS.demo);
    if (raw == null) return true; // Default demo mode ON for pitch
    return raw === '1';
  },

  async setDemo(v: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.demo, v ? '1' : '0');
  },

  async getHarvests(): Promise<Record<string, number>> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.harvests);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  async addHarvest(cropKey: string): Promise<Record<string, number>> {
    const cur = await this.getHarvests();
    cur[cropKey] = (cur[cropKey] || 0) + 1;
    await AsyncStorage.setItem(KEYS.harvests, JSON.stringify(cur));
    return cur;
  },

  async getAvatarKey(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.avatar);
  },

  async setAvatarKey(key: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.avatar, key);
  },

  async reset(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.plots, KEYS.hearts, KEYS.rice, KEYS.demo, KEYS.harvests, KEYS.avatar]);
  },
};
