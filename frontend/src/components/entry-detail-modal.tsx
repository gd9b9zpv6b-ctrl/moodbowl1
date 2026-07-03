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

import { DiaryPaper } from '@/src/components/diary-paper';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { PAPER_TINTS as PAPER_TINT_LIST } from '@/src/constants/diary-style';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { DIARY_FONTS } from '@/src/hooks/use-diary-fonts';
import { Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';
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

// Paper tint palettes indexed by key (from diary-style constants).
const PAPER_TINTS = Object.fromEntries(
  PAPER_TINT_LIST.map((t) => [t.key, { bg: t.bg, line: t.line }]),
) as Record<string, { bg: string; line: string }>;

export function EntryDetailModal({ visible, entry, onClose, onEdit }: Props) {
  const { user } = useAuth();
  if (!entry) return null;
  const emList = (entry.emotions?.length ? entry.emotions : [entry.emotion])
    .map((k) => EMOTION_BY_KEY[k])
    .filter(Boolean);
  const em = emList[0];

  // Premium selection or default
  const isPremium = !!user?.is_premium;
  const tintKey = user?.diary_style?.paper_tint || 'cream';
  const tint = PAPER_TINTS[tintKey] || PAPER_TINTS.cream;
  const isDark = tintKey === 'night';
  const paperKindRaw = (user?.diary_style?.paper_kind as 'ruled' | 'grid' | 'dot' | 'none') || 'ruled';
  const showPaperLines = paperKindRaw !== 'none';
  const paperKind = showPaperLines ? (paperKindRaw as 'ruled' | 'grid' | 'dot') : 'ruled';
  // Auto-upgrade old chunky default to the new elegant 手寫明體
  // (users who never explicitly picked a font were auto-assigned ZCOOLKuaiLe before)
  const savedFont = user?.diary_style?.font_family;
  const noteFontFamily = !savedFont || savedFont === 'ZCOOLKuaiLe'
    ? DIARY_FONTS.wenkai
    : savedFont;
  const noteTextColor = user?.diary_style?.text_color || (isDark ? '#F0EEE7' : '#2D3142');
  const noteFontSize = user?.diary_style?.font_size || 20;

  const paperContent = (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="entry-detail-close"
          onPress={onClose}
          style={[styles.headerBtn, isDark && styles.headerBtnDark]}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={22} color={noteTextColor} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDate, { color: noteTextColor }]}>
            {fmtDate(entry.entry_date)}
          </Text>
          <Text style={[styles.headerTime, { color: noteTextColor, opacity: 0.7 }]}>
            {fmtTime(entry.created_at)}
          </Text>
        </View>
        {onEdit ? (
          <Pressable
            testID="entry-detail-edit"
            onPress={() => {
              onClose();
              setTimeout(() => onEdit(), 300);
            }}
            style={[styles.headerBtn, isDark && styles.headerBtnDark]}
            hitSlop={10}
          >
            <Feather name="edit-2" size={20} color={noteTextColor} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emotionStrip}>
          <View style={styles.emotionStripStack}>
            {emList.slice(0, 3).map((e, i) => (
              <View
                key={e.key}
                style={[
                  styles.emotionStripItem,
                  { marginLeft: i === 0 ? 0 : -18, zIndex: 3 - i },
                ]}
              >
                <EmotionVisual emotion={e} size={80} radius={RADIUS.md} />
              </View>
            ))}
            {emList.length > 3 && (
              <View style={styles.emotionStripMore}>
                <Text style={styles.emotionStripMoreText}>+{emList.length - 3}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.emotionLabel,
                { color: noteTextColor, fontFamily: DIARY_FONTS.brush },
              ]}
            >
              {emList.map((e) => e.label).join(' · ') || (em?.label || entry.emotion)}
            </Text>
            <Text style={[styles.emotionDesc, { color: noteTextColor, opacity: 0.7 }]}>
              {emList.length <= 1 ? em?.description : `混合咗 ${emList.length} 種心情`}
            </Text>
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

        <View style={styles.storyArea}>
          <Text
            selectable
            style={[
              styles.noteText,
              {
                color: noteTextColor,
                fontFamily: noteFontFamily,
                fontSize: noteFontSize,
                lineHeight: 34, // matches paper spacing so text sits on the lines
              },
            ]}
          >
            {entry.note || '呢一段冇寫故事。'}
          </Text>
        </View>

        {!isPremium && (
          <View style={styles.premiumNudge}>
            <Feather name="star" size={14} color={COLORS.primary} />
            <Text style={styles.premiumNudgeText}>
              升級會員 · 解鎖手寫字體同更多紙張款式
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: tint.bg }}>
        {showPaperLines ? (
          <DiaryPaper kind={paperKind} color={tint.line} spacing={34} strokeWidth={0.8}>
            {paperContent}
          </DiaryPaper>
        ) : (
          paperContent
        )}
      </View>
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate: { fontSize: 15, fontWeight: '700' },
  headerTime: { fontSize: 12, marginTop: 2 },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  emotionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed',
  },
  emotionStripStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionStripItem: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: RADIUS.md + 2,
  },
  emotionStripMore: {
    marginLeft: 4,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  emotionStripMoreText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  emotionLabel: { fontSize: 30, lineHeight: 40 },
  emotionDesc: { fontSize: 14, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  storyArea: {
    minHeight: 300,
  },
  noteText: {
    fontSize: 20,
  },
  premiumNudge: {
    marginTop: SPACING.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  premiumNudgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
