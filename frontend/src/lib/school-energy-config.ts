// School-configurable emotion → energy level mapping.
// Currently mocked in AsyncStorage · will move to backend per-school schema in production.
// Any emotion not in the school's custom map falls back to the default (from constants/energy.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';

import { EnergyLevel, ENERGY_BY_KEY as DEFAULT_MAP } from '@/src/constants/energy';

const KEY = 'moodful_school_energy_map_v1';

export type EnergyMap = Record<string, EnergyLevel>;

export const SchoolEnergyConfig = {
  DEFAULT_MAP: DEFAULT_MAP as EnergyMap,

  async get(): Promise<EnergyMap> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const overrides = raw ? (JSON.parse(raw) as EnergyMap) : {};
      // Merge: default first · then school overrides
      return { ...DEFAULT_MAP, ...overrides };
    } catch {
      return { ...DEFAULT_MAP };
    }
  },

  async getOverrides(): Promise<EnergyMap> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as EnergyMap) : {};
    } catch {
      return {};
    }
  },

  async setOverride(emotionKey: string, level: EnergyLevel): Promise<EnergyMap> {
    const overrides = await this.getOverrides();
    // If assignment matches the default, remove from overrides to keep storage lean
    if (DEFAULT_MAP[emotionKey] === level) {
      delete overrides[emotionKey];
    } else {
      overrides[emotionKey] = level;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(overrides));
    return this.get();
  },

  async reset(): Promise<EnergyMap> {
    await AsyncStorage.removeItem(KEY);
    return { ...DEFAULT_MAP };
  },
};
