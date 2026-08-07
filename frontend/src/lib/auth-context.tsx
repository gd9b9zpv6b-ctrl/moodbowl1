import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import { api, loadToken, onApiActivity, onAuthInvalid, setToken, User } from './api';
import { RoleStorage, UserRole } from './role-storage';
import { supabase } from './supabase-client';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

type ProfileRow = {
  id: string;
  display_name: string | null;
  role: UserRole;
  is_premium: boolean;
  created_at: string;
};

type RegisterResult = {
  requiresEmailConfirmation: boolean;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<RegisterResult>;
  logout: (reason?: 'manual' | 'inactivity') => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (u: User | null) => void;
  ping: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function syncRole(user: User | null) {
  await RoleStorage.set((user?.role || 'student') as UserRole);
}

function friendlyAuthError(message: string): Error {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return new Error('電郵或者密碼唔啱 · 慢慢再試一次');
  }
  if (lower.includes('email not confirmed')) {
    return new Error('電郵仲未確認 · 睇下 inbox 入面嘅確認信');
  }
  if (lower.includes('user already registered')) {
    return new Error('呢個電郵已經有帳戶 · 可以直接登入');
  }
  if (lower.includes('password')) {
    return new Error('密碼未符合要求 · 至少輸入 6 個字元');
  }
  return new Error('出咗少少問題 · 過陣再試');
}

async function registerForPush(userId: string) {
  if (Platform.OS === 'web') return;
  try {
    const permissions = await Notifications.getPermissionsAsync();
    let granted = permissions.status === 'granted';
    if (!granted && permissions.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).status === 'granted';
    }
    if (!granted) return;
    const token = await Notifications.getDevicePushTokenAsync();
    if (!token?.data) return;
    await api.post('/register-push', {
      user_id: userId,
      platform: Platform.OS,
      device_token: token.data,
    });
  } catch {
    // Push is optional and must not block authentication.
  }
}

async function loadAppUser(authUser: SupabaseUser): Promise<User> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_premium, created_at')
    .eq('id', authUser.id)
    .maybeSingle<ProfileRow>();

  // Missing profile should not kick the user out after a successful Supabase login.
  // This happens when the auth trigger was applied late or the row is still settling.
  if (error) {
    console.warn('[auth] profile read failed', error.message);
  }

  let compatibility: Partial<User> = {};
  try {
    // Temporary · keeps settings and unmigrated screens working through Phase 4.
    compatibility = await api.get<User>('/auth/me');
  } catch {
    // Supabase Auth remains usable while the compatibility backend is offline.
  }

  const metaName =
    (typeof authUser.user_metadata?.display_name === 'string' && authUser.user_metadata.display_name) ||
    authUser.email?.split('@')[0] ||
    '朋友';

  return {
    id: authUser.id,
    email: authUser.email || '',
    display_name: profile?.display_name || metaName,
    created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
    credits: compatibility.credits ?? 0,
    is_premium: compatibility.is_premium ?? profile?.is_premium ?? false,
    is_admin: compatibility.is_admin ?? profile?.role === 'school_admin',
    has_secret_pin: compatibility.has_secret_pin ?? false,
    diary_style: compatibility.diary_style ?? {},
    active_icon_pack: compatibility.active_icon_pack ?? 'classic',
    featured_by_date: compatibility.featured_by_date ?? {},
    role: compatibility.role || profile?.role || 'student',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    syncRole(next).catch(() => {});
  }, []);

  const hydrateSession = useCallback(async (session: Session | null) => {
    if (!session) {
      if (mountedRef.current) setUser(null);
      return null;
    }
    try {
      const next = await loadAppUser(session.user);
      if (mountedRef.current) setUser(next);
      registerForPush(next.id);
      return next;
    } catch {
      if (mountedRef.current) setUser(null);
      return null;
    }
  }, [setUser]);

  useEffect(() => {
    mountedRef.current = true;
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session) return hydrateSession(data.session);
        // Temporary compatibility for invite-code accounts activated before
        // that privileged workflow moves to an Edge Function in Phase 4.
        if (await loadToken()) {
          try {
            const legacyUser = await api.get<User>('/auth/me');
            if (mountedRef.current) setUser(legacyUser);
            registerForPush(legacyUser.id);
            return legacyUser;
          } catch {
            await setToken(null);
          }
        }
        return null;
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' && !session) return;
      // Avoid issuing another Supabase request from inside the auth callback lock.
      setTimeout(() => hydrateSession(session), 0);
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession, setUser]);

  useEffect(() => {
    const exchangeCode = async (url: string | null) => {
      if (!url) return;
      const code = Linking.parse(url).queryParams?.code;
      if (typeof code === 'string') {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };
    Linking.getInitialURL().then(exchangeCode).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => {
      exchangeCode(url).catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await setToken(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw friendlyAuthError(error.message);
    const next = await hydrateSession(data.session);
    if (!next) throw new Error('登入成功但載入帳戶資料失敗 · 過陣再試');
  }, [hydrateSession]);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<RegisterResult> => {
    await setToken(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: displayName || null,
        },
      },
    });
    if (error) throw friendlyAuthError(error.message);
    if (data.session) {
      const next = await hydrateSession(data.session);
      if (!next) throw new Error('帳戶已建立但載入資料失敗 · 試吓直接登入');
    }
    return { requiresEmailConfirmation: !data.session };
  }, [hydrateSession]);

  const logout = useCallback(async (reason: 'manual' | 'inactivity' = 'manual') => {
    await Promise.allSettled([supabase.auth.signOut(), setToken(null)]);
    setUser(null);
    if (reason === 'inactivity') {
      Alert.alert('自動登出', '因為 10 分鐘冇任何操作 · 為咗保護你嘅私隱 · 系統已經自動登出');
    }
  }, [setUser]);

  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  }, []);

  const scheduleIdle = useCallback(() => {
    clearIdle();
    idleTimerRef.current = setTimeout(() => logout('inactivity'), INACTIVITY_TIMEOUT_MS);
  }, [clearIdle, logout]);

  const ping = useCallback(() => {
    if (user) scheduleIdle();
  }, [scheduleIdle, user]);

  useEffect(() => {
    if (!user) {
      clearIdle();
      onApiActivity(null);
      onAuthInvalid(null);
      return;
    }
    scheduleIdle();
    onApiActivity(ping);
    onAuthInvalid(() => logout().catch(() => {}));
    return () => {
      clearIdle();
      onApiActivity(null);
      onAuthInvalid(null);
    };
  }, [clearIdle, logout, ping, scheduleIdle, user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        if (user) scheduleIdle();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => subscription.remove();
  }, [scheduleIdle, user]);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return hydrateSession(data.session);
  }, [hydrateSession]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser, ping }),
    [user, loading, login, register, logout, refreshUser, setUser, ping],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
