import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiaryRitualPreview } from '@/src/components/animation-preview/diary-ritual-preview';
import { DiscoveryPreview } from '@/src/components/animation-preview/discovery-preview';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function AnimationPreviewScreen() {
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="animation-preview-close"
          accessibilityRole="button"
          accessibilityLabel="關閉動畫預覽"
          onPress={close}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Feather name="x" size={21} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>MOODBOWL LAB</Text>
          <Text style={styles.headerTitle}>互動動畫預覽</Text>
        </View>
        <View style={styles.previewBadge}>
          <View style={styles.previewDot} />
          <Text style={styles.previewBadgeText}>預覽</Text>
        </View>
      </View>

      <ScrollView
        testID="animation-preview-scroll"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Text style={styles.introEmoji}>🍚</Text>
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>一碗一種感受 · 慢慢搵到自己</Text>
            <Text style={styles.introText}>
              呢度集合兩組概念：用小互動發現合適飯碗，同埋寫完日記之後嘅溫柔儀式。
            </Text>
          </View>
        </View>

        <View style={styles.principles}>
          <Principle icon="heart" text="冇分數 · 冇答錯" />
          <Principle icon="volume-1" text="聲音可以關閉" />
          <Principle icon="shield" text="預覽唔會儲存資料" />
        </View>

        <DiscoveryPreview />
        <DiaryRitualPreview />

        <View style={styles.phaseNote}>
          <View style={styles.phaseIcon}>
            <Feather name="users" size={20} color="#9A765A" />
          </View>
          <View style={styles.phaseCopy}>
            <Text style={styles.phaseTitle}>家長、老師直接分享 · 下一階段</Text>
            <Text style={styles.phaseText}>
              直接分享日記牽涉收件人核實、撤回權限、通知同存取紀錄。第一階段只預覽信封動畫，唔會傳送內容。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Principle({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  text: string;
}) {
  return (
    <View style={styles.principle}>
      <Feather name={icon} size={14} color={COLORS.primary} />
      <Text style={styles.principleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.bgMain, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: SPACING.md,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: { opacity: 0.85 },
  headerCopy: { flex: 1, marginLeft: SPACING.sm },
  headerEyebrow: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 1 },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '99',
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  previewDot: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    height: 7,
    width: 7,
  },
  previewBadgeText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '800' },
  content: {
    marginHorizontal: 'auto',
    maxWidth: 620,
    paddingBottom: 80,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    width: '100%',
  },
  intro: {
    alignItems: 'center',
    backgroundColor: '#FFF6E8',
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  introIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.md,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  introEmoji: { fontSize: 38 },
  introCopy: { flex: 1 },
  introTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  introText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  principles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  principle: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  principleText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  phaseNote: {
    alignItems: 'flex-start',
    backgroundColor: '#F7EFE7',
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  phaseIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  phaseCopy: { flex: 1 },
  phaseTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  phaseText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
});
