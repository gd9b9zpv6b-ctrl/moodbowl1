import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { api, loadToken, setToken, onApiActivity, User, AuthResponse } from './api';
import { RoleStorage, UserRole } from './role-storage';

// Auto-logout: if the user has been idle for this long · we clear their session.
// 10 minutes matches typical school/enterprise security policy expectations.
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

/** Register the current device with the push relay. Non-blocking: silent on any failure. */
async function registerForPush(userId: string) {
  if (Platform.OS === 'web') return;
  try {
    const perms = await Notifications.getPermissionsAsync();
    let granted = perms.status === 'granted';
    if (!granted && perms.canAskAgain) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return;
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    if (!tokenResp?.data) return;
    await api.post('/register-push', {
      user_id: userId,
      platform: Platform.OS,
      device_token: tokenResp.data,
    });
  } catch {
    // Silent — push isn't critical to primary flows.
  }
}

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: (reason?: 'manual' | 'inactivity') => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User | null) => void;
  /** Call this from any interaction (touch · nav · api) to reset the idle timer */
  ping: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Whenever we set/refresh a user, sync their server-side role into RoleStorage
// so all the dashboards route to the correct home path automatically.
async function syncRole(u: User | null) {
  if (!u) return;
  const role = (u.role || 'student') as UserRole;
  await RoleStorage.set(role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (t) {
        try {
          const me = await api.get<User>('/auth/me');
          setUser(me);
          await syncRole(me);
          registerForPush(me.id);
        } catch {
          await setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    await setToken(res.access_token);
    setUser(res.user);
    await syncRole(res.user);
    registerForPush(res.user.id);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        display_name: displayName,
      });
      await setToken(res.access_token);
      setUser(res.user);
      await syncRole(res.user);
      registerForPush(res.user.id);
    },
    [],
  );

  const logout = useCallback(async (reason: 'manual' | 'inactivity' = 'manual') => {
    await setToken(null);
    setUser(null);
    await RoleStorage.set('student');
    if (reason === 'inactivity') {
      // Small notice · user comes back to a fresh login screen with context
      Alert.alert('自動登出', '因為 10 分鐘冇任何操作 · 為咗保護你嘅私隱 · 系統已經自動登出。請重新登入。');
    }
  }, []);

  // === Inactivity auto-logout timer ===
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);
  const scheduleIdle = useCallback(() => {
    clearIdle();
    idleTimerRef.current = setTimeout(() => {
      logout('inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearIdle, logout]);
  const ping = useCallback(() => {
    // Only re-arm the timer when someone is actually logged in
    if (user) scheduleIdle();
  }, [user, scheduleIdle]);

  // Start / stop the idle timer alongside user login state
  useEffect(() => {
    if (user) {
      scheduleIdle();
      onApiActivity(ping);
    } else {
      clearIdle();
      onApiActivity(null);
    }
    return clearIdle;
  }, [user, scheduleIdle, clearIdle, ping]);

  // When app goes to background then returns · assume user was away; force logout if too long
  useEffect(() => {
    let leftAt: number | null = null;
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'background' || s === 'inactive') {
        leftAt = Date.now();
      } else if (s === 'active' && leftAt) {
        const gone = Date.now() - leftAt;
        leftAt = null;
        if (user && gone >= INACTIVITY_TIMEOUT_MS) {
          logout('inactivity');
        } else if (user) {
          scheduleIdle();
        }
      }
    });
    return () => sub.remove();
  }, [user, scheduleIdle, logout]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
      await syncRole(me);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser, ping }),
    [user, loading, login, register, logout, refreshUser, ping],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
