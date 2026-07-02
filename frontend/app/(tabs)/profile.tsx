import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import { storage } from '@/src/utils/storage';

const REMINDER_KEY = 'moodful_reminder_enabled';
const REMINDER_HOUR_KEY = 'moodful_reminder_hour';

async function ensurePermission() {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === 'granted') return true;
  if (!perm.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.status === 'granted';
}

async function scheduleReminder(hour: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A gentle nudge',
      body: 'Take a moment to check in with how you feel today.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    } as any,
  });
}

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [reminder, setReminder] = useState(false);
  const [hour, setHour] = useState(20);

  useEffect(() => {
    (async () => {
      const enabled = await storage.getItem<boolean>(REMINDER_KEY, false);
      const h = await storage.getItem<number>(REMINDER_HOUR_KEY, 20);
      setReminder(!!enabled);
      setHour(typeof h === 'number' ? h : 20);
    })();
  }, []);

  const onToggleReminder = async (val: boolean) => {
    if (val) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          'Notifications disabled',
          'Please enable notifications in your device settings to receive gentle daily reminders.',
        );
        return;
      }
      await scheduleReminder(hour);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setReminder(val);
    await storage.setItem(REMINDER_KEY, val);
  };

  const changeHour = async (delta: number) => {
    const next = Math.max(0, Math.min(23, hour + delta));
    setHour(next);
    await storage.setItem(REMINDER_HOUR_KEY, next);
    if (reminder) {
      const ok = await ensurePermission();
      if (ok) await scheduleReminder(next);
    }
  };

  const doLogout = async () => {
    await logout();
    router.replace('/auth/welcome');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} testID="profile-title">
          Your space
        </Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Feather name="user" size={30} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.name} testID="profile-name">
            {user?.display_name || 'Friend'}
          </Text>
          <Text style={styles.email} testID="profile-email">
            {user?.email}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Daily reminder</Text>
        <View style={styles.rowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Gentle check-in reminder</Text>
            <Text style={styles.rowHint}>
              A soft notification once a day to help you pause.
            </Text>
          </View>
          <Switch
            testID="reminder-toggle"
            value={reminder}
            onValueChange={onToggleReminder}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>

        {reminder && (
          <View style={styles.rowCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Reminder time</Text>
              <Text style={styles.rowHint}>
                {String(hour).padStart(2, '0')}:00 each day
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Pressable
                testID="hour-decrement"
                onPress={() => changeHour(-1)}
                style={styles.stepBtn}
              >
                <Feather name="minus" size={18} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable
                testID="hour-increment"
                onPress={() => changeHour(1)}
                style={styles.stepBtn}
              >
                <Feather name="plus" size={18} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable testID="logout-btn" style={styles.logoutBtn} onPress={doLogout}>
          <Feather name="log-out" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>
          You are worthy of care. Take one soft breath. 🌿
        </Text>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { padding: SPACING.lg },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  email: { color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  rowHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
  footer: {
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
});
