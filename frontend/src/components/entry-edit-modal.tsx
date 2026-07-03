import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EMOTIONS, EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { EmotionVisual } from './emotion-visual';

type Props = {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
  onSaved: (updated: Entry) => void;
  onDeleted: (id: string) => void;
};

function fmtDate(iso: string) {
  try {
    const [y, m, d] = iso.split('-');
    return `${y} 年 ${parseInt(m, 10)} 月 ${parseInt(d, 10)} 日`;
  } catch {
    return iso;
  }
}

export function EntryEditModal({ visible, entry, onClose, onSaved, onDeleted }: Props) {
  const [note, setNote] = useState('');
  const [emotionKeys, setEmotionKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (entry && visible) {
      setNote(entry.note || '');
      setEmotionKeys(entry.emotions?.length ? entry.emotions : [entry.emotion]);
    }
  }, [entry, visible]);

  if (!entry) return null;
  const primaryEmotion = EMOTION_BY_KEY[emotionKeys[0]] || EMOTION_BY_KEY[entry.emotion];
  const selectedEmotions = emotionKeys.map((k) => EMOTION_BY_KEY[k]).filter(Boolean);
  const bg = (primaryEmotion?.color || COLORS.primaryLight) + '25';

  const toggleEmotion = (key: string) => {
    setEmotionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const save = async () => {
    if (!entry || emotionKeys.length === 0) return;
    setSaving(true);
    try {
      const updated = await api.patch<Entry>(`/entries/${entry.id}`, {
        note,
        emotions: emotionKeys,
      });
      onSaved(updated);
      onClose();
    } catch {
      Alert.alert('儲存唔到', '請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      await api.del(`/entries/${entry.id}`);
      onDeleted(entry.id);
      onClose();
    } catch {
      Alert.alert('刪除唔到', '請稍後再試');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('刪除呢一段故事? 無得復原㗎。')) {
        doDelete();
      }
      return;
    }
    Alert.alert('刪除呢一段故事?', '無得復原㗎。', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Pressable testID="entry-edit-close" onPress={onClose} style={styles.headerBtn} hitSlop={10}>
              <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>編輯故事</Text>
              <Text style={styles.headerDate}>{fmtDate(entry.entry_date)}</Text>
            </View>
            <Pressable
              testID="entry-edit-delete-header"
              onPress={confirmDelete}
              disabled={deleting}
              style={styles.headerBtn}
              hitSlop={10}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#E86A6A" />
              ) : (
                <Feather name="trash-2" size={18} color="#E86A6A" />
              )}
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.heroCard}>
              {selectedEmotions.length > 0 ? (
                <View style={styles.heroStack}>
                  {selectedEmotions.slice(0, 4).map((e) => (
                    <View key={e.key} style={styles.heroStackItem}>
                      <EmotionVisual emotion={e} size={80} radius={RADIUS.md} />
                    </View>
                  ))}
                  {selectedEmotions.length > 4 && (
                    <View style={styles.heroMore}>
                      <Text style={styles.heroMoreText}>+{selectedEmotions.length - 4}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <EmotionVisual emotion={primaryEmotion} size={100} radius={RADIUS.lg} />
              )}
              <Text style={styles.emotionLabel}>
                {selectedEmotions.map((e) => e.label).join(' · ') || primaryEmotion?.label}
              </Text>
              <Text style={styles.emotionDesc}>
                {selectedEmotions.length <= 1
                  ? primaryEmotion?.description
                  : `一次過記低 ${selectedEmotions.length} 種心情`}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>揀 / 加 / 減 心情 (可以揀多個)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {EMOTIONS.map((e) => {
                const active = emotionKeys.includes(e.key);
                const orderIdx = emotionKeys.indexOf(e.key);
                return (
                  <Pressable
                    key={e.key}
                    testID={`edit-pick-${e.key}`}
                    onPress={() => toggleEmotion(e.key)}
                    style={[
                      styles.chip,
                      { backgroundColor: e.color + '80' },
                      active && styles.chipActive,
                    ]}
                  >
                    <EmotionVisual emotion={e} size={48} radius={RADIUS.sm} />
                    <Text style={styles.chipLabel}>{e.label}</Text>
                    {active && (
                      <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeText}>{orderIdx + 1}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.noteSection}>
              <View style={styles.noteHeader}>
                <Feather name="feather" size={14} color={COLORS.primary} />
                <Text style={styles.noteHeaderText}>你嘅故事</Text>
              </View>
              <TextInput
                testID="entry-edit-note"
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
                placeholder="想寫啲咩就寫啲咩..."
                placeholderTextColor={COLORS.textDisabled}
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              testID="entry-edit-save"
              disabled={saving || emotionKeys.length === 0}
              onPress={save}
              style={[styles.saveBtn, (saving || emotionKeys.length === 0) && { opacity: 0.5 }]}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <>
                  <Feather name="check" size={18} color={COLORS.textPrimary} />
                  <Text style={styles.saveText}>儲存更新</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroStack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  heroStackItem: {
    borderWidth: 2,
    borderColor: COLORS.bgCard,
    borderRadius: RADIUS.md + 2,
  },
  heroMore: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  heroMoreText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  emotionLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emotionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  chipRow: { gap: SPACING.sm, paddingVertical: SPACING.xs, paddingBottom: SPACING.md },
  chip: {
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  chipActive: { borderWidth: 3, borderColor: COLORS.primary },
  chipLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  chipBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chipBadgeText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  noteSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgInput,
  },
  noteHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  input: {
    minHeight: 220,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: RADIUS.pill,
  },
  saveText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
});
