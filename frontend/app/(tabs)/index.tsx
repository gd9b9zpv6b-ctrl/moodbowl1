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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EMOTIONS, Emotion, EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => todayISO(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Entry[]>('/entries');
      setTodayEntries(list.filter((e) => e.entry_date === today));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post<Entry>('/entries', {
        emotion: selected.key,
        note,
        is_public: share,
        entry_date: today,
      });
      setSelected(null);
      setNote('');
      setShare(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const bg = selected ? selected.color + '30' : COLORS.bgMain;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.greeting} testID="home-greeting">
              Hi {user?.display_name || 'friend'}
            </Text>
            <Text style={styles.prompt}>How are you feeling right now?</Text>

            <View style={styles.grid} testID="emotion-grid">
              {EMOTIONS.map((e) => {
                const active = selected?.key === e.key;
                return (
                  <Pressable
                    key={e.key}
                    testID={`emotion-${e.key}-picker`}
                    onPress={() => setSelected(e)}
                    style={[
                      styles.emotionBtn,
                      { backgroundColor: e.color },
                      active && { borderWidth: 3, borderColor: COLORS.textPrimary },
                    ]}
                  >
                    <Feather name={e.icon as any} size={26} color={COLORS.textPrimary} />
                    <Text style={styles.emotionLabel}>{e.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {selected && (
              <View style={styles.journalCard} testID="journal-card">
                <Text style={styles.journalTitle}>
                  Feeling {selected.label.toLowerCase()}
                </Text>
                <Text style={styles.journalHint}>{selected.description}</Text>
                <TextInput
                  testID="journal-note-input"
                  placeholder="What's on your mind? Why do you think you feel this way?"
                  placeholderTextColor={COLORS.textDisabled}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                  style={styles.journalInput}
                />
                <View style={styles.shareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareLabel}>Share anonymously with community</Text>
                    <Text style={styles.shareHint}>
                      Others may send you a gentle heart of support.
                    </Text>
                  </View>
                  <Switch
                    testID="share-toggle"
                    value={share}
                    onValueChange={setShare}
                    trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
                    thumbColor={COLORS.bgCard}
                  />
                </View>
                <Pressable
                  testID="save-entry-btn"
                  disabled={saving}
                  onPress={save}
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.textPrimary} />
                  ) : (
                    <Text style={styles.saveBtnText}>Save my check-in</Text>
                  )}
                </Pressable>
              </View>
            )}

            {saved && (
              <View style={styles.savedBanner} testID="saved-banner">
                <Feather name="check-circle" size={18} color={COLORS.primary} />
                <Text style={styles.savedText}>Saved. Be gentle with yourself.</Text>
              </View>
            )}

            <View style={{ marginTop: SPACING.xl }}>
              <Text style={styles.sectionTitle}>Today&apos;s check-ins</Text>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
              ) : todayEntries.length === 0 ? (
                <Text style={styles.emptyText} testID="today-empty">
                  No entries yet today. Pick how you feel above.
                </Text>
              ) : (
                todayEntries.map((entry) => {
                  const em = EMOTION_BY_KEY[entry.emotion];
                  return (
                    <View
                      key={entry.id}
                      testID={`today-entry-${entry.id}`}
                      style={[
                        styles.entryCard,
                        { backgroundColor: (em?.color || COLORS.primaryLight) + '40' },
                      ]}
                    >
                      <View style={styles.entryHeader}>
                        <View
                          style={[
                            styles.entryIconWrap,
                            { backgroundColor: em?.color || COLORS.primaryLight },
                          ]}
                        >
                          <Feather
                            name={(em?.icon as any) || 'circle'}
                            size={18}
                            color={COLORS.textPrimary}
                          />
                        </View>
                        <Text style={styles.entryEmotion}>{em?.label || entry.emotion}</Text>
                        {entry.is_public && (
                          <View style={styles.publicBadge}>
                            <Feather name="users" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.publicText}>Shared</Text>
                          </View>
                        )}
                      </View>
                      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                    </View>
                  );
                })
              )}
            </View>

            <View style={{ height: SPACING.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  prompt: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.sm },
  emotionBtn: {
    width: '30%',
    minHeight: 90,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emotionLabel: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  journalCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  journalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  journalHint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  journalInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 120,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  shareLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  shareHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  saveBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  savedBanner: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  savedText: { color: COLORS.textPrimary, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  entryCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  entryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryEmotion: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
  },
  publicText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  entryNote: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
});
