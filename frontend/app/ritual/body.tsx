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
import { BODY_CHIPS, type BodyChipKey } from '@/src/constants/body-chips';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualBodyScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const toggleChip = useRitualStore((s) => s.toggleChip);
  const skipChips = useRitualStore((s) => s.skipChips);
  const [toast, setToast] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const w = wordingFor(ageGroup);

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

        <Animated.View style={[styles.placeholder, { transform: [{ scale: pulse }] }]}>
          <View style={styles.placeholderInner}>
            <Text style={styles.placeholderEmoji}>🍚</Text>
            <Text style={styles.placeholderHint}>你之後會揀嘅碗 · 預留位</Text>
          </View>
        </Animated.View>

        <View style={styles.chipWrap}>
          {BODY_CHIPS.map((chip) => {
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
    marginBottom: SPACING.lg,
  },
  placeholder: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInner: { alignItems: 'center', gap: SPACING.sm },
  placeholderEmoji: { fontSize: 64, opacity: 0.35 },
  placeholderHint: { fontSize: 12, color: COLORS.textSecondary },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  chipActive: { backgroundColor: COLORS.primaryLight },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
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
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
