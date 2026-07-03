// Floating banner shown at the top of the student-mode tabs when the currently
// logged-in user is actually a non-student role (teacher / counsellor / parent / admin)
// who dived into student-mode via the self-care card.
// Gives them a clear one-tap way to jump back to their role's dashboard.

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleStorage, ROLE_META, UserRole } from '@/src/lib/role-storage';
import { useAuth } from '@/src/lib/auth-context';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export function BackToRoleBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = (user?.role || 'student') as UserRole;

  // Only show when the real user has a non-student role
  if (!user || role === 'student') return null;

  const meta = ROLE_META[role];

  const goBack = async () => {
    await RoleStorage.set(role);
    router.replace(meta.homePath as never);
  };

  return (
    <Pressable
      testID="back-to-role-banner"
      onPress={goBack}
      style={[styles.wrap, { top: insets.top + 6, backgroundColor: meta.color + 'F0' }]}
    >
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>返返 {meta.label} 版面</Text>
        <Text style={styles.sub}>你依家喺體驗學生 mode · 撳我返 dashboard</Text>
      </View>
      <Feather name="arrow-right-circle" size={18} color={COLORS.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    zIndex: 100,
    // Subtle shadow so it floats visually above content
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emoji: { fontSize: 20 },
  title: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textPrimary, opacity: 0.75, marginTop: 1 },
});
