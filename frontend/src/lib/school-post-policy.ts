// School-level community POST content policy.
// Distinct from `school-alert-policy` which watches DIARY entries for crisis words.
//
// Diary vs Post — different intent, different rules:
// - Diary keywords  → private venting is OK · we only WATCH for crisis signals to help.
// - Post keywords   → public content · we BLOCK profanity + crisis before it reaches other students.
//
// Stored locally in AsyncStorage today (mirrors school-alert-policy mock pattern).
// A production B2B version would sync per-school on the backend.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moodful_school_post_policy_v1';

export type PostPolicy = {
  postFilterEnabled: boolean;    // master toggle
  banKeywords: string[];         // words that BLOCK a public post
  blockCrisisInPosts: boolean;   // also block crisis words (跳樓/自殺…) in public posts
  showSupportOnBlock: boolean;   // if a crisis word is blocked · show support resources modal
};

// Common Cantonese/HK profanity + light insults · school admins can freely edit.
// Keep this list short and neutral · schools will customize per their code of conduct.
export const DEFAULT_BAN_KEYWORDS = [
  '屌', '你老母', '仆街', '冚家鏟', '死開', '賤人', '八婆', '雞', 'X你',
  '傻仔', '傻婆', '廢人', '低B', '白痴', '智障',
];

export const DEFAULT_POST_POLICY: PostPolicy = {
  postFilterEnabled: true,
  banKeywords: DEFAULT_BAN_KEYWORDS,
  blockCrisisInPosts: true,
  showSupportOnBlock: true,
};

export const SchoolPostPolicy = {
  DEFAULT_POST_POLICY,
  DEFAULT_BAN_KEYWORDS,

  async get(): Promise<PostPolicy> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_POST_POLICY };
      const parsed = JSON.parse(raw) as Partial<PostPolicy>;
      return { ...DEFAULT_POST_POLICY, ...parsed };
    } catch {
      return { ...DEFAULT_POST_POLICY };
    }
  },

  async set(p: PostPolicy) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  },

  async reset() {
    await AsyncStorage.removeItem(KEY);
  },
};

// Utility: scan a note against a policy · returns matched ban words.
// Case-insensitive substring match — same lightweight rule as diary alerts.
export function scanPostForBanned(
  note: string,
  policy: PostPolicy,
  crisisKeywords: string[] = [],
): { matchedBan: string[]; matchedCrisis: string[] } {
  const text = (note || '').toLowerCase();
  const matchedBan = policy.postFilterEnabled
    ? policy.banKeywords.filter((k) => k && text.includes(k.toLowerCase()))
    : [];
  const matchedCrisis = policy.blockCrisisInPosts
    ? crisisKeywords.filter((k) => k && text.includes(k.toLowerCase()))
    : [];
  return { matchedBan, matchedCrisis };
}
