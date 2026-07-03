// School-level alert policy — currently mocked in AsyncStorage.
// Real B2B version: this lives per-school on the backend.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moodful_school_alert_policy_v1';

export type AlertPolicy = {
  keywordAlertsEnabled: boolean;
  keywords: string[];          // watched words in journal entries
  notifyRoles: ('counsellor' | 'teacher' | 'admin')[]; // who gets alerted
  discloseToStudent: boolean;  // show "the school watches these words" in hollow entry
};

export const DEFAULT_POLICY: AlertPolicy = {
  keywordAlertsEnabled: true,
  keywords: ['想死', '自殺', '傷害自己', '唔想再返學', '打我', '救命'],
  notifyRoles: ['counsellor'],
  discloseToStudent: true,
};

export const SchoolAlertPolicy = {
  async get(): Promise<AlertPolicy> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_POLICY };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_POLICY, ...parsed };
    } catch {
      return { ...DEFAULT_POLICY };
    }
  },
  async set(p: AlertPolicy) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  },
};
