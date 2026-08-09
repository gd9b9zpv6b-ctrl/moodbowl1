import { asArray, Entry } from '@/src/lib/api';
import { supabase } from '@/src/lib/supabase-client';

/**
 * Phase 2 diary adapter.
 * Maps the existing home／calendar `Entry` shape onto live `public.diaries`
 * columns until the ritual schema fully replaces the quick-diary UI.
 *
 * Live columns used today:
 * - body_chips ← emotions[]
 * - bowl_emotion_key ← primary emotion
 * - diary_text ← note
 * - bowl_steam ← 'secret' marker for is_secret
 * - time_spent_sec ← energy_level (temporary bridge)
 * - entry_date derived from created_at in the device timezone
 */

type DiaryRow = {
  id: string;
  user_id: string;
  soup: string | null;
  body_chips: string[] | null;
  bowl_emotion_key: string | null;
  bowl_steam: string | null;
  diary_text: string | null;
  check_in_type: string;
  is_public: boolean;
  time_spent_sec: number | null;
  created_at: string;
  updated_at: string;
};

export type DiaryDraft = {
  emotions: string[];
  note?: string;
  is_public?: boolean;
  is_secret?: boolean;
  energy_level?: number | null;
  entry_date?: string;
};

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateKeyFromTimestamp(iso: string) {
  return localDateKey(new Date(iso));
}

function friendlyDiaryError(error: { message?: string } | null): Error {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('jwt') || message.includes('session')) {
    return new Error('登入已過期 · 請再登入一次');
  }
  if (message.includes('row-level security') || message.includes('permission')) {
    return new Error('而家未有權限寫日記 · 請確認已登入');
  }
  return new Error('日記儲存唔到 · 過陣再試');
}

export function diaryRowToEntry(row: DiaryRow): Entry {
  const emotions =
    Array.isArray(row.body_chips) && row.body_chips.length > 0
      ? row.body_chips.filter(Boolean)
      : row.bowl_emotion_key
        ? [row.bowl_emotion_key]
        : [];

  return {
    id: row.id,
    user_id: row.user_id,
    display_name: null,
    emotion: emotions[0] || row.bowl_emotion_key || '',
    emotions,
    note: row.diary_text || '',
    is_public: !!row.is_public,
    is_secret: row.bowl_steam === 'secret',
    energy_level: typeof row.time_spent_sec === 'number' ? row.time_spent_sec : null,
    entry_date: dateKeyFromTimestamp(row.created_at),
    created_at: row.created_at,
    hearts: 0,
    hearted_by_me: false,
  };
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    throw new Error('請先登入再寫日記');
  }
  return session.user.id;
}

function toInsertPayload(userId: string, draft: DiaryDraft) {
  const emotions = (draft.emotions || []).filter(Boolean);
  const isSecret = !!draft.is_secret;
  return {
    user_id: userId,
    body_chips: emotions,
    bowl_emotion_key: emotions[0] || null,
    diary_text: (draft.note || '').trim() || null,
    check_in_type: 'quick_diary' as const,
    is_public: !!draft.is_public && !isSecret,
    bowl_steam: isSecret ? 'secret' : null,
    time_spent_sec:
      typeof draft.energy_level === 'number' && Number.isFinite(draft.energy_level)
        ? Math.round(draft.energy_level)
        : null,
    smile_completed: false,
    ritual_version: 'v1',
  };
}

export async function createDiaryEntry(draft: DiaryDraft): Promise<Entry> {
  const userId = await requireUserId();
  if (!draft.emotions?.length) {
    throw new Error('揀至少一個心情先啦');
  }

  const { data, error } = await supabase
    .from('diaries')
    .insert(toInsertPayload(userId, draft))
    .select('*')
    .single();

  if (error || !data) throw friendlyDiaryError(error);
  return diaryRowToEntry(data as DiaryRow);
}

export async function listMyDiaryEntries(): Promise<Entry[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw friendlyDiaryError(error);
  return asArray(data as DiaryRow[] | null).map(diaryRowToEntry);
}

export async function listMyDiaryEntriesForMonth(month: string): Promise<Entry[]> {
  await requireUserId();
  // month = YYYY-MM · pad one day on each side for timezone edges
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .gte('created_at', new Date(start.getTime() - 36 * 60 * 60 * 1000).toISOString())
    .lt('created_at', new Date(end.getTime() + 36 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw friendlyDiaryError(error);
  return asArray(data as DiaryRow[] | null)
    .map(diaryRowToEntry)
    .filter((entry) => entry.entry_date.startsWith(month));
}

export async function updateDiaryEntry(
  id: string,
  patch: Partial<Pick<DiaryDraft, 'emotions' | 'note' | 'is_public' | 'is_secret' | 'energy_level'>>,
): Promise<Entry> {
  await requireUserId();
  const next: Record<string, unknown> = {};

  if (patch.emotions) {
    const emotions = patch.emotions.filter(Boolean);
    if (emotions.length === 0) throw new Error('揀至少一個心情先啦');
    next.body_chips = emotions;
    next.bowl_emotion_key = emotions[0];
  }
  if (typeof patch.note === 'string') {
    next.diary_text = patch.note.trim() || null;
  }
  if (typeof patch.is_secret === 'boolean') {
    next.bowl_steam = patch.is_secret ? 'secret' : null;
    if (patch.is_secret) next.is_public = false;
  }
  if (typeof patch.is_public === 'boolean') {
    next.is_public = patch.is_public && patch.is_secret !== true;
  }
  if (patch.energy_level !== undefined) {
    next.time_spent_sec =
      typeof patch.energy_level === 'number' && Number.isFinite(patch.energy_level)
        ? Math.round(patch.energy_level)
        : null;
  }

  const { data, error } = await supabase
    .from('diaries')
    .update(next)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw friendlyDiaryError(error);
  return diaryRowToEntry(data as DiaryRow);
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await requireUserId();
  const { error } = await supabase.from('diaries').delete().eq('id', id);
  if (error) throw friendlyDiaryError(error);
}
