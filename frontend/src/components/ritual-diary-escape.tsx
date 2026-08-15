import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/**
 * Escape hatch on every ritual step → home quick diary.
 */
export function RitualDiaryEscape() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const reset = useRitualStore((s) => s.reset);
  const w = wordingFor(ageGroup);

  return (
    <Pressable
      testID="ritual-diary-escape"
      onPress={() => {
        reset();
        router.replace({ pathname: '/(tabs)', params: { openQuickDiary: '1' } });
      }}
      hitSlop={8}
      accessibilityLabel={w.home_quick_diary}
      style={styles.btn}
    >
      <Text style={styles.text} numberOfLines={1}>
        {w.home_quick_diary}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    maxWidth: 108,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 40,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});
