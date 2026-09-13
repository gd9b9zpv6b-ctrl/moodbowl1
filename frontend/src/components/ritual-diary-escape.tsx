import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { UNPICKED_BOWL_KEY } from '@/src/constants/emotions';
import { COLORS } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/**
 * Quiet header link so kids do not fat-finger「直接寫日記」
 * while tapping bowls or the primary ritual CTA.
 */
export function RitualDiaryEscape() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const reset = useRitualStore((s) => s.reset);
  const setBowl = useRitualStore((s) => s.setBowl);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const w = wordingFor(ageGroup);

  const goDiary = () => {
    Haptics.selectionAsync().catch(() => {});
    const keep = selectedBowlKey;
    reset();
    setBowl(keep || UNPICKED_BOWL_KEY);
    router.replace('/quick-diary');
  };

  return (
    <Pressable
      testID="ritual-diary-escape"
      onPress={goDiary}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={w.home_quick_diary}
      style={styles.headerBtn}
    >
      <Text style={styles.headerText} numberOfLines={2}>
        {w.home_quick_diary}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    maxWidth: 120,
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 32,
    paddingVertical: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 16,
  },
});
