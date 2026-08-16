import type { UserRole } from '@/src/lib/role-storage';

/** Preview demo accounts · password is always demo1234. */
export const DEMO_PASSWORD = 'demo1234';

export type DemoAccount = {
  role: UserRole;
  email: string;
  label: string;
  emoji: string;
  color: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'student', email: 'student@demo.moodful.app', label: '學生 A', emoji: '🎒', color: '#B9DBBC' },
  { role: 'student', email: 'student2@demo.moodful.app', label: '學生 B', emoji: '🎒', color: '#A2D2FF' },
  { role: 'teacher', email: 'teacher@demo.moodful.app', label: '班主任', emoji: '👩‍🏫', color: '#F0AE64' },
  { role: 'counsellor', email: 'counsellor@demo.moodful.app', label: '輔導老師', emoji: '💚', color: '#7DBEE8' },
  { role: 'parent', email: 'parent@demo.moodful.app', label: '家長', emoji: '👨‍👩‍👧', color: '#E499B4' },
  { role: 'school_admin', email: 'school@demo.moodful.app', label: '校方管理', emoji: '🏫', color: '#C7A6D1' },
];

const ROLE_BY_EMAIL: Record<string, UserRole> = Object.fromEntries(
  DEMO_ACCOUNTS.map((a) => [a.email.toLowerCase(), a.role]),
);

/** When profile read fails (e.g. JWT clock skew), keep demo role routing correct. */
export function demoRoleForEmail(email?: string | null): UserRole | null {
  if (!email) return null;
  return ROLE_BY_EMAIL[email.trim().toLowerCase()] ?? null;
}
