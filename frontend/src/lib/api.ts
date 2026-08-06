import { storage } from '@/src/utils/storage';
import { supabase } from './supabase-client';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const TOKEN_KEY = 'moodful_token';

let cachedToken: string | null = null;

// Optional callback fired on every request · auth-context registers a ping()
// here so the inactivity timer resets whenever the user does something meaningful.
let activityListener: (() => void) | null = null;
export function onApiActivity(cb: (() => void) | null) {
  activityListener = cb;
}

// Auth-context also registers here · called when a request returns 401 so we
// can force-logout the user (clear their token + navigate to login).
let authInvalidHandler: (() => void) | null = null;
export function onAuthInvalid(cb: (() => void) | null) {
  authInvalidHandler = cb;
}

export async function loadToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const t = await storage.secureGet<string>(TOKEN_KEY, '');
  cachedToken = t && t.length > 0 ? t : null;
  return cachedToken;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) {
    await storage.secureSet(TOKEN_KEY, token);
  } else {
    await storage.secureRemove(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Supabase owns normal sessions from Phase 1 onward. The stored legacy token
  // remains only for invite-code activation until that flow moves in Phase 4.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token || (await loadToken());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  // Notify auth-context that user is active — refreshes inactivity timer.
  try { activityListener?.(); } catch { /* noop */ }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    if (res.status === 401) {
      // Session invalid · immediately clear cached token + notify auth-context
      cachedToken = null;
      await storage.secureRemove(TOKEN_KEY);
      try { authInvalidHandler?.(); } catch { /* noop */ }
    }
    const detail = json?.detail || `Request failed (${res.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return json as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p, { method: 'GET' }),
  post: <T>(p: string, body?: any) =>
    request<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: any) =>
    request<T>(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body?: any) =>
    request<T>(p, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};

// Types
export type DiaryStyle = {
  bg?: string;
  font_family?: string;
  font_size?: number;
  text_color?: string;
  paper_tint?: string;    // 'cream' | 'mint' | 'sky' | 'rose' | 'sand' | 'night'
  paper_kind?: string;    // 'ruled' | 'grid' | 'dot' | 'none'
};

export type User = {
  id: string;
  email: string;
  display_name?: string | null;
  created_at: string;
  credits: number;
  is_premium: boolean;
  is_admin: boolean;
  has_secret_pin: boolean;
  diary_style: DiaryStyle;
  active_icon_pack: string;
  featured_by_date?: Record<string, string>;
  role?: string;  // student | teacher | parent | counsellor | school_admin
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Entry = {
  id: string;
  user_id: string;
  display_name?: string | null;
  emotion: string;                // primary (first of list)
  emotions: string[];             // multi-select list
  note: string;
  is_public: boolean;
  is_secret?: boolean;
  energy_level?: number | null;   // 0-100 battery slider
  entry_date: string;
  created_at: string;
  hearts: number;
  hearted_by_me: boolean;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  task_date: string;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  prompt_key: string;
  prompt_text: string;
  stage: string;
  response: string;
  created_at: string;
};
