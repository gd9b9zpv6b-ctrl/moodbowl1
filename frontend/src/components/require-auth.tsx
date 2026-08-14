import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { COLORS } from '@/src/constants/theme';
import { useAuth } from '@/src/lib/auth-context';

/**
 * Keep role dashboards from staying visible after logout.
 * Tabs already redirect when `user` is null; teacher/parent/counsellor/admin
 * screens did not, so a hung sign-out left those demo accounts "stuck in".
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/login" />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgMain,
  },
});
