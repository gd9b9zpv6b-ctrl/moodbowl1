// BowlSizeSlider — intensity signal for teacher follow-up reports (Scheme B).
// Kids set “感覺有幾強”; teachers see S/M/L/XL aggregates to decide whether to follow up.
// Replaces the old 0–100 battery EnergySlider.

import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import {
  BOWL_SIZES,
  bowlSizeIndex,
  bowlSizeMeta,
  type BowlSize,
} from '@/src/constants/bowl-size';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  value: BowlSize;
  onChange: (size: BowlSize) => void;
  testID?: string;
};

export function BowlSizeSlider({ value, onChange, testID }: Props) {
  const meta = bowlSizeMeta(value);

  return (
    <View style={styles.wrap} testID={testID || 'bowl-size-slider'}>
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Feather name="maximize-2" size={14} color={COLORS.textSecondary} />
          <Text style={styles.title}>呢碗感覺有幾大？</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {meta.label} · {meta.hint}
          </Text>
        </View>
      </View>

      <Slider
        testID="bowl-size-slider-control"
        style={styles.slider}
        minimumValue={0}
        maximumValue={BOWL_SIZES.length - 1}
        step={1}
        value={bowlSizeIndex(value)}
        onValueChange={(raw) => {
          const idx = Math.max(0, Math.min(BOWL_SIZES.length - 1, Math.round(raw)));
          const next = BOWL_SIZES[idx].key;
          if (next !== value) onChange(next);
        }}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.bgCard}
        thumbTintColor={COLORS.textPrimary}
        accessibilityLabel="碗大細 · 感覺有幾強"
      />

      <View style={styles.ticks}>
        {BOWL_SIZES.map((s) => (
          <Text
            key={s.key}
            style={[styles.tick, s.key === value && styles.tickActive]}
          >
            {s.label}
          </Text>
        ))}
      </View>

      <Text style={styles.hint}>拉大啲代表感覺好強烈 · 拉細啲代表淡淡地</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
  },
  pillText: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
  slider: {
    width: '100%',
    height: 32,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -2,
  },
  tick: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  tickActive: { color: COLORS.textPrimary, fontWeight: '800' },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
