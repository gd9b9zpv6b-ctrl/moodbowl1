import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

import { PROMPT_BY_KEY, STAGE_COLOR, STAGE_TITLE } from '@/src/constants/explore-prompts';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Memory } from '@/src/lib/api';

export default function ExploreWrite() {
  const router = useRouter();
  const { promptKey } = useLocalSearchParams<{ promptKey?: string }>();
  const prompt = promptKey ? PROMPT_BY_KEY[promptKey] : undefined;

  const [existing, setExisting] = useState<Memory[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const all = await api.get<Memory[]>('/memories');
      setExisting(all.filter((m) => m.prompt_key === promptKey));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [promptKey]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const save = async () => {
    if (!prompt || !note.trim()) return;
    setSaving(true);
    try {
      const created = await api.post<Memory>('/memories', {
        prompt_key: prompt.key,
        prompt_text: prompt.text,
        stage: prompt.stage,
        response: note.trim(),
      });
      setExisting((prev) => [created, ...prev]);
      setNote('');
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setExisting((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.del(`/memories/${id}`);
    } catch {
      load();
    }
  };

  if (!prompt) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>探索自己</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ padding: SPACING.lg, color: COLORS.textSecondary }}>
          搵唔到呢個問題。
        </Text>
      </SafeAreaView>
    );
  }

  const bg = STAGE_COLOR[prompt.stage] + '55';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            testID="explore-write-back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{STAGE_TITLE[prompt.stage]}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.prompt} testID="explore-write-prompt">
            {prompt.text}
          </Text>
          {prompt.hint && <Text style={styles.hint}>{prompt.hint}</Text>}

          <TextInput
            testID="explore-write-input"
            value={note}
            onChangeText={setNote}
            placeholder="慢慢寫 · 冇人會催你..."
            placeholderTextColor={COLORS.textDisabled}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <Pressable
            testID="explore-write-save"
            disabled={saving || !note.trim()}
            onPress={save}
            style={[styles.saveBtn, (saving || !note.trim()) && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.saveText}>存低呢一段</Text>
            )}
          </Pressable>

          <Text style={styles.savedTitle}>之前寫過</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
          ) : existing.length === 0 ? (
            <Text style={styles.emptyText}>
              仲未寫過。等你嘅節奏。
            </Text>
          ) : (
            existing.map((m) => (
              <View
                key={m.id}
                testID={`memory-${m.id}`}
                style={styles.memoryCard}
              >
                <View style={styles.memoryHeader}>
                  <Feather name="feather" size={14} color={COLORS.primary} />
                  <Text style={styles.memoryDate}>
                    {new Date(m.created_at).toLocaleDateString('zh-HK')}
                  </Text>
                  <Pressable
                    testID={`memory-delete-${m.id}`}
                    onPress={() => remove(m.id)}
                    hitSlop={10}
                  >
                    <Feather name="trash-2" size={14} color={COLORS.textDisabled} />
                  </Pressable>
                </View>
                <Text style={styles.memoryText}>{m.response}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  prompt: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '700', lineHeight: 34 },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm, lineHeight: 20 },
  input: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 200,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  saveBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  savedTitle: {
    marginTop: SPACING.xl,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13 },
  memoryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  memoryDate: { flex: 1, fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  memoryText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
});
