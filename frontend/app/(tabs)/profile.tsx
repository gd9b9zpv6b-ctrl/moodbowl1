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
      title: '溫柔提醒',
      body: '停一停 · 感受下自己而家嘅心情。',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    } as any,
  });
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [reminder, setReminder] = useState(false);
  const [hour, setHour] = useState(20);

  useEffect(() => {
    (async () => {
      const enabled = await storage.getItem<boolean>(REMINDER_KEY, false);
      const h = await storage.getItem<number>(REMINDER_HOUR_KEY, 20);
      setReminder(!!enabled);
      setHour(typeof h === 'number' ? h : 20);
      refreshUser();
    })();
  }, [refreshUser]);

  const onToggleReminder = async (val: boolean) => {
    if (val) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          '通知未開啟',
          '請喺裝置設定入面開啟通知,先可以收到每日嘅溫柔提醒。',
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
          你嘅小空間
        </Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Feather name="user" size={30} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.name} testID="profile-name">
            {user?.display_name || '朋友'}
          </Text>
          <Text style={styles.email} testID="profile-email">
            {user?.email}
          </Text>
          <View style={styles.creditsChip} testID="profile-credits">
            <Feather name="heart" size={14} color="#E86A6A" />
            <Text style={styles.creditsText}>已累積 {user?.credits ?? 0} 個小心心</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>支援</Text>
        <Pressable
          testID="link-help"
          style={styles.linkRow}
          onPress={() => router.push('/help')}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FFE4E4' }]}>
            <Feather name="life-buoy" size={18} color="#E86A6A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>尋求幫助</Text>
            <Text style={styles.linkHint}>24 小時熱線 · 註冊專業人士</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          testID="link-activities"
          style={styles.linkRow}
          onPress={() => router.push('/activities')}
        >
          <View style={[styles.linkIcon, { backgroundColor: COLORS.primaryLight }]}>
            <Feather name="sun" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>行出去 · 探索</Text>
            <Text style={styles.linkHint}>溫柔嘅活動提議</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          testID="link-explore"
          style={styles.linkRow}
          onPress={() => router.push('/explore')}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FFC8DD' }]}>
            <Feather name="book-open" size={18} color={COLORS.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>探索自己 · 回望</Text>
            <Text style={styles.linkHint}>寫低過去 · 認識自己</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Text style={styles.sectionTitle}>每日提醒</Text>
        <View style={styles.rowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>溫柔嘅每日提醒</Text>
            <Text style={styles.rowHint}>
              每日一次輕輕嘅通知,幫你停一停。
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
              <Text style={styles.rowTitle}>提醒時間</Text>
              <Text style={styles.rowHint}>
                每日 {String(hour).padStart(2, '0')}:00
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

        <Text style={styles.sectionTitle}>帳戶</Text>
        <Pressable testID="logout-btn" style={styles.logoutBtn} onPress={doLogout}>
          <Feather name="log-out" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>登出</Text>
        </Pressable>

        <Text style={styles.footer}>
          你值得被好好對待{'\n'}深呼吸一下 🌿
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
  creditsChip: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFE4E4',
  },
  creditsText: { color: '#8B4513', fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  linkRow: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  linkHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
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
