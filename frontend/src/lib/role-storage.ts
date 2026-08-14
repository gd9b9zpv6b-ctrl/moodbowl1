import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'counsellor'
  | 'school_admin';

const KEY = '@role/current/v1';

export const ROLE_META: Record<
  UserRole,
  { label: string; emoji: string; homePath: string; color: string }
> = {
  student:     { label: '學生',     emoji: '🎒', homePath: '/',                  color: '#B9DBBC' },
  teacher:     { label: '班主任',   emoji: '👩‍🏫', homePath: '/teacher-dashboard',  color: '#F0AE64' },
  parent:      { label: '家長',     emoji: '👨‍👩‍👧', homePath: '/parent-home',        color: '#E499B4' },
  counsellor:  { label: '輔導老師', emoji: '💚',  homePath: '/counsellor-panel',   color: '#7DBEE8' },
  school_admin:{ label: '校方管理', emoji: '🏫', homePath: '/school-admin',       color: '#C7A6D1' },
};

/** Post-login landing. Students go straight to tabs so `/` cannot bounce them. */
export function homePathForRole(role?: string | null): string {
  if (role === 'teacher') return '/teacher-dashboard';
  if (role === 'counsellor') return '/counsellor-panel';
  if (role === 'parent') return '/parent-home';
  if (role === 'school_admin') return '/school-admin';
  return '/(tabs)';
}

export const RoleStorage = {
  async get(): Promise<UserRole> {
    const raw = await AsyncStorage.getItem(KEY);
    return (raw as UserRole) || 'student';
  },
  async set(r: UserRole): Promise<void> {
    await AsyncStorage.setItem(KEY, r);
  },
};
