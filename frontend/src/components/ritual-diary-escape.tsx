import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

type Props = {
  /** Full-width footer button (default) or compact header link. */
  variant?: 'block' | 'header';
};

/**
 * Visible「寫日記」control on every ritual step.
 * Opens the dedicated quick-diary screen (does not rely on home params).
 */
export function RitualDiaryEscape({ variant = 'block' }: Props) {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const reset = useRitualStore((s) => s.reset);
  const w = wordingFor(ageGroup);

  const goDiary = () => {
    Haptics.selectionAsync().catch(() => {});
    reset();
    router.replace('/quick-diary');
  };

  if (variant === 'header') {
    return (
      <Pressable
        testID="ritual-diary-escape"
        onPress={goDiary}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={w.home_quick_diary}
        style={styles.headerBtn}
      >
        <Text style={styles.headerText} numberOfLines={1}>
          {w.home_quick_diary}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="ritual-diary-escape"
      onPress={goDiary}
      accessibilityRole="button"
      accessibilityLabel={w.home_quick_diary}
      style={({ pressed }) => [styles.blockBtn, pressed && { opacity: 0.85 }]}
    >
      <Feather name="edit-3" size={18} color={COLORS.textPrimary} />
      <Text style={styles.blockText}>{w.home_quick_diary}</Text>
    </Pressable>
  );
}

/** Sticky footer wrapper used under scroll content on ritual steps. */
export function RitualDiaryFooter() {
  return (
    <View style={styles.footer}>
      <RitualDiaryEscape variant="block" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    maxWidth: 108,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 40,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgMain,
  },
  blockBtn: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blockText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
