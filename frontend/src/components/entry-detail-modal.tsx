import { Feather } from '@expo/vector-icons';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { Entry } from '@/src/lib/api';
import { EmotionVisual } from './emotion-visual';

type Props = {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
};

function fmtDate(iso: string) {
  try {
    const [y, m, d] = iso.split('-');
    return `${y} 年 ${parseInt(m, 10)} 月 ${parseInt(d, 10)} 日`;
  } catch {
    return iso;
  }
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function EntryDetailModal({ visible, entry, onClose }: Props) {
  if (!entry) return null;
  const em = EMOTION_BY_KEY[entry.emotion];
  const bg = (em?.color || COLORS.primaryLight) + '30';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: bg }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{fmtDate(entry.entry_date)}</Text>
              <Text style={styles.time}>{fmtTime(entry.created_at)}</Text>
            </View>
            <Pressable testID="entry-detail-close" onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
            <View style={styles.emotionRow}>
              <EmotionVisual emotion={em} size={80} radius={RADIUS.md} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emotionLabel}>{em?.label || entry.emotion}</Text>
                <Text style={styles.emotionDesc}>{em?.description}</Text>
                <View style={styles.badgeRow}>
                  {entry.is_secret && (
                    <View style={[styles.badge, { backgroundColor: '#FFE4E4' }]}>
                      <Feather name="lock" size={11} color="#E86A6A" />
                      <Text style={[styles.badgeText, { color: '#E86A6A' }]}>秘密</Text>
                    </View>
                  )}
                  {entry.is_public && (
                    <View style={styles.badge}>
                      <Feather name="users" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.badgeText}>已分享</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {entry.note ? (
              <View style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Feather name="feather" size={14} color={COLORS.primary} />
                  <Text style={styles.noteHeaderText}>你嘅故事</Text>
                </View>
                <Text style={styles.noteText} selectable>
                  {entry.note}
                </Text>
              </View>
            ) : (
              <View style={styles.noteCard}>
                <Text style={styles.emptyNote}>呢一段冇寫故事。</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    maxHeight: '85%',
    minHeight: 320,
    ...Platform.select({
      web: { boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' },
      default: { elevation: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  date: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  time: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
  },
  emotionLabel: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  emotionDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  noteCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  noteHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  emptyNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textDisabled,
    textAlign: 'center',
  },
});
