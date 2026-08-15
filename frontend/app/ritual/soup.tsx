import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/src/components/progress-dots';
import { RitualDiaryEscape } from '@/src/components/ritual-diary-escape';
import { SOUPS, type SoupKey } from '@/src/constants/soups';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualSoupScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const setSoup = useRitualStore((s) => s.setSoup);
  const [selected, setSelected] = useState<SoupKey | null>(null);
  const w = wordingFor(ageGroup);

  const onPick = (key: SoupKey) => {
    if (selected) return;
    setSelected(key);
    setSoup(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => {
      router.push('/ritual/body');
    }, 300);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-soup-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <ProgressDots total={3} active={1} />
        <RitualDiaryEscape />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{w.soup_title}</Text>
        <Text style={styles.sub}>{w.soup_sub}</Text>

        <View style={styles.grid}>
          {SOUPS.map((soup) => {
            const active = selected === soup.key;
            return (
              <Pressable
                key={soup.key}
                testID={`soup-${soup.key}`}
                onPress={() => onPick(soup.key)}
                style={({ pressed }) => [
                  styles.card,
                  active && styles.cardActive,
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                ]}
              >
                <Text style={styles.emoji}>{soup.emoji}</Text>
                <Text style={styles.label}>{soup.label}</Text>
                <Text style={styles.cardSub}>{w.soup_subs[soup.key]}</Text>
              </Pressable>
            );
          })}
        </View>
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
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 148,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  emoji: { fontSize: 40, marginBottom: SPACING.sm },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
