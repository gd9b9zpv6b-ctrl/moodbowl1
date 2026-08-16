/**
 * PDPO data-subject rights · implemented on Supabase (FastAPI /me/export is offline).
 *
 * - Access / portability: exportMyData → JSON the user can download / share
 * - Erasure: eraseMyData → wipe user-owned rows the client can delete under RLS
 *
 * Auth shell (email login) may remain until privacy@ completes full account purge
 * if `auth.admin` RPC is unavailable — personal diary content is still wiped.
 */

import { Platform, Share } from 'react-native';

import { supabase } from '@/src/lib/supabase-client';

export type PrivacyExportBundle = {
  exported_at: string;
  scheme: 'moodbowl-pdpo-export-v1';
  note: string;
  user: {
    id: string;
    email: string | null;
    display_name: string | null;
    role: string | null;
    class_name: string | null;
    school_id: string | null;
  };
  entries: unknown[];
  tasks: unknown[];
  regulation_history: unknown[];
  reactions: unknown[];
  alerts_about_me: unknown[];
};

async function requireSessionUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new Error('登入已過期 · 請再登入一次先匯出／刪除');
  }
  return session.user;
}

export async function exportMyData(): Promise<PrivacyExportBundle> {
  const user = await requireSessionUser();

  const [profileRes, diariesRes, tasksRes, histRes, reactRes, alertsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('diaries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('relax_games_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('diary_reactions').select('*').eq('user_id', user.id),
    supabase
      .from('alerts')
      .select('id, created_at, status, matched_keywords, alert_type, source')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (diariesRes.error) {
    throw new Error(diariesRes.error.message || '讀取日記失敗');
  }

  const profile = profileRes.data;

  return {
    exported_at: new Date().toISOString(),
    scheme: 'moodbowl-pdpo-export-v1',
    note:
      '呢個係你喺 MoodBowl 嘅個人資料副本（《個人資料（私隱）條例》查閱／可攜權利）。日記原文只屬於你。',
    user: {
      id: user.id,
      email: user.email ?? null,
      display_name: profile?.display_name ?? null,
      role: profile?.role ?? null,
      class_name: profile?.class_name ?? null,
      school_id: profile?.school_id ?? null,
    },
    entries: diariesRes.data || [],
    tasks: tasksRes.error ? [] : tasksRes.data || [],
    regulation_history: histRes.error ? [] : histRes.data || [],
    reactions: reactRes.error ? [] : reactRes.data || [],
    alerts_about_me: alertsRes.error ? [] : alertsRes.data || [],
  };
}

/** Download / share the export bundle as a JSON file when possible. */
export async function deliverExportFile(bundle: PrivacyExportBundle): Promise<'downloaded' | 'shared' | 'copied'> {
  const json = JSON.stringify(bundle, null, 2);
  const stamp = bundle.exported_at.slice(0, 10);
  const filename = `moodbowl-my-data-${stamp}.json`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  try {
    await Share.share({
      title: filename,
      message: json.length > 12000 ? `${json.slice(0, 12000)}\n…（內容太長 · 請用網頁版下載完整檔）` : json,
    });
    return 'shared';
  } catch {
    // last resort · still return bundle to caller for Alert summary
    return 'copied';
  }
}

export type EraseResult = {
  diaries: number;
  tasks: number;
  reactions: number;
  regulation_history: number;
};

/**
 * Wipe user-owned personal data under RLS.
 * Does not claim 7-year alert retention is complete unless staff RPC exists —
 * we still clear diary content the user can delete.
 */
export async function eraseMyData(): Promise<EraseResult> {
  const user = await requireSessionUser();
  const uid = user.id;

  const countDel = async (table: string) => {
    const { data, error } = await supabase.from(table).delete().eq('user_id', uid).select('id');
    if (error) {
      // Table may be missing / no policy — treat as 0 rather than block erasure of diaries
      return 0;
    }
    return data?.length ?? 0;
  };

  const reactions = await countDel('diary_reactions');
  const regulation_history = await countDel('relax_games_history');
  const tasks = await countDel('tasks');
  const diaries = await countDel('diaries');

  // Soft-clear profile display fields (cannot delete auth.users from anon key)
  try {
    await supabase
      .from('profiles')
      .update({
        display_name: '(已刪除)',
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);
  } catch {
    // ignore
  }

  // Best-effort: security-definer RPC if school deployed migration 008
  const { error: rpcError } = await supabase.rpc('delete_own_account');
  if (!rpcError) {
    // Auth user already removed by RPC
    return { diaries, tasks, reactions, regulation_history };
  }

  await supabase.auth.signOut();

  return { diaries, tasks, reactions, regulation_history };
}
