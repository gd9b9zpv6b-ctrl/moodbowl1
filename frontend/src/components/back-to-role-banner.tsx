// Persistent banner shown at the top of student-mode tabs when the currently
// logged-in user is actually a non-student role (teacher / counsellor / parent / admin)
// who dived into student-mode via the self-care card.
// Uses flex layout (not absolute positioning) so it renders reliably across platforms.

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RoleStorage, ROLE_META, UserRole } from '@/src/lib/role-storage';
import { useAuth } from '@/src/lib/auth-context';
import { COLORS, SPACING } from '@/src/constants/theme';

export function BackToRoleBanner() {
  const { user } = useAuth();
  const router = useRouter();
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
      style={({ pressed }) => [
        styles.wrap,
        { backgroundColor: meta.color + 'F0' },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>返 {meta.label} Dashboard</Text>
        <Text style={styles.sub}>你依家喺自己嘅日記空間 · 撳我返 {meta.label} 工作版面</Text>
      </View>
      <Feather name="arrow-right-circle" size={20} color={COLORS.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  emoji: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textPrimary, opacity: 0.75, marginTop: 1 },
});
