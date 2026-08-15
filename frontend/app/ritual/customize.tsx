import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import {
  BOWL_DECORATIONS,
  MAX_BOWL_DECORS,
} from '@/src/constants/bowl-decorations';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore, type BowlSize } from '@/src/lib/ritual/ritual-store';

const SIZES: { key: BowlSize; label: string; hint: string; scale: number }[] = [
  { key: 'S', label: 'S', hint: '淡淡地', scale: 0.75 },
  { key: 'M', label: 'M', hint: '一般', scale: 1 },
  { key: 'L', label: 'L', hint: '好強烈', scale: 1.25 },
  { key: 'XL', label: 'XL', hint: '巨型', scale: 1.5 },
];

export default function RitualCustomizeScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const decorations = useRitualStore((s) => s.decorations);
  const bowlSize = useRitualStore((s) => s.bowlSize);
  const placeDecoration = useRitualStore((s) => s.placeDecoration);
  const removeDecorationAt = useRitualStore((s) => s.removeDecorationAt);
  const clearDecorations = useRitualStore((s) => s.clearDecorations);
  const setSize = useRitualStore((s) => s.setSize);
  const w = wordingFor(ageGroup);

  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const scale = SIZES.find((s) => s.key === bowlSize)?.scale ?? 1;
  const pendingDecor = pendingKey ? BOWL_DECORATIONS.find((d) => d.key === pendingKey) : null;

  const onPickDecor = (key: string) => {
    setPendingKey((prev) => (prev === key ? null : key));
    Haptics.selectionAsync().catch(() => {});
  };

  const onPlace = (x: number, y: number) => {
    if (!pendingKey) return;
    placeDecoration(pendingKey, x, y);
    setPendingKey(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const onRemoveAt = (index: number) => {
    removeDecorationAt(index);
    Haptics.selectionAsync().catch(() => {});
  };

  const onPickSize = (key: BowlSize) => {
    setSize(key);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-customize-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.gotBowl} testID="customize-got-bowl">
          {w.customize_got_bowl(emotion?.label || '碗')}
        </Text>
        <Text style={styles.title}>{w.customize_title(emotion?.label || '碗')}</Text>
        <Text style={styles.sub}>{w.customize_sub}</Text>

        <View style={styles.previewWrap}>
          <View style={[styles.previewInner, { transform: [{ scale }] }]}>
            <BowlWithDecor
              emotion={emotion}
              empty={!emotion}
              size={200}
              radius={RADIUS.lg}
              decorations={decorations}
              onPlace={pendingKey ? onPlace : undefined}
              onRemoveAt={onRemoveAt}
              placing={!!pendingKey}
            />
          </View>
          <Text style={styles.previewCaption} testID="customize-decor-label">
            {pendingDecor
              ? `撳碗上面 · 放「${pendingDecor.label}」`
              : decorations.length === 0
                ? '先揀一件飾品 · 再撳碗上想放嘅位置'
                : `已放 ${decorations.length} 件 · 撳飾品可移除`}
          </Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>揀飾品 · 最多 {MAX_BOWL_DECORS} 件</Text>
          {decorations.length > 0 && (
            <Pressable testID="customize-clear-decor" onPress={clearDecorations} hitSlop={8}>
              <Text style={styles.clearText}>清晒</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.decorRow}>
          {BOWL_DECORATIONS.map((decor) => {
            const pending = pendingKey === decor.key;
            const usedCount = decorations.filter((d) => d.key === decor.key).length;
            return (
              <Pressable
                key={decor.key}
                testID={`customize-decor-${decor.key}`}
                onPress={() => onPickDecor(decor.key)}
                style={styles.decorItem}
                accessibilityLabel={decor.label}
                accessibilityState={{ selected: pending }}
              >
                <View
                  style={[
                    styles.decorChip,
                    pending && styles.decorChipActive,
                    usedCount > 0 && !pending && styles.decorChipUsed,
                  ]}
                >
                  <Text style={styles.decorEmoji}>{decor.emoji}</Text>
                  {usedCount > 0 && (
                    <View style={styles.usedBadge}>
                      <Text style={styles.usedBadgeText}>{usedCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.decorLabel, pending && styles.decorLabelActive]}>
                  {decor.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>大細 · 感覺有幾強</Text>
        <View style={styles.sizeRow}>
          {SIZES.map((s) => {
            const active = bowlSize === s.key;
            return (
              <Pressable
                key={s.key}
                testID={`customize-size-${s.key}`}
                onPress={() => onPickSize(s.key)}
                style={[styles.sizeChip, active && styles.sizeChipActive]}
              >
                <Text style={[styles.sizeLabel, active && styles.sizeLabelActive]}>
                  {s.label}
                </Text>
                <Text style={styles.sizeHint}>{s.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="customize-next-btn"
          onPress={() => router.push('/ritual/release')}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{w.customize_next}</Text>
        </Pressable>

        <Pressable
          testID="customize-skip-btn"
          onPress={() => router.push('/ritual/release')}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>{w.customize_skip}</Text>
        </Pressable>
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
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  gotBowl: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  previewWrap: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
    paddingVertical: SPACING.lg,
  },
  previewInner: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCaption: {
    marginTop: SPACING.md,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  clearText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  decorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  decorItem: {
    width: '22%',
    minWidth: 64,
    alignItems: 'center',
    gap: 6,
  },
  decorChip: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  decorChipActive: {
    borderColor: COLORS.textPrimary,
    borderWidth: 2.5,
    backgroundColor: COLORS.primaryLight,
  },
  decorChipUsed: {
    borderColor: COLORS.primary,
  },
  usedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  usedBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.bgCard },
  decorEmoji: { fontSize: 26 },
  decorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  decorLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sizeChip: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  sizeChipActive: { backgroundColor: COLORS.primaryLight },
  sizeLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  sizeLabelActive: { color: COLORS.textPrimary },
  sizeHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  skipBtn: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  skipText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
});
