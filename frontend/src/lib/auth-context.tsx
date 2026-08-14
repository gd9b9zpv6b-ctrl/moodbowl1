import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import { api, AuthResponse, loadToken, onApiActivity, onAuthInvalid, setToken, User } from './api';
import { RoleStorage, UserRole } from './role-storage';
import { supabase } from './supabase-client';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const AUTH_OP_TIMEOUT_MS = 2500;

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
  login: (email: string, password: string) => Promise<User>;
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function friendlyAuthError(message: string): Error {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('incorrect email or password')) {
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

async function loadLegacyUser(): Promise<User | null> {
  if (!(await loadToken())) return null;
  try {
    const legacyUser = await api.get<User>('/auth/me');
    registerForPush(legacyUser.id);
    return legacyUser;
  } catch {
    await setToken(null);
    return null;
  }
}

async function loginWithBackend(email: string, password: string): Promise<User> {
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  let json: AuthResponse | { detail?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json || !('access_token' in json)) {
    const detail = json && 'detail' in json ? json.detail : '';
    throw friendlyAuthError(typeof detail === 'string' && detail ? detail : 'Invalid login credentials');
  }
  await setToken(json.access_token);
  return json.user;
}

async function loadAppUser(authUser: SupabaseUser): Promise<User> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_premium, created_at')
    .eq('id', authUser.id)
    .maybeSingle<ProfileRow>();

  if (error) throw error;

  let compatibility: Partial<User> = {};
  try {
    // Temporary · keeps settings and unmigrated screens working through Phase 4.
    // Also supplies Mongo-seeded demo roles when the Supabase profile is still student.
    compatibility = await api.get<User>('/auth/me');
  } catch {
    // Supabase Auth remains usable while the compatibility backend is offline.
  }

  if (!profile && !compatibility.id) {
    throw new Error('profile missing');
  }

  return {
    id: authUser.id,
    email: authUser.email || compatibility.email || '',
    display_name: profile?.display_name ?? compatibility.display_name ?? null,
    created_at: profile?.created_at || compatibility.created_at || new Date().toISOString(),
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
  const loggingOutRef = useRef(false);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    syncRole(next).catch(() => {});
  }, []);

  const hydrateSession = useCallback(async (session: Session | null) => {
    if (loggingOutRef.current) {
      if (session) {
        void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      if (mountedRef.current) setUser(null);
      return null;
    }
    if (!session) {
      const legacyUser = await loadLegacyUser();
      if (mountedRef.current) setUser(legacyUser);
      return legacyUser;
    }
    try {
      const next = await loadAppUser(session.user);
      if (loggingOutRef.current) {
        if (mountedRef.current) setUser(null);
        return null;
      }
      if (mountedRef.current) setUser(next);
      registerForPush(next.id);
      return next;
    } catch {
      const legacyUser = await loadLegacyUser();
      if (mountedRef.current) setUser(legacyUser);
      return legacyUser;
    }
  }, [setUser]);

  useEffect(() => {
    mountedRef.current = true;
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session) return hydrateSession(data.session);
        return hydrateSession(null);
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
    loggingOutRef.current = false;
    await setToken(null);

    let supabaseError: { message?: string } | null = null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!error && data.session) {
        const next = await hydrateSession(data.session);
        if (next) return next;
      }
      supabaseError = error;
    } catch (err: any) {
      supabaseError = err;
    }

    // Mongo-seeded demo / invite-code accounts are not always present in Supabase Auth.
    try {
      await withTimeout(supabase.auth.signOut({ scope: 'local' }), AUTH_OP_TIMEOUT_MS).catch(() => {});
      const next = await loginWithBackend(email, password);
      if (mountedRef.current) setUser(next);
      registerForPush(next.id);
      return next;
    } catch (backendError: any) {
      throw friendlyAuthError(
        supabaseError?.message || backendError?.message || 'Invalid login credentials',
      );
    }
  }, [hydrateSession, setUser]);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<RegisterResult> => {
    loggingOutRef.current = false;
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
    if (data.session) await hydrateSession(data.session);
    return { requiresEmailConfirmation: !data.session };
  }, [hydrateSession]);

  const logout = useCallback(async (reason: 'manual' | 'inactivity' = 'manual') => {
    loggingOutRef.current = true;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setUser(null);
    await setToken(null);
    // Never block the UI on a hung revoke/network call — that left demo adults stuck.
    void withTimeout(supabase.auth.signOut({ scope: 'local' }), AUTH_OP_TIMEOUT_MS).catch(() => {});
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
    if (loggingOutRef.current) return null;
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
