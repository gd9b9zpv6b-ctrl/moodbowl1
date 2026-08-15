import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import {
  BOWL_RELEASE_ACTIONS,
  type BowlReleaseKey,
} from '@/src/constants/bowl-release';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/**
 * Symbolic release · what to do with today's bowl after writing.
 * Default next is bridge (finish); regulate is optional.
 */
export default function RitualReleaseScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const decorations = useRitualStore((s) => s.decorations);
  const bowlRelease = useRitualStore((s) => s.bowlRelease);
  const setBowlRelease = useRitualStore((s) => s.setBowlRelease);
  const addRegulation = useRitualStore((s) => s.addRegulation);
  const w = wordingFor(ageGroup);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const [picked, setPicked] = useState<BowlReleaseKey | null>(bowlRelease);

  const onPick = (key: BowlReleaseKey) => {
    setPicked(key);
    setBowlRelease(key);
    addRegulation(`release:${key}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const goBridge = () => {
    if (!picked) return;
    router.push('/ritual/bridge');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-release-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.bowl}>
          <BowlWithDecor
            emotion={emotion}
            size={160}
            radius={RADIUS.lg}
            decorations={decorations}
          />
        </View>

        <Text style={styles.title}>{w.release_title(emotion?.label || '碗')}</Text>
        <Text style={styles.sub}>{w.release_sub}</Text>

        <View style={styles.list}>
          {BOWL_RELEASE_ACTIONS.map((action) => {
            const active = picked === action.key;
            return (
              <Pressable
                key={action.key}
                testID={`release-${action.key}`}
                onPress={() => onPick(action.key)}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.emoji}>{action.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{w.release_actions[action.key].label}</Text>
                  <Text style={styles.cardHint}>{w.release_actions[action.key].hint}</Text>
                </View>
                {active && <Feather name="check" size={18} color={COLORS.textPrimary} />}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="release-finish-btn"
          onPress={goBridge}
          disabled={!picked}
          style={[styles.cta, !picked && { opacity: 0.45 }]}
        >
          <Text style={styles.ctaText}>{w.release_finish}</Text>
        </Pressable>

        <Pressable
          testID="release-regulate-btn"
          onPress={() => {
            if (!picked) return;
            router.push('/ritual/regulate');
          }}
          disabled={!picked}
          style={styles.secondary}
        >
          <Text style={[styles.secondaryText, !picked && { opacity: 0.45 }]}>
            {w.release_regulate}
          </Text>
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
  bowl: { alignItems: 'center', marginBottom: SPACING.md },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 30,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  list: { gap: SPACING.sm, marginBottom: SPACING.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: COLORS.textPrimary,
    backgroundColor: COLORS.primaryLight,
  },
  emoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  cardHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  secondary: { alignItems: 'center', paddingVertical: SPACING.md },
  secondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
});
