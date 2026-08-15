import { asArray, Entry } from '@/src/lib/api';
import { soupForDb } from '@/src/lib/ritual/soup-persist';
import { supabase } from '@/src/lib/supabase-client';

/**
 * Phase 2 diary adapter.
 * Prefers legacy columns (entry_date, emotions, energy_level, is_secret, hearts)
 * when present, with bridge fallbacks onto ritual/quick-diary columns.
 */

type DiaryRow = {
  id: string;
  user_id: string;
  soup: string | null;
  body_chips: string[] | null;
  bowl_emotion_key: string | null;
  bowl_color_tint?: string | null;
  bowl_size?: string | null;
  bowl_steam: string | null;
  diary_text: string | null;
  check_in_type: string;
  is_public: boolean;
  shared_with_class?: boolean;
  shared_with_family?: boolean;
  smile_completed?: boolean;
  time_spent_sec: number | null;
  ritual_version?: string | null;
  created_at: string;
  updated_at: string;
  // Phase 2 legacy columns (optional until migration applied everywhere)
  entry_date?: string | null;
  emotions?: string[] | null;
  energy_level?: number | null;
  is_secret?: boolean | null;
  hearts?: number | null;
  // Optional join / embed shapes
  profiles?: { display_name?: string | null } | null;
  diary_reactions?: { count?: number }[] | { user_id: string }[] | null;
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
  if (message.includes('diaries_soup_check') || message.includes('soup_check')) {
    return new Error('飲品資料未更新 · 請重新揀一次飲品');
  }
  if (error?.message) {
    return new Error(`日記儲存唔到 · ${error.message}`);
  }
  return new Error('日記儲存唔到 · 過陣再試');
}

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('could not find') ||
    message.includes('schema cache') ||
    error?.code === 'PGRST204' ||
    error?.code === '42703'
  );
}

