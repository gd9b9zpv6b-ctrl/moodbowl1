import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Task } from '@/src/lib/api';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Tasks() {
  const today = useMemo(() => todayISO(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

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
    }, [load]),
  );

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await api.post<Task>('/tasks', {
        title: newTitle.trim(),
        task_date: today,
      });
      setTasks((prev) => [...prev, created]);
      setNewTitle('');
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (t: Task) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)));
    try {
      await api.patch<Task>(`/tasks/${t.id}`, { completed: !t.completed });
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
          <Text style={styles.title} testID="tasks-title">
            Small kind things
          </Text>
          <Text style={styles.subtitle}>
            One tiny act at a time. Today, {done} of {tasks.length} done.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              testID="new-task-input"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Add a gentle intention for today…"
              placeholderTextColor={COLORS.textDisabled}
              style={styles.input}
              onSubmitEditing={addTask}
              returnKeyType="done"
            />
            <Pressable
              testID="add-task-btn"
              onPress={addTask}
              disabled={adding || !newTitle.trim()}
              style={[styles.addBtn, (adding || !newTitle.trim()) && { opacity: 0.5 }]}
            >
              <Feather name="plus" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyCard} testID="tasks-empty">
              <Feather name="check-square" size={30} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>
                Nothing yet today. Something as small as {'"'}drink water{'"'} counts.
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
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
});
