import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROLE_META, UserRole } from '@/src/lib/role-storage';
import { useAuth } from '@/src/lib/auth-context';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

/**
 * Shared header for all non-student role portals.
 * Shows the role chip + a logout button (so demo users can switch account).
 * The old "role switch" shortcut was removed to reduce confusion — real users
 * switch roles by logging out and logging back in as a different demo account.
 */
export function RoleHeader({ role, title }: { role: UserRole; title: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  const meta = ROLE_META[role];

  const handleLogout = async () => {
    // Immediate logout — Alert.alert can be flaky on web, and this is a demo flow anyway.
    // If the user regrets, re-login from the login screen (which is where we go).
    try {
      await logout();
    } finally {
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: meta.color + '40' }]}>
        <Text style={styles.badgeEmoji}>{meta.emoji}</Text>
        <Text style={styles.badgeLabel}>{meta.label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        testID="role-logout-btn"
        onPress={handleLogout}
        style={styles.iconBtn}
        hitSlop={8}
      >
        <Feather name="log-out" size={16} color={COLORS.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeEmoji: { fontSize: 14 },
  badgeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  iconBtn: {
    width: 36, height: 36, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
});
