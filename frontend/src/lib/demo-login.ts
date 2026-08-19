import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

import type { User } from '@/src/lib/api';
import { DEMO_PASSWORD, demoRoleForEmail } from '@/src/lib/demo-accounts';
import type { UserRole } from '@/src/lib/role-storage';
import { supabase } from '@/src/lib/supabase-client';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function userFromSession(authUser: SupabaseUser, role: UserRole): User {
  const metaName =
    (typeof authUser.user_metadata?.display_name === 'string' &&
      authUser.user_metadata.display_name) ||
    authUser.email?.split('@')[0] ||
    '朋友';

  return {
    id: authUser.id,
    email: authUser.email || '',
    display_name: metaName,
    created_at: authUser.created_at || new Date().toISOString(),
    credits: 0,
    is_premium: false,
    is_admin: role === 'school_admin',
    has_secret_pin: false,
    diary_style: {},
    active_icon_pack: 'classic',
    featured_by_date: {},
    role,
  };
}

/**
 * Demo / preview login that bypasses supabase-js lock + FastAPI hydrate.
 * Uses the password grant REST endpoint, then seeds the local session.
 */
export async function signInDemoAccount(email: string, roleHint?: UserRole): Promise<User> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('登入設定未齊 · 請重新開啟 App');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let payload: any;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: DEMO_PASSWORD,
      }),
      signal: controller.signal,
    });
    payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload?.error_description || payload?.msg || payload?.error || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('登入逾時 · 請再試一次');
    throw e instanceof Error ? e : new Error('登入失敗');
  } finally {
    clearTimeout(timer);
  }

  if (!payload?.access_token || !payload?.refresh_token || !payload?.user) {
    throw new Error('登入未完成 · 請再試一次');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (sessionError) {
    // Never route with only an in-memory user: Supabase RLS would treat diary
    // reads/writes as anonymous, making saved data look missing.
    throw new Error('登入未完成 · 請再試一次');
  }

  const sessionUser = sessionData.session?.user;
  if (!sessionUser || sessionUser.id !== payload.user.id) {
    throw new Error('登入未完成 · 請再試一次');
  }

  const role =
    roleHint ||
    demoRoleForEmail(payload.user.email || email) ||
    'student';

  return userFromSession(sessionUser, role);
}

export type { Session };
