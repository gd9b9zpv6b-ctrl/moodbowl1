// School-level community settings — currently mocked in AsyncStorage.
// Adult scope is ALWAYS invisible to students (hardcoded on backend · not configurable).
// Only the student-community visibility to adults is a school choice.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moodful_school_community_config_v1';

export type StudentAnonymity =
  | 'full'          // 完全匿名 · 不顯示任何身份
  | 'nickname';     // 顯示用戶自訂 display_name

export type CommunityConfig = {
  adultCanViewStudentCommunity: boolean;
  studentAnonymity: StudentAnonymity;
  studentCommunityEnabled: boolean;   // school can also disable student community entirely
  adultCommunityEnabled: boolean;     // and adult community
  postTtlDays: number;                // 0 = keep forever; else hide posts older than N days
};

export const DEFAULT_CONFIG: CommunityConfig = {
  adultCanViewStudentCommunity: false,   // safer default — adults cannot peek
  studentAnonymity: 'full',              // safer default — full anonymity
  studentCommunityEnabled: true,
  adultCommunityEnabled: true,
  postTtlDays: 30,                       // default: posts fade after 30 days
};

export const SchoolCommunityConfig = {
  DEFAULT_CONFIG,

  async get(): Promise<CommunityConfig> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<CommunityConfig>) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  },

  async set(cfg: CommunityConfig) {
    await AsyncStorage.setItem(KEY, JSON.stringify(cfg));
  },

  async reset() {
    await AsyncStorage.removeItem(KEY);
  },
};
