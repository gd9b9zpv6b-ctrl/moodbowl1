// 🔋 EnergySlider — companion input for the emotion picker
// Purpose: dual-track validation. Emotion says "what" · Energy says "how much".
// Kids find it harder to fake two dimensions at once — if they tap a happy bowl
// but their energy is 15%, that's a signal worth showing on the teacher dashboard.

import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  value: number | null;              // 0-100 or null when unset
  onChange: (v: number) => void;
  testID?: string;
};

// Choose an emoji + label based on the current level
function describe(v: number) {
  if (v <= 15) return { emoji: '🪫', label: '快冇電', color: '#E86A6A' };
  if (v <= 35) return { emoji: '🔋', label: '有啲攰', color: '#F0AE64' };
  if (v <= 65) return { emoji: '🔋', label: '一般', color: '#DDB86A' };
  if (v <= 85) return { emoji: '🔋', label: '有精神', color: '#7BA88C' };
  return { emoji: '⚡', label: '好有 energy', color: '#F0AE64' };
}

export function EnergySlider({ value, onChange, testID }: Props) {
  const v = value ?? 50;
  const d = describe(v);
  const isUnset = value === null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Feather name="battery-charging" size={14} color={COLORS.textSecondary} />
          <Text style={styles.title}>你今日剩返幾多電？</Text>
        </View>
        {!isUnset && (
          <View style={[styles.pill, { backgroundColor: `${d.color}22` }]}>
            <Text style={styles.pillEmoji}>{d.emoji}</Text>
            <Text style={[styles.pillLabel, { color: d.color }]}>{d.label}</Text>
            <Text style={[styles.pillPct, { color: d.color }]}>{v}%</Text>
          </View>
        )}
      </View>

      <Slider
        testID={testID || 'energy-slider'}
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={v}
        onValueChange={(x) => onChange(Math.round(x))}
        minimumTrackTintColor={d.color}
        maximumTrackTintColor={COLORS.bgInput}
        thumbTintColor={d.color}
      />

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>冇電</Text>
        <Text style={styles.scaleText}>50%</Text>
        <Text style={styles.scaleText}>滿電</Text>
      </View>

      {isUnset && (
        <Text style={styles.hint}>撳返個 slider 話俾自己知 · 今日精神點</Text>
      )}
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
  },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  pillEmoji: { fontSize: 12 },
  pillLabel: { fontSize: 11, fontWeight: '700' },
  pillPct: { fontSize: 11, fontWeight: '800' },
  slider: {
    width: '100%',
    height: 32,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  scaleText: { fontSize: 10, color: COLORS.textSecondary },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});
