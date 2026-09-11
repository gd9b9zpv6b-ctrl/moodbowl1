import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { Component, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/src/components/progress-dots';
import { RitualDiaryEscape } from '@/src/components/ritual-diary-escape';
import { BowlDiscoveryScene, DISCOVERIES } from '@/src/components/ritual/bowl-discovery-scene';
import type { Emotion, EmotionCategory } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { discoveryBowlsForCategory, scoreBowls } from '@/src/lib/ritual/bowl-scorer';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

class DiscoveryErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('BowlDiscoveryScene failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
          呢場遊戲開唔到 · 撳上面轉個分類再試
        </Text>
      );
    }
    return this.props.children;
  }
}

export default function RitualPickScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const setBowl = useRitualStore((s) => s.setBowl);
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
        <DiscoveryErrorBoundary resetKey={activeCategory}>
          <BowlDiscoveryScene
            key={activeCategory}
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
    marginBottom: SPACING.sm,
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
  playHeading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
});
