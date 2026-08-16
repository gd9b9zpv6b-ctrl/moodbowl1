import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ONBOARDING_KEY } from '@/app/onboarding';
import { COLORS } from '@/src/constants/theme';
import { useAuth } from '@/src/lib/auth-context';

type Gate = 'loading' | 'onboarding' | 'welcome' | 'app';

export default function Index() {
  const { user, loading } = useAuth();
  const [gate, setGate] = useState<Gate>('loading');

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      if (user) {
        if (!cancelled) setGate('app');
        return;
      }
      // Tutorial before login · only for first-time visitors
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!cancelled) setGate(done ? 'welcome' : 'onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || gate === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }
  if (gate === 'app') return <Redirect href="/(tabs)" />;
  if (gate === 'onboarding') return <Redirect href="/onboarding" />;
  return <Redirect href="/auth/welcome" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgMain,
  },
});
