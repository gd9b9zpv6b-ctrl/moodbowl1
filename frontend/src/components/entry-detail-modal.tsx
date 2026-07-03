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
import { SafeAreaView } from 'react-native-safe-area-context';

import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { Entry } from '@/src/lib/api';
import { EmotionVisual } from './emotion-visual';

type Props = {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
  onEdit?: () => void;
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

export function EntryDetailModal({ visible, entry, onClose, onEdit }: Props) {
  if (!entry) return null;
  const em = EMOTION_BY_KEY[entry.emotion];
  const bg = (em?.color || COLORS.primaryLight) + '25';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            testID="entry-detail-close"
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerDate}>{fmtDate(entry.entry_date)}</Text>
            <Text style={styles.headerTime}>{fmtTime(entry.created_at)}</Text>
          </View>
          {onEdit ? (
            <Pressable
              testID="entry-detail-edit"
              onPress={() => {
                onClose();
                setTimeout(() => onEdit(), 300);
              }}
              style={styles.headerBtn}
              hitSlop={10}
            >
              <Feather name="edit-2" size={20} color={COLORS.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <EmotionVisual emotion={em} size={140} radius={RADIUS.lg} />
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
  headerDate: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  headerTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emotionLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emotionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  noteCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    minHeight: 240,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
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
  noteText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    lineHeight: 30,
  },
  emptyNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textDisabled,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