export function diaryRowToEntry(row: DiaryRow, extras?: { hearted_by_me?: boolean; hearts?: number }): Entry {
  const chips = Array.isArray(row.body_chips) ? row.body_chips.filter(Boolean) : [];
  const legacyEmotions = Array.isArray(row.emotions) ? row.emotions.filter(Boolean) : [];
  const isRitual =
    row.check_in_type === 'full' ||
    row.check_in_type === 'hug_only' ||
    row.check_in_type === 'skipped';

  let emotions: string[];
  if (legacyEmotions.length > 0) {
    emotions = legacyEmotions;
  } else if (isRitual) {
    emotions = row.bowl_emotion_key ? [row.bowl_emotion_key] : [];
  } else if (chips.length > 0) {
    emotions = chips;
  } else {
    emotions = row.bowl_emotion_key ? [row.bowl_emotion_key] : [];
  }

  const isSecret =
    typeof row.is_secret === 'boolean' ? row.is_secret : row.bowl_steam === 'secret';

  const energyLevel =
    typeof row.energy_level === 'number'
      ? row.energy_level
      : !isRitual && typeof row.time_spent_sec === 'number'
        ? row.time_spent_sec
        : null;

  const entryDate =
    typeof row.entry_date === 'string' && row.entry_date
      ? String(row.entry_date).slice(0, 10)
      : dateKeyFromTimestamp(row.created_at);

  const heartsFromEmbed = Array.isArray(row.diary_reactions)
    ? row.diary_reactions.length === 1 &&
      typeof (row.diary_reactions[0] as { count?: number })?.count === 'number'
      ? (row.diary_reactions[0] as { count: number }).count
      : row.diary_reactions.length
    : undefined;

  const hearts =
    extras?.hearts ??
    (typeof row.hearts === 'number' ? row.hearts : undefined) ??
    heartsFromEmbed ??
    0;

  const displayName =
    row.profiles && typeof row.profiles === 'object'
      ? row.profiles.display_name ?? null
      : null;

  return {
    id: row.id,
    user_id: row.user_id,
    display_name: displayName,
    emotion: emotions[0] || row.bowl_emotion_key || '',
    emotions,
    note: row.diary_text || '',
    is_public: !!row.is_public,
    is_secret: isSecret,
    energy_level: energyLevel,
    entry_date: entryDate,
    created_at: row.created_at,
    hearts,
    hearted_by_me: !!extras?.hearted_by_me,
    bowl_color_tint: row.bowl_color_tint ?? null,
    bowl_size: row.bowl_size ?? null,
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

function toBridgePayload(userId: string, draft: DiaryDraft) {
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

function toLegacyAwarePayload(userId: string, draft: DiaryDraft) {
  const emotions = (draft.emotions || []).filter(Boolean);
  const isSecret = !!draft.is_secret;
  const bridge = toBridgePayload(userId, draft);
  return {
    ...bridge,
    emotions,
    entry_date: draft.entry_date || localDateKey(),
    energy_level:
      typeof draft.energy_level === 'number' && Number.isFinite(draft.energy_level)
        ? Math.round(draft.energy_level)
        : null,
    is_secret: isSecret,
  };
}

export async function createDiaryEntry(draft: DiaryDraft): Promise<Entry> {
  const userId = await requireUserId();
  if (!draft.emotions?.length) {
    throw new Error('揀至少一個心情先啦');
  }

  const full = await supabase
    .from('diaries')
    .insert(toLegacyAwarePayload(userId, draft))
    .select('*')
    .single();

  if (!full.error && full.data) {
    return diaryRowToEntry(full.data as DiaryRow);
  }

  if (isMissingColumnError(full.error)) {
    const fallback = await supabase
      .from('diaries')
      .insert(toBridgePayload(userId, draft))
      .select('*')
      .single();
    if (fallback.error || !fallback.data) throw friendlyDiaryError(fallback.error);
    return diaryRowToEntry(fallback.data as DiaryRow);
  }

  throw friendlyDiaryError(full.error);
}

export type RitualDiaryDraft = {
  soup: string | null;
  body_chips: string[];
  bowl_emotion_key: string | null;
  bowl_color_tint: string | null;
  bowl_size: 'S' | 'M' | 'L' | 'XL';
  diary_text: string | null;
  check_in_type: 'full' | 'hug_only';
  is_public: boolean;
  shared_with_class: boolean;
  shared_with_family: boolean;
  smile_completed?: boolean;
  time_spent_sec: number | null;
};

function ritualBridgePayload(userId: string, draft: RitualDiaryDraft) {
  return {
    user_id: userId,
    soup: soupForDb(draft.soup),
    body_chips: draft.body_chips || [],
    bowl_emotion_key: draft.bowl_emotion_key,
    bowl_color_tint: draft.bowl_color_tint,
    bowl_size: draft.bowl_size || 'M',
    diary_text: draft.diary_text?.trim() || null,
    check_in_type: draft.check_in_type,
    is_public: !!draft.is_public,
    shared_with_class: !!draft.shared_with_class,
    shared_with_family: !!draft.shared_with_family,
    smile_completed: !!draft.smile_completed,
    time_spent_sec:
      typeof draft.time_spent_sec === 'number' && Number.isFinite(draft.time_spent_sec)
        ? Math.max(0, Math.round(draft.time_spent_sec))
        : null,
    ritual_version: 'v1' as const,
  };
}

function ritualLegacyAwarePayload(userId: string, draft: RitualDiaryDraft) {
  const bowlKey = draft.bowl_emotion_key;
  return {
    ...ritualBridgePayload(userId, draft),
    emotions: bowlKey ? [bowlKey] : [],
    entry_date: localDateKey(),
    is_secret: false,
  };
}

/** Full ritual check-in · writes ritual + Phase 2 columns when available. */
export async function createRitualDiaryEntry(draft: RitualDiaryDraft): Promise<Entry> {
  const userId = await requireUserId();
  if (!draft.bowl_emotion_key && draft.check_in_type !== 'hug_only') {
    throw new Error('未揀好碗 · 返去再試');
  }

  const full = await supabase
    .from('diaries')
    .insert(ritualLegacyAwarePayload(userId, draft))
    .select('*')
    .single();

  if (!full.error && full.data) {
    return diaryRowToEntry(full.data as DiaryRow);
  }

  if (isMissingColumnError(full.error)) {
    const fallback = await supabase
      .from('diaries')
      .insert(ritualBridgePayload(userId, draft))
      .select('*')
      .single();
    if (fallback.error || !fallback.data) throw friendlyDiaryError(fallback.error);
    return diaryRowToEntry(fallback.data as DiaryRow);
  }

  throw friendlyDiaryError(full.error);
}

export async function markRitualSmileCompleted(id: string): Promise<void> {
  await requireUserId();
  const { error } = await supabase
    .from('diaries')
    .update({ smile_completed: true })
    .eq('id', id);
  if (error) throw friendlyDiaryError(error);
}

export async function listMyDiaryEntries(): Promise<Entry[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw friendlyDiaryError(error);
  return asArray(data as DiaryRow[] | null).map((row) => diaryRowToEntry(row));
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
    .map((row) => diaryRowToEntry(row))
    .filter((entry) => entry.entry_date.startsWith(month));
}

export async function updateDiaryEntry(
  id: string,
  patch: Partial<Pick<DiaryDraft, 'emotions' | 'note' | 'is_public' | 'is_secret' | 'energy_level'>>,
): Promise<Entry> {
  await requireUserId();
  const bridge: Record<string, unknown> = {};
  const legacy: Record<string, unknown> = {};

  if (patch.emotions) {
    const emotions = patch.emotions.filter(Boolean);
    if (emotions.length === 0) throw new Error('揀至少一個心情先啦');
    bridge.body_chips = emotions;
    bridge.bowl_emotion_key = emotions[0];
    legacy.emotions = emotions;
  }
  if (typeof patch.note === 'string') {
    bridge.diary_text = patch.note.trim() || null;
  }
  if (typeof patch.is_secret === 'boolean') {
    bridge.bowl_steam = patch.is_secret ? 'secret' : null;
    legacy.is_secret = patch.is_secret;
    if (patch.is_secret) {
      bridge.is_public = false;
      legacy.is_public = false;
    }
  }
  if (typeof patch.is_public === 'boolean') {
    const nextPublic = patch.is_public && patch.is_secret !== true;
    bridge.is_public = nextPublic;
    legacy.is_public = nextPublic;
  }
  if (patch.energy_level !== undefined) {
    const energy =
      typeof patch.energy_level === 'number' && Number.isFinite(patch.energy_level)
        ? Math.round(patch.energy_level)
        : null;
    bridge.time_spent_sec = energy;
    legacy.energy_level = energy;
  }

  const fullUpdate = { ...bridge, ...legacy };
  const full = await supabase
    .from('diaries')
    .update(fullUpdate)
    .eq('id', id)
    .select('*')
    .single();

  if (!full.error && full.data) {
    return diaryRowToEntry(full.data as DiaryRow);
  }

  if (isMissingColumnError(full.error)) {
    const fallback = await supabase
      .from('diaries')
      .update(bridge)
      .eq('id', id)
      .select('*')
      .single();
    if (fallback.error || !fallback.data) throw friendlyDiaryError(fallback.error);
    return diaryRowToEntry(fallback.data as DiaryRow);
  }

  throw friendlyDiaryError(full.error);
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await requireUserId();
  const { error } = await supabase.from('diaries').delete().eq('id', id);
  if (error) throw friendlyDiaryError(error);
}

/** Toggle heart reaction on a public diary via diary_reactions. Soft-fails with friendly error. */
export async function toggleDiaryReaction(diaryId: string): Promise<{ hearts: number; hearted_by_me: boolean }> {
  const userId = await requireUserId();

  const existing = await supabase
    .from('diary_reactions')
    .select('diary_id, user_id')
    .eq('diary_id', diaryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.error && !isMissingColumnError(existing.error)) {
    throw friendlyDiaryError(existing.error);
  }

  if (existing.data) {
    const { error } = await supabase
      .from('diary_reactions')
      .delete()
      .eq('diary_id', diaryId)
      .eq('user_id', userId);
    if (error) throw friendlyDiaryError(error);
  } else if (!existing.error) {
    const { error } = await supabase
      .from('diary_reactions')
      .insert({ diary_id: diaryId, user_id: userId });
    if (error) throw friendlyDiaryError(error);
  } else {
    // Reactions table missing · soft no-op
    return { hearts: 0, hearted_by_me: false };
  }

  const countRes = await supabase
    .from('diary_reactions')
    .select('user_id', { count: 'exact', head: true })
    .eq('diary_id', diaryId);

  const hearts = typeof countRes.count === 'number' ? countRes.count : 0;
  const hearted_by_me = !existing.data;
  return { hearts, hearted_by_me };
}

/** Public community feed · soft-fails to []. */
export async function listCommunityDiaries(): Promise<Entry[]> {
  try {
    await requireUserId();
  } catch {
    return [];
  }

  try {
    let rows: DiaryRow[] | null = null;

    const withProfile = await supabase
      .from('diaries')
      .select('*, profiles(display_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!withProfile.error && withProfile.data) {
      rows = withProfile.data as DiaryRow[];
    } else {
      const plain = await supabase
        .from('diaries')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (plain.error || !plain.data) return [];
      rows = plain.data as DiaryRow[];
    }

    const list = asArray(rows);
    if (list.length === 0) return [];

    const ids = list.map((r) => r.id);
    let reactionCounts = new Map<string, number>();
    let myReactions = new Set<string>();

    try {
      const userId = await requireUserId();
      const reactions = await supabase
        .from('diary_reactions')
        .select('diary_id, user_id')
        .in('diary_id', ids);

      if (!reactions.error && reactions.data) {
        reactionCounts = new Map();
        for (const r of reactions.data as { diary_id: string; user_id: string }[]) {
          reactionCounts.set(r.diary_id, (reactionCounts.get(r.diary_id) || 0) + 1);
          if (r.user_id === userId) myReactions.add(r.diary_id);
        }
      }
    } catch {
      // Reactions optional
    }

    return list.map((row) =>
      diaryRowToEntry(row, {
        hearts: reactionCounts.has(row.id)
          ? reactionCounts.get(row.id)!
          : typeof row.hearts === 'number'
            ? row.hearts
            : 0,
        hearted_by_me: myReactions.has(row.id),
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Prefer atomic RPC when available; otherwise create ritual diary + activity rows.
 */
export async function saveRitualWithActivities(
  draft: RitualDiaryDraft,
  regulationKeys: string[],
): Promise<Entry> {
  const userId = await requireUserId();
  const keys = (regulationKeys || []).filter(Boolean);

  try {
    const { data, error } = await supabase.rpc('save_ritual_entry', {
      p_soup: soupForDb(draft.soup),
      p_body_chips: draft.body_chips || [],
      p_bowl_emotion_key: draft.bowl_emotion_key,
      p_bowl_color_tint: draft.bowl_color_tint,
      p_bowl_size: draft.bowl_size || 'M',
      p_diary_text: draft.diary_text?.trim() || null,
      p_check_in_type: draft.check_in_type,
      p_is_public: !!draft.is_public,
      p_shared_with_class: !!draft.shared_with_class,
      p_shared_with_family: !!draft.shared_with_family,
      p_smile_completed: !!draft.smile_completed,
      p_time_spent_sec:
        typeof draft.time_spent_sec === 'number' && Number.isFinite(draft.time_spent_sec)
          ? Math.max(0, Math.round(draft.time_spent_sec))
          : null,
      p_regulation_keys: keys,
    });

    if (!error && data) {
      if (typeof data === 'object' && data !== null && 'id' in (data as object)) {
        return diaryRowToEntry(data as DiaryRow);
      }
      if (Array.isArray(data) && data[0]) {
        return diaryRowToEntry(data[0] as DiaryRow);
      }
    }
  } catch {
    // Fall through to client-side write path.
  }

  const entry = await createRitualDiaryEntry(draft);

  for (const activityKey of keys) {
    try {
      await supabase.from('relax_games_history').insert({
        user_id: userId,
        diary_id: entry.id,
        activity_key: activityKey,
        completed: true,
      });
    } catch {
      // Activity log is best-effort when RPC is unavailable.
    }
  }

  return entry;
}
