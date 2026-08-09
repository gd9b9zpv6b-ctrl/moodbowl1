import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { ProgressDots } from '@/src/components/progress-dots';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { scoreBowls } from '@/src/lib/ritual/bowl-scorer';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualPickScreen() {
  const router = useRouter();
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const setBowl = useRitualStore((s) => s.setBowl);
  const [expanded, setExpanded] = useState(false);

  const scored = useMemo(() => {
    if (!soup) return { default: [] as Emotion[], expanded: [] as Emotion[] };
    return scoreBowls(soup, bodyChips);
  }, [soup, bodyChips]);

  const onPick = (emotion: Emotion) => {
    setBowl(emotion.key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/ritual/customize');
  };

  const renderCard = (emotion: Emotion) => (
    <Pressable
      key={emotion.key}
      testID={`bowl-pick-${emotion.key}`}
      onPress={() => onPick(emotion)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: emotion.color + '4D' },
        pressed && { opacity: 0.85 },
      ]}
    >
      <EmotionVisual emotion={emotion} size={72} radius={RADIUS.md} />
      <Text style={styles.cardLabel} numberOfLines={1}>
        {emotion.label}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {emotion.description}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-pick-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <ProgressDots total={3} active={3} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>你今日似邊個? 揀一個</Text>

        {!soup ? (
          <Text style={styles.empty}>未揀湯 · 返去再嚟一次</Text>
        ) : (
          <>
            <View style={styles.grid}>{scored.default.map(renderCard)}</View>

            <Pressable
              testID="bowl-expand-toggle"
              onPress={() => setExpanded((v) => !v)}
              style={styles.expandBtn}
            >
              <Feather
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.expandText}>
                {expanded ? '收埋' : `唔啱心水? 睇多啲 (${scored.expanded.length})`}
              </Text>
            </Pressable>

            {expanded && (
              <>
                <View style={styles.grid}>{scored.expanded.map(renderCard)}</View>
                <Pressable
                  testID="bowl-see-all"
                  onPress={() => router.push('/ritual/all')}
                  style={styles.seeAll}
                >
                  <Text style={styles.seeAllText}>冇一個 fit? 睇全部 ⋯</Text>
                </Pressable>
                <Pressable
                  testID="bowl-quick-diary"
                  onPress={() => router.replace('/(tabs)')}
                  style={styles.quickLink}
                >
                  <Text style={styles.quickLinkText}>或者直接寫日記</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
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
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    lineHeight: 34,
  },
  empty: { fontSize: 14, color: COLORS.textSecondary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  card: {
    width: '31%',
    aspectRatio: 0.85,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  expandText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  seeAll: { alignItems: 'center', paddingVertical: SPACING.sm },
  seeAllText: { fontSize: 13, color: COLORS.textSecondary },
  quickLink: { alignItems: 'center', paddingVertical: SPACING.sm },
  quickLinkText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700' },
});
