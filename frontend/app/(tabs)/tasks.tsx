import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HABITS } from '@/src/constants/habits';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Task } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Tasks() {
  const today = useMemo(() => todayISO(), []);
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [rewardFlash, setRewardFlash] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.get<Task[]>(`/tasks?task_date=${today}`);
      setTasks(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
      refreshUser();
    }, [load, refreshUser]),
  );

  const addTask = async (title: string) => {
    const t = title.trim();
    if (!t) return;
    setAdding(true);
    try {
      const created = await api.post<Task>('/tasks', {
        title: t,
        task_date: today,
      });
      setTasks((prev) => [...prev, created]);
      if (title === newTitle) setNewTitle('');
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (t: Task) => {
    const next = !t.completed;
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: next } : x)));
    try {
      await api.patch<Task>(`/tasks/${t.id}`, { completed: next });
      await refreshUser();
      if (next) {
        setRewardFlash(true);
        setTimeout(() => setRewardFlash(false), 1600);
      }
    } catch {
      load();
    }
  };

  const remove = async (id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id));
    try {
      await api.del(`/tasks/${id}`);
    } catch {
      load();
    }
  };

  const done = tasks.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} testID="tasks-title">
                小小溫柔事
              </Text>
              <Text style={styles.subtitle}>
                一次做一件小事{'\n'}今日已完成 {done} / {tasks.length}
              </Text>
            </View>
            <View style={styles.creditBadge} testID="credits-badge">
              <Feather name="heart" size={16} color="#E86A6A" />
              <Text style={styles.creditText}>{user?.credits ?? 0}</Text>
            </View>
          </View>

          {rewardFlash && (
            <View style={styles.rewardFlash} testID="reward-flash">
              <Feather name="heart" size={16} color="#E86A6A" />
              <Text style={styles.rewardText}>+1 小心心 · 為自己驕傲一下</Text>
            </View>
          )}

          <Pressable
            testID="tasks-garden-card"
            onPress={() => router.push('/garden')}
            style={styles.gardenCard}
          >
            <View style={styles.gardenEmojiWrap}>
              <Text style={styles.gardenEmoji}>🌾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gardenTitle}>我嘅稻田</Text>
              <Text style={styles.gardenSub}>用心心種一粒米 · 收成一碗新心情</Text>
            </View>
            <View style={styles.gardenBadge}>
              <Text style={styles.gardenBadgeText}>新</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
          </Pressable>

          <Text style={styles.sectionTitle}>習慣庫</Text>
          <Text style={styles.sectionHint}>撳一下 加入今日</Text>
          <View style={styles.habitList}>
            {HABITS.map((h) => (
              <Pressable
                key={h.key}
                testID={`habit-${h.key}`}
                style={[styles.habitChip, { backgroundColor: h.color + 'B0' }]}
                onPress={() => addTask(h.title)}
              >
                <Feather name={h.icon as any} size={18} color={COLORS.textPrimary} />
                <Text style={styles.habitText} numberOfLines={1}>
                  {h.title}
                </Text>
                <Feather name="plus" size={16} color={COLORS.textSecondary} />
              </Pressable>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              testID="new-task-input"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="或者自己加一件今日想做嘅小事…"
              placeholderTextColor={COLORS.textDisabled}
              style={styles.input}
              onSubmitEditing={() => addTask(newTitle)}
              returnKeyType="done"
            />
            <Pressable
              testID="add-task-btn"
              onPress={() => addTask(newTitle)}
              disabled={adding || !newTitle.trim()}
              style={[styles.addBtn, (adding || !newTitle.trim()) && { opacity: 0.5 }]}
            >
              <Feather name="plus" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>今日清單</Text>
          {loading ? (
            <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyCard} testID="tasks-empty">
              <Feather name="check-square" size={30} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>
                今日仲未有事。細如「飲一杯水」都算數。
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: SPACING.md }}>
              {tasks.map((t) => (
                <View key={t.id} style={styles.taskRow} testID={`task-row-${t.id}`}>
                  <Pressable
                    testID={`task-toggle-${t.id}`}
                    onPress={() => toggle(t)}
                    style={[styles.checkbox, t.completed && styles.checkboxDone]}
                  >
                    {t.completed && <Feather name="check" size={16} color={COLORS.textInverse} />}
                  </Pressable>
                  <Text
                    style={[styles.taskTitle, t.completed && styles.taskTitleDone]}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>
                  <Pressable
                    testID={`task-delete-${t.id}`}
                    onPress={() => remove(t.id)}
                    style={styles.deleteBtn}
                    hitSlop={10}
                  >
                    <Feather name="x" size={18} color={COLORS.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { padding: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFE4E4',
  },
  creditText: { color: '#E86A6A', fontWeight: '800', fontSize: 16 },
  rewardFlash: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFE4E4',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  rewardText: { color: '#E86A6A', fontWeight: '700' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  sectionHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  habitList: { marginTop: SPACING.md, gap: SPACING.sm },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minHeight: 52,
  },
  habitText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    height: 52,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: COLORS.primary },
  taskTitle: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textDisabled },
  deleteBtn: { padding: 4 },
  gardenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#DFF3E4',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  gardenEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: '#B9DBBC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenEmoji: { fontSize: 26 },
  gardenTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  gardenSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  gardenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#7BA88C',
  },
  gardenBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.bgCard },
});
