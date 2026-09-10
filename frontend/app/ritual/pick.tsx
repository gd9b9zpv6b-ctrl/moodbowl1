import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { Component, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { ProgressDots } from '@/src/components/progress-dots';
import { RitualDiaryEscape } from '@/src/components/ritual-diary-escape';
import { BowlDiscoveryScene, DISCOVERIES } from '@/src/components/ritual/bowl-discovery-scene';
import type { Emotion, EmotionCategory } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { discoveryBowlsForCategory, scoreBowls } from '@/src/lib/ritual/bowl-scorer';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

class DiscoveryErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('BowlDiscoveryScene failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function RitualPickScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const setBowl = useRitualStore((s) => s.setBowl);
  const [expanded, setExpanded] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState<EmotionCategory | null>(null);
  const w = wordingFor(ageGroup);

  const scored = useMemo(
    () => scoreBowls(soup ?? 'no_drink', bodyChips),
    [soup, bodyChips],
  );

  const suggestedCategory =
    scored.default.find((item) => item.key !== 'hollow')?.category ?? 'unspoken';
  const activeCategory = categoryOverride ?? suggestedCategory;
  const discoveryEmotions = useMemo(
    () => discoveryBowlsForCategory(activeCategory, scored),
    [activeCategory, scored],
  );

  const onPick = (emotion: Emotion) => {
    setBowl(emotion.key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/ritual/talk');
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
        <RitualDiaryEscape />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{w.pick_title}</Text>

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
            {expanded
              ? w.pick_collapse
              : ageGroup === 'adult'
                ? w.pick_expand
                : `${w.pick_expand.replace(/\s*\(\d+\)\s*$/, '')} (${scored.expanded.length})`}
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
              <Text style={styles.seeAllText}>{w.pick_see_all}</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.playHeading}>{w.pick_play}</Text>
        <View style={styles.chips}>
          {DISCOVERIES.map((item) => {
            const selected = item.key === activeCategory;
            return (
              <Pressable
                key={item.key}
                testID={`discovery-${item.key}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategoryOverride(item.key)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && {
                    backgroundColor: item.accent,
                    borderColor: item.accent,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <DiscoveryErrorBoundary>
          <BowlDiscoveryScene
            category={activeCategory}
            emotions={discoveryEmotions}
            onChoose={onPick}
          />
        </DiscoveryErrorBoundary>
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
    marginBottom: SPACING.md,
    lineHeight: 34,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#FFF' },
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
  playHeading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
});
