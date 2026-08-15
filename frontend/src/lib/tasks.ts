import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Task } from '@/src/lib/api';
import { asArray } from '@/src/lib/api';
import { supabase } from '@/src/lib/supabase-client';

const LOCAL_KEY = '@moodbowl/tasks/v1';

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  task_date: string;
  created_at: string;
};

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    completed: !!row.completed,
    task_date: String(row.task_date).slice(0, 10),
    created_at: row.created_at,
  };
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('請先登入');
  return session.user.id;
}

async function readLocal(userId: string, taskDate: string): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(`${LOCAL_KEY}/${userId}`);
    const all = raw ? (JSON.parse(raw) as Task[]) : [];
    return asArray(all).filter((t) => t?.task_date === taskDate);
  } catch {
    return [];
  }
}

async function writeLocal(userId: string, taskDate: string, dayTasks: Task[]) {
  const raw = await AsyncStorage.getItem(`${LOCAL_KEY}/${userId}`);
  const all = raw ? (JSON.parse(raw) as Task[]) : [];
  const others = asArray(all).filter((t) => t?.task_date !== taskDate);
  await AsyncStorage.setItem(`${LOCAL_KEY}/${userId}`, JSON.stringify([...others, ...dayTasks]));
}

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

export async function listTasksForDate(taskDate = localDateKey()): Promise<Task[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_date', taskDate)
    .order('created_at', { ascending: true });

  if (!error) return asArray(data as TaskRow[] | null).map(rowToTask);
  if (isMissingTable(error)) return readLocal(userId, taskDate);
  throw new Error('小習慣載入唔到 · 過陣再試');
}

export async function createTask(title: string, taskDate = localDateKey()): Promise<Task> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) throw new Error('寫低想做嘅小事先啦');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: trimmed,
      task_date: taskDate,
      completed: false,
    })
    .select('*')
    .single();

  if (!error && data) return rowToTask(data as TaskRow);

  if (isMissingTable(error)) {
    const local: Task = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      title: trimmed,
      completed: false,
      task_date: taskDate,
      created_at: new Date().toISOString(),
    };
    const day = await readLocal(userId, taskDate);
    await writeLocal(userId, taskDate, [...day, local]);
    return local;
  }

  throw new Error('加唔到呢件小事 · 過陣再試');
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task> {
  const userId = await requireUserId();

  if (!id.startsWith('local-')) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select('*')
      .single();
    if (!error && data) return rowToTask(data as TaskRow);
    if (!isMissingTable(error)) throw new Error('更新唔到 · 過陣再試');
  }

  // Local fallback (or local-* ids)
  const today = localDateKey();
  // Search a few nearby days? Keep simple · scan stored blob
  const raw = await AsyncStorage.getItem(`${LOCAL_KEY}/${userId}`);
  const all = asArray(raw ? (JSON.parse(raw) as Task[]) : []);
  const next = all.map((t) => (t.id === id ? { ...t, completed } : t));
  await AsyncStorage.setItem(`${LOCAL_KEY}/${userId}`, JSON.stringify(next));
  const found = next.find((t) => t.id === id);
  if (!found) {
    // Also try updating supabase-miss path by rewriting today's list
    const day = await readLocal(userId, today);
    const dayNext = day.map((t) => (t.id === id ? { ...t, completed } : t));
    await writeLocal(userId, today, dayNext);
    const again = dayNext.find((t) => t.id === id);
    if (!again) throw new Error('搵唔到呢件小事');
    return again;
  }
  return found;
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await requireUserId();

  if (!id.startsWith('local-')) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error('刪除唔到 · 過陣再試');
  }

  const raw = await AsyncStorage.getItem(`${LOCAL_KEY}/${userId}`);
  const all = asArray(raw ? (JSON.parse(raw) as Task[]) : []);
  await AsyncStorage.setItem(
    `${LOCAL_KEY}/${userId}`,
    JSON.stringify(all.filter((t) => t.id !== id)),
  );
}
