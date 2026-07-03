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

export function EntryEditModal({ visible, entry, onClose, onSaved, onDeleted }: Props) {
  const [note, setNote] = useState('');
  const [emotionKey, setEmotionKey] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (entry && visible) {
      setNote(entry.note || '');
      setEmotionKey(entry.emotion);
    }
  }, [entry, visible]);

  if (!entry) return null;
  const emotion = EMOTION_BY_KEY[emotionKey] || EMOTION_BY_KEY[entry.emotion];

  const save = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      const updated = await api.patch<Entry>(`/entries/${entry.id}`, {
        note,
        emotion: emotionKey,
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>編輯今日故事</Text>
            <Pressable testID="entry-edit-close" onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: SPACING.md }}
          >
            <Text style={styles.sectionLabel}>而家覺得</Text>
            <View style={styles.selectedRow}>
              <EmotionVisual emotion={emotion} size={56} radius={RADIUS.md} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedTitle}>{emotion?.label}</Text>
                <Text style={styles.selectedHint}>{emotion?.description}</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>換個心情</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.xs }}
            >
              {EMOTIONS.map((e) => {
                const active = emotionKey === e.key;
                return (
                  <Pressable
                    key={e.key}
                    testID={`edit-pick-${e.key}`}
                    onPress={() => setEmotionKey(e.key)}
                    style={[
                      styles.chip,
                      { backgroundColor: e.color + '80' },
                      active && styles.chipActive,
                    ]}
                  >
                    <EmotionVisual emotion={e} size={44} radius={RADIUS.sm} />
                    <Text style={styles.chipLabel}>{e.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>你嘅故事</Text>
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

            <Pressable
              testID="entry-edit-save"
              disabled={saving}
              onPress={save}
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
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

            <Pressable
              testID="entry-edit-delete"
              disabled={deleting}
              onPress={confirmDelete}
              style={styles.deleteBtn}
            >
              {deleting ? (
                <ActivityIndicator color="#E86A6A" />
              ) : (
                <>
                  <Feather name="trash-2" size={16} color="#E86A6A" />
                  <Text style={styles.deleteText}>刪除呢一段</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,49,66,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgInput,
  },
  selectedTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  selectedHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chip: {
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    alignItems: 'center',
    minWidth: 64,
  },
  chipActive: { borderWidth: 3, borderColor: COLORS.textPrimary },
  chipLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 140,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  saveBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.pill,
  },
  saveText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFE4E4',
  },
  deleteText: { color: '#E86A6A', fontSize: 14, fontWeight: '700' },
});
