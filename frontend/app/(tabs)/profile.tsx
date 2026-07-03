import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { GardenStorage } from '@/src/lib/garden-storage';
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
  const [rice, setRice] = useState(0);
  const [harvests, setHarvests] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const enabled = await storage.getItem<boolean>(REMINDER_KEY, false);
      const h = await storage.getItem<number>(REMINDER_HOUR_KEY, 20);
      setReminder(!!enabled);
      setHour(typeof h === 'number' ? h : 20);
      refreshUser();
    })();
  }, [refreshUser]);

  const loadGarden = useCallback(async () => {
    const [r, hs] = await Promise.all([
      GardenStorage.getRice(),
      GardenStorage.getHarvests(),
    ]);
    setRice(r);
    setHarvests(hs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGarden();
    }, [loadGarden]),
  );

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

        {/* ---- 米倉 · 收藏 ---- */}
        <Pressable
          testID="garden-rice-collection"
          onPress={() => router.push('/garden')}
          style={({ pressed }) => [styles.riceCard, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.riceHeader}>
            <View style={styles.riceIconWrap}>
              <Text style={styles.riceEmoji}>🍚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riceTitle}>米倉 · 收藏</Text>
              <Text style={styles.riceSub}>
                儲咗 <Text style={styles.riceCount}>{rice}</Text> 粒米 ·
                {' '}收成 <Text style={styles.riceCount}>{Object.keys(harvests).length}</Text> 種飯碗
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
          </View>
          {Object.keys(harvests).length === 0 ? (
            <View style={styles.riceEmpty}>
              <Text style={styles.riceEmptyText}>
                仲未有收成 · 去稻田種一粒米睇下
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.riceGrid}
            >
              {Object.entries(harvests)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => {
                  const em = EMOTION_BY_KEY[key];
                  if (!em) return null;
                  return (
                    <View key={key} style={styles.riceItem} testID={`collection-${key}`}>
                      <View style={styles.riceItemBowl}>
                        <EmotionVisual emotion={em} size={54} radius={RADIUS.sm} />
                        {count > 1 && (
                          <View style={styles.riceItemBadge}>
                            <Text style={styles.riceItemBadgeText}>×{count}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.riceItemLabel}>{em.label}</Text>
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </Pressable>

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

        <Pressable
          testID="link-premium"
          style={styles.linkRow}
          onPress={() => router.push('/premium')}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FFE4E4' }]}>
            <Feather name="star" size={18} color="#E86A6A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>
              {user?.is_premium ? '會員專屬設定' : '解鎖溫柔會員'}
            </Text>
            <Text style={styles.linkHint}>
              {user?.is_premium
                ? '秘密日記 · 自訂風格 · 飯碗系列'
                : '密碼保護 · 自訂風格 · 更多系列'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Text style={styles.sectionTitle}>更多</Text>
        <Pressable
          testID="link-privacy"
          style={styles.linkRow}
          onPress={() => router.push('/privacy')}
        >
          <View style={[styles.linkIcon, { backgroundColor: COLORS.bgInput }]}>
            <Feather name="shield" size={18} color={COLORS.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>私隱政策</Text>
            <Text style={styles.linkHint}>你嘅資料 · 你嘅控制</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        {user?.is_admin && (
          <Pressable
            testID="link-admin"
            style={styles.linkRow}
            onPress={() => router.push('/admin')}
          >
            <View style={[styles.linkIcon, { backgroundColor: '#2D3142' }]}>
              <Feather name="settings" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>管理員後台</Text>
              <Text style={styles.linkHint}>用戶 · 社群 · 統計</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
          </Pressable>
        )}

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
  riceCard: {
    backgroundColor: '#FFF9E8',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#DDB86A',
  },
  riceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  riceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F0DC9A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riceEmoji: { fontSize: 22 },
  riceTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  riceSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  riceCount: { fontWeight: '800', color: '#B57D2A' },
  riceEmpty: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
  },
  riceEmptyText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  riceGrid: {
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    paddingRight: SPACING.md,
  },
  riceItem: {
    alignItems: 'center',
    width: 64,
  },
  riceItemBowl: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  riceItemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B57D2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  riceItemBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  riceItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
});
