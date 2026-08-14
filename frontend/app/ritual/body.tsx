import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/src/components/progress-dots';
import {
  BODY_CHIPS,
  BODY_REGIONS,
  type BodyChipKey,
} from '@/src/constants/body-chips';
import { SOUP_BY_KEY } from '@/src/constants/soups';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualBodyScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const toggleChip = useRitualStore((s) => s.toggleChip);
  const skipChips = useRitualStore((s) => s.skipChips);
  const [toast, setToast] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const w = wordingFor(ageGroup);
  const drink = soup ? SOUP_BY_KEY[soup] : null;

  const onToggle = (key: BodyChipKey) => {
    const wasSelected = bodyChips.includes(key);
    if (!wasSelected && bodyChips.length >= 3) {
      setToast(w.body_hint);
      setTimeout(() => setToast(null), 1600);
    }
    toggleChip(key);
    Haptics.selectionAsync().catch(() => {});
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.92, duration: 120, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const goPick = () => router.push('/ritual/pick');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-body-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <ProgressDots total={3} active={2} />
        <Pressable
          testID="ritual-body-skip"
          onPress={() => {
            skipChips();
            goPick();
          }}
          hitSlop={8}
        >
          <Text style={styles.skip}>{w.body_skip}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{w.body_title}</Text>
        <Text style={styles.clarify}>{w.body_clarify}</Text>

        {drink && (
          <View style={styles.drinkChip} testID="body-drink-context">
            <Text style={styles.drinkEmoji}>{drink.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.drinkLabel}>你啱啱揀咗 · {drink.label}</Text>
              <Text style={styles.drinkHint}>{w.body_vessel}</Text>
            </View>
          </View>
        )}

        <Animated.View style={[styles.vessel, { transform: [{ scale: pulse }] }]}>
          <View style={styles.vesselInner}>
            <Text style={styles.vesselEmoji}>{drink?.emoji || '🥛'}</Text>
            <Text style={styles.vesselTitle}>身體 · 飲品容器</Text>
            <Text style={styles.vesselHint}>{w.body_vessel}</Text>
            {bodyChips.length > 0 && (
              <View style={styles.vesselActive}>
                {bodyChips.map((key) => {
                  const chip = BODY_CHIPS.find((c) => c.key === key);
                  return (
                    <Text key={key} style={styles.vesselChipEmoji}>
                      {chip?.emoji}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>

        {BODY_REGIONS.map((region) => {
          const regionChips = BODY_CHIPS.filter((c) => c.region === region.key);
          return (
            <View key={region.key} style={styles.regionBlock} testID={`body-region-${region.key}`}>
              <View style={styles.regionHeader}>
                <Text style={styles.regionEmoji}>{region.emoji}</Text>
                <Text style={styles.regionTitle}>{w.region_labels[region.key]}</Text>
              </View>
              <View style={styles.chipWrap}>
                {regionChips.map((chip) => {
                  const active = bodyChips.includes(chip.key);
                  return (
                    <Pressable
                      key={chip.key}
                      testID={`body-chip-${chip.key}`}
                      onPress={() => onToggle(chip.key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      {active && (
                        <Feather name="check" size={14} color={COLORS.textPrimary} />
                      )}
                      <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {w.chip_labels[chip.key]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <Pressable
          testID="ritual-body-next"
          disabled={bodyChips.length < 1}
          onPress={goPick}
          style={[styles.cta, bodyChips.length < 1 && { opacity: 0.6 }]}
        >
          <Text style={styles.ctaText}>{w.body_cta}</Text>
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
  skip: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: SPACING.sm,
  },
  clarify: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  drinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  drinkEmoji: { fontSize: 28 },
  drinkLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  drinkHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  vessel: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  vesselInner: { alignItems: 'center', gap: 6 },
  vesselEmoji: { fontSize: 48, opacity: 0.7 },
  vesselTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  vesselHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  vesselActive: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  },
  vesselChipEmoji: { fontSize: 22 },
  regionBlock: { marginBottom: SPACING.md },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  regionEmoji: { fontSize: 16 },
  regionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: COLORS.primaryLight },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  chipLabelActive: { color: COLORS.textPrimary },
  toast: {
    backgroundColor: '#FEF9E7',
    borderLeftWidth: 3,
    borderLeftColor: '#B57D2A',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  toastText: { fontSize: 12, color: '#8A5F1F' },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
