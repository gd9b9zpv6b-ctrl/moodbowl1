// Backend-backed school-wide content policy client.
// Consolidates what used to live in `school-alert-policy.ts` (AsyncStorage)
// and `school-post-policy.ts` (AsyncStorage) — both now sync to `/api/admin/policies`.
//
// Any signed-in user can READ (needed for pre-flight validation on the diary form).
// Only school_admin can WRITE — enforced on backend.

import { api } from '@/src/lib/api';

export type SchoolPolicies = {
  diary_keywords: string[];          // words that trigger a diary alert
  post_ban_keywords: string[];       // words that BLOCK a public post
  block_crisis_in_posts: boolean;    // also block diary_keywords in public posts
  notify_parents_on_alert: boolean;  // parents can see their child's alerts
  counsellor_can_view_note_content: boolean;  // counsellors can reveal note text (audit-logged)
  updated_at?: string;
};

export const DEFAULT_POLICIES: SchoolPolicies = {
  diary_keywords: [],
  post_ban_keywords: [],
  block_crisis_in_posts: true,
  notify_parents_on_alert: false,
  counsellor_can_view_note_content: false,
};

// Simple in-memory cache — refreshed on each admin edit · lightweight enough
// for the diary form's pre-flight scan without hammering the backend.
let cache: SchoolPolicies | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000; // 30s is plenty for a mobile session

export const SchoolPolicies = {
  DEFAULT: DEFAULT_POLICIES,

  async get(force = false): Promise<SchoolPolicies> {
    const now = Date.now();
    if (!force && cache && now - cacheAt < CACHE_TTL_MS) return cache;
    try {
      const res = await api.get<SchoolPolicies>('/admin/policies');
      cache = { ...DEFAULT_POLICIES, ...res };
      cacheAt = now;
      return cache;
    } catch {
      // Network error — fall back to defaults so the form doesn't hard-fail.
      return cache || { ...DEFAULT_POLICIES };
    }
  },

  async update(patch: Partial<SchoolPolicies>): Promise<SchoolPolicies> {
    const res = await api.put<SchoolPolicies>('/admin/policies', patch);
    cache = { ...DEFAULT_POLICIES, ...res };
    cacheAt = Date.now();
    return cache;
  },

  invalidate() {
    cache = null;
    cacheAt = 0;
  },
};

// Utility mirrors the previous local helper — but works on the backend-shape.
export function scanNoteForPost(
  note: string,
  policies: SchoolPolicies,
): { matchedBan: string[]; matchedCrisis: string[] } {
  const text = note || '';
  const matchedBan = (policies.post_ban_keywords || []).filter(
    (k) => k && text.includes(k),
  );
  const matchedCrisis = policies.block_crisis_in_posts
    ? (policies.diary_keywords || []).filter((k) => k && text.includes(k))
    : [];
  return { matchedBan, matchedCrisis };
}
