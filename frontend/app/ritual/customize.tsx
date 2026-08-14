import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { BOWL_COLOR_TINTS } from '@/src/constants/bowl-color-tints';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { useRitualStore, type BowlSize } from '@/src/lib/ritual/ritual-store';

const SIZES: { key: BowlSize; label: string; hint: string; scale: number }[] = [
  { key: 'S', label: 'S', hint: '淡淡地', scale: 0.75 },
  { key: 'M', label: 'M', hint: '一般', scale: 1 },
  { key: 'L', label: 'L', hint: '好強烈', scale: 1.25 },
  { key: 'XL', label: 'XL', hint: '巨型', scale: 1.5 },
];

export default function RitualCustomizeScreen() {
  const router = useRouter();
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const colorTint = useRitualStore((s) => s.colorTint);
  const bowlSize = useRitualStore((s) => s.bowlSize);
  const setTint = useRitualStore((s) => s.setTint);
  const setSize = useRitualStore((s) => s.setSize);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const scale = SIZES.find((s) => s.key === bowlSize)?.scale ?? 1;

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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>幫 {emotion?.label || '碗'} 打扮一下</Text>

        <View style={styles.previewWrap}>
          <View style={[styles.previewInner, { transform: [{ scale }] }]}>
            <EmotionVisual emotion={emotion} size={200} radius={RADIUS.lg} />
            {colorTint && colorTint !== '#FFFFFF' && (
              <View
                pointerEvents="none"
                style={[styles.tintOverlay, { backgroundColor: colorTint }]}
              />
            )}
          </View>
        </View>

        <Text style={styles.section}>顏色</Text>
        <View style={styles.colorRow}>
          {BOWL_COLOR_TINTS.map((tint) => {
            const active = (colorTint || '#FFFFFF') === tint.hex;
            return (
              <Pressable
                key={tint.hex}
                testID={`customize-color-${tint.hex}`}
                onPress={() => setTint(tint.hex === '#FFFFFF' ? null : tint.hex)}
                style={[
                  styles.colorChip,
                  { backgroundColor: tint.hex },
                  active && styles.colorChipActive,
                ]}
                accessibilityLabel={tint.label}
              />
            );
          })}
        </View>

        <Text style={styles.section}>大細</Text>
        <View style={styles.sizeRow}>
          {SIZES.map((s) => {
            const active = bowlSize === s.key;
            return (
              <Pressable
                key={s.key}
                testID={`customize-size-${s.key}`}
                onPress={() => setSize(s.key)}
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
          <Text style={styles.ctaText}>下一步 · 同碗傾偈 →</Text>
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
    marginBottom: SPACING.lg,
  },
  previewWrap: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  previewInner: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    opacity: 0.35,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.6,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  colorChipActive: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
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
