import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROLE_META, UserRole } from '@/src/lib/role-storage';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

/**
 * Shared header for all non-student role portals.
 * Shows the role chip + a shortcut back to Profile to switch role.
 */
export function RoleHeader({ role, title }: { role: UserRole; title: string }) {
  const router = useRouter();
  const meta = ROLE_META[role];
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: meta.color + '40' }]}>
        <Text style={styles.badgeEmoji}>{meta.emoji}</Text>
        <Text style={styles.badgeLabel}>{meta.label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        testID="role-switch-btn"
        onPress={() => router.push('/(tabs)/profile' as never)}
        style={styles.switchBtn}
      >
        <Feather name="users" size={16} color={COLORS.textPrimary} />
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
  switchBtn: {
    width: 36, height: 36, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
});
