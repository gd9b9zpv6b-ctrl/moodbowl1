import type { UserRole } from '@/src/lib/role-storage';
import { ROLE_META } from '@/src/lib/role-storage';

/** App experience mode · derived from authorization role. */
export type ExperienceMode = 'minor' | 'adult';

/** Within minor (student) mode · ritual wording band. */
export type MinorAgeBand = 'lower' | 'upper';

export function experienceModeForRole(role?: string | null): ExperienceMode {
  return role === 'student' || !role ? 'minor' : 'adult';
}

export function isAdultRole(role?: string | null): boolean {
  return experienceModeForRole(role) === 'adult';
}

export function homePathForRole(role?: string | null): string {
  const key = (role || 'student') as UserRole;
  return ROLE_META[key]?.homePath || '/';
}

/** Map Expo Router paths · student home is the tabs group. */
export function routerHomeForRole(role?: string | null): string {
  if (!role || role === 'student') return '/(tabs)';
  return homePathForRole(role);
}
