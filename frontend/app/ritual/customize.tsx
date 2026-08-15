import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { RitualDiaryEscape } from '@/src/components/ritual-diary-escape';
import {
  BOWL_COLOR_TINTS,
  tintBackdrop,
  tintLabel,
} from '@/src/constants/bowl-color-tints';
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
  const colorTint = useRitualStore((s) => s.colorTint);
  const bowlSize = useRitualStore((s) => s.bowlSize);
  const setTint = useRitualStore((s) => s.setTint);
  const setSize = useRitualStore((s) => s.setSize);
  const w = wordingFor(ageGroup);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const scale = SIZES.find((s) => s.key === bowlSize)?.scale ?? 1;
  const activeHex = colorTint || '#FFFFFF';
  const activeLabel = tintLabel(activeHex);

  const onPickColor = (hex: string) => {
    setTint(hex === '#FFFFFF' ? null : hex);
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
        <RitualDiaryEscape />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{w.customize_title(emotion?.label || '碗')}</Text>
        <Text style={styles.sub}>撳顏色 · 換碗後面嘅背景</Text>

        <View
          style={[
            styles.previewWrap,
            tintBackdrop(activeHex) && { backgroundColor: tintBackdrop(activeHex) },
          ]}
        >
          <View style={[styles.previewInner, { transform: [{ scale }] }]}>
            <EmotionVisual emotion={emotion} size={200} radius={RADIUS.lg} />
          </View>
          <Text style={styles.previewCaption} testID="customize-color-label">
            而家背景 · {activeLabel}
          </Text>
        </View>

        <Text style={styles.section}>換背景</Text>
        <View style={styles.colorRow}>
          {BOWL_COLOR_TINTS.map((tint) => {
            const active = activeHex === tint.hex;
            const isOriginal = tint.hex === '#FFFFFF';
            return (
              <Pressable
                key={tint.hex}
                testID={`customize-color-${tint.hex}`}
                onPress={() => onPickColor(tint.hex)}
                style={styles.colorItem}
                accessibilityLabel={tint.label}
                accessibilityState={{ selected: active }}
              >
                <View
                  style={[
                    styles.colorChip,
                    {
                      backgroundColor: isOriginal ? COLORS.bgCard : tint.hex,
                      borderColor: active ? COLORS.textPrimary : COLORS.borderLight,
                      borderWidth: active ? 2.5 : 1,
                    },
                    isOriginal && styles.colorChipOriginal,
                  ]}
                >
                  {isOriginal && (
                    <Feather name="slash" size={14} color={COLORS.textSecondary} />
                  )}
                  {active && !isOriginal && (
                    <Feather name="check" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>
                  {tint.label}
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
          onPress={() => router.push('/ritual/talk')}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{w.customize_next}</Text>
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
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
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
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
  },
  previewCaption: {
    marginTop: SPACING.md,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  colorItem: {
    width: '20%',
    minWidth: 64,
    alignItems: 'center',
    gap: 6,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChipOriginal: {
    backgroundColor: COLORS.bgCard,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  colorLabelActive: {
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
});
