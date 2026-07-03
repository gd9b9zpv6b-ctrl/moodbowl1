import { Feather } from '@expo/vector-icons';
import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackToRoleBanner } from '@/src/components/back-to-role-banner';
import { COLORS } from '@/src/constants/theme';
import { useAuth } from '@/src/lib/auth-context';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  if (!user) return <Redirect href="/auth/welcome" />;

  const nonStudent = user.role && user.role !== 'student';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgMain }}>
      {/* Persistent role banner — takes actual layout space so it can't be hidden by tab content */}
      {nonStudent && (
        <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.bgMain }}>
          <BackToRoleBanner />
        </SafeAreaView>
      )}
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDisabled,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calm"
        options={{
          title: '深呼吸',
          tabBarIcon: ({ color, size }) => <Feather name="wind" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '心情曆',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '社群',
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '小習慣',
          tabBarIcon: ({ color, size }) => <Feather name="check-square" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我',
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgMain },
});
