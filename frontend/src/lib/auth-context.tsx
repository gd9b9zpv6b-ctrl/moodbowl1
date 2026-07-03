import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, loadToken, setToken, User, AuthResponse } from './api';
import { RoleStorage, UserRole } from './role-storage';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User | null) => void;
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
    },
    [],
  );

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
    // Reset role storage so next login starts fresh
    await RoleStorage.set('student');
  }, []);

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
    () => ({ user, loading, login, register, logout, refreshUser, setUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
