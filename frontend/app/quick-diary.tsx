import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { EmotionVisual } from '@/src/components/emotion-visual';
import {
  EMOTION_BY_KEY,
  EMOTION_CATEGORIES,
  EMOTIONS,
  type Emotion,
  type EmotionCategory,
} from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { createDiaryEntry } from '@/src/lib/diary';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Standalone quick diary · opened from every ritual step’s「寫日記」button.
 */
export default function QuickDiaryScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const w = wordingFor(ageGroup);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmotionCategory | 'all'>('all');
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => {
    if (activeCategory === 'all') return EMOTIONS;
    return EMOTIONS.filter((e) => e.category === activeCategory);
  }, [activeCategory]);

  const toggle = (e: Emotion) => {
    setSelectedKeys((prev) =>
      prev.includes(e.key) ? prev.filter((k) => k !== e.key) : [...prev, e.key],
    );
  };

  const save = async () => {
    if (selectedKeys.length === 0) {
      Alert.alert('未揀心情', '揀至少一個飯碗先啦', [{ text: '好' }]);
      return;
    }
    setSaving(true);
    try {
      await createDiaryEntry({
        emotions: selectedKeys,
        note,
        is_public: false,
        is_secret: false,
        energy_level: null,
        entry_date: todayISO(),
      });
      Alert.alert('寫好喇', '日記已經儲存', [
        {
          text: '返主頁',
          onPress: () => router.replace('/(tabs)/index'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('儲存唔到', String(e?.message || '過陣再試'), [{ text: '好' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="quick-diary-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{w.home_quick_diary}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>你而家感覺點</Text>
          <Text style={styles.sub}>揀一個或多個飯碗 · 再寫幾句都得</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            <Pressable
              onPress={() => setActiveCategory('all')}
              style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
            >
              <Text style={styles.catChipText}>全部</Text>
            </Pressable>
            {EMOTION_CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setActiveCategory(c.key)}
                style={[
                  styles.catChip,
                  { backgroundColor: c.color + '80' },
                  activeCategory === c.key && styles.catChipActive,
                ]}
              >
                <Text style={styles.catChipText}>{c.short}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.grid}>
            {list.map((e) => {
              const active = selectedKeys.includes(e.key);
              return (
                <Pressable
                  key={e.key}
                  testID={`quick-diary-emotion-${e.key}`}
                  onPress={() => toggle(e)}
                  style={[
                    styles.emotionBtn,
                    { backgroundColor: e.color + '99' },
                    active && styles.emotionBtnActive,
                  ]}
                >
                  <EmotionVisual emotion={e} size={56} radius={RADIUS.sm} />
                  <Text style={styles.emotionLabel} numberOfLines={1}>
                    {e.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedKeys.length > 0 && (
            <View style={styles.pickedRow}>
              {selectedKeys.map((k) => (
                <Text key={k} style={styles.pickedChip}>
                  {EMOTION_BY_KEY[k]?.label || k}
                </Text>
              ))}
            </View>
          )}

          <TextInput
            testID="quick-diary-note"
            value={note}
            onChangeText={setNote}
            placeholder="想寫嘅都可以寫喺度 · 唔寫都得"
            placeholderTextColor={COLORS.textDisabled}
            style={styles.input}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            testID="quick-diary-save"
            onPress={save}
            disabled={saving || selectedKeys.length === 0}
            style={[
              styles.saveBtn,
              (saving || selectedKeys.length === 0) && { opacity: 0.5 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.saveBtnText}>儲存日記</Text>
            )}
          </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  catRow: { gap: 8, paddingBottom: SPACING.md },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  catChipActive: { backgroundColor: COLORS.primaryLight },
  catChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emotionBtn: {
    width: '31%',
    aspectRatio: 0.9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  emotionBtnActive: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  pickedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  pickedChip: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  input: {
    minHeight: 120,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  saveBtn: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
