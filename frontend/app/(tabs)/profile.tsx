import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarPickerModal } from '@/src/components/avatar-picker-modal';
import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
// RoleStorage no longer used here — role is synced via auth-context after login
import { RoleStorage, ROLE_META, UserRole } from '@/src/lib/role-storage';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { GardenStorage } from '@/src/lib/garden-storage';
import { useAuth } from '@/src/lib/auth-context';
import { api } from '@/src/lib/api';
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
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
    const [r, hs, ak] = await Promise.all([
      GardenStorage.getRice(),
      GardenStorage.getHarvests(),
      GardenStorage.getAvatarKey(),
    ]);
    setRice(r);
    setHarvests(hs);
    setAvatarKey(ak);
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

  const handleAvatarSelect = async (key: string, riceSpent: number) => {
    // Deduct rice if unlocking a new (not harvested) bowl
    if (riceSpent > 0) {
      const newRice = Math.max(0, rice - riceSpent);
      setRice(newRice);
      await GardenStorage.setRice(newRice);
      // Also add to harvests so it counts as unlocked going forward
      const updated = await GardenStorage.addHarvest(key);
      setHarvests(updated);
    }
    setAvatarKey(key);
    await GardenStorage.setAvatarKey(key);
    setPickerOpen(false);
  };

  const avatarEmotion = avatarKey ? EMOTION_BY_KEY[avatarKey] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} testID="profile-title">
          你嘅小空間
        </Text>

        <View style={styles.card}>
          <Pressable
            testID="avatar-tap"
            onPress={() => setPickerOpen(true)}
            style={styles.avatarWrap}
          >
            {avatarEmotion ? (
              <EmotionVisual emotion={avatarEmotion} size={72} radius={RADIUS.pill} />
            ) : (
              <View style={styles.avatar}>
                <Feather name="user" size={30} color={COLORS.textPrimary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="edit-2" size={11} color="#FFF" />
            </View>
          </Pressable>
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

        {/* Back-to-dashboard card — ONLY for non-student users who dipped into student mode.
            User asked for a personalised switch: teacher only sees teacher · parent only sees parent. */}
        {user?.role && user.role !== 'student' && (
          <Pressable
            testID="back-to-dashboard"
            style={[styles.linkRow, { backgroundColor: ROLE_META[user.role as UserRole].color + '30', borderWidth: 1.5, borderColor: ROLE_META[user.role as UserRole].color }]}
            onPress={async () => {
              const r = user.role as UserRole;
              await RoleStorage.set(r);
              router.replace(ROLE_META[r].homePath as never);
            }}
          >
            <View style={[styles.linkIcon, { backgroundColor: ROLE_META[user.role as UserRole].color }]}>
              <Text style={{ fontSize: 18 }}>{ROLE_META[user.role as UserRole].emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>返 {ROLE_META[user.role as UserRole].label} Dashboard</Text>
              <Text style={styles.linkHint}>睇返學生 data · 或者返自己嘅工作版面</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
          </Pressable>
        )}

        <Pressable
          testID="link-onboarding"
          style={styles.linkRow}
          onPress={async () => {
            await AsyncStorage.removeItem('@onboarding/completed/v1');
            router.push('/onboarding');
          }}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FFEAC2' }]}>
            <Feather name="book" size={18} color="#DDB86A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>新手教學 · 重看</Text>
            <Text style={styles.linkHint}>認識吓成個 app 有咩玩</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          testID="link-privacy-tiers"
          style={styles.linkRow}
          onPress={() => router.push('/privacy-tiers')}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#E0EAFC' }]}>
            <Feather name="shield" size={18} color="#5A7CB0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>私隱保護 · 5 層權限</Text>
            <Text style={styles.linkHint}>睇下邊個角色見到咩</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

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

        {/* PDPO / GDPR compliance — right to data + right to be forgotten */}
        <Text style={styles.sectionTitle}>🔒 私隱權利</Text>

        <Pressable
          testID="data-export-btn"
          style={styles.privacyBtn}
          onPress={async () => {
            try {
              const data = await api.get<any>('/me/export');
              const entriesCount = data?.entries?.length ?? 0;
              const alertsCount = data?.alerts_about_me?.length ?? 0;
              Alert.alert(
                '📥 你嘅資料已匯出',
                `包含：${entriesCount} 條日記 · ${alertsCount} 條警報 metadata\n\n` +
                '示範版：真實 app 會將 JSON 檔 email 到你嘅地址 · 或者提供下載連結。\n\n' +
                '呢個係《個人資料（私隱）條例》第 6 條你嘅法定權利。',
              );
            } catch (e: any) {
              Alert.alert('匯出失敗', e?.message || '請再試');
            }
          }}
        >
          <View style={[styles.privacyIcon, { backgroundColor: '#E7EEF9' }]}>
            <Feather name="download" size={18} color="#3E5B7F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>匯出我嘅資料</Text>
            <Text style={styles.privacySub}>下載你喺 App 度所有嘅資料副本</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          testID="data-delete-btn"
          style={styles.privacyBtn}
          onPress={() => {
            Alert.alert(
              '⚠️ 刪除全部資料',
              '你將永久刪除：\n' +
              '• 全部日記記錄\n' +
              '• 所有 reaction / 打卡\n' +
              '• 你嘅帳戶本身\n\n' +
              '⚠️ 出於安全考慮 · 你嘅警報 metadata 會保留 7 年（PDPO 要求）· 但會匿名化 · 老師唔會知道係邊個。\n\n' +
              '呢個動作無法還原。真係要刪嗎？',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '確定刪除',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.del<any>('/me');
                      Alert.alert('已刪除', '你嘅資料已完全刪除。多謝你曾經信任呢個 App 🙏', [
                        { text: '好', onPress: () => logout() },
                      ]);
                    } catch (e: any) {
                      Alert.alert('刪除失敗', e?.message || '請再試');
                    }
                  },
                },
              ],
            );
          }}
        >
          <View style={[styles.privacyIcon, { backgroundColor: '#FDECEC' }]}>
            <Feather name="user-x" size={18} color="#8A3F3F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.privacyTitle, { color: '#8A3F3F' }]}>刪除我嘅帳戶</Text>
            <Text style={styles.privacySub}>永久刪除全部個人資料（Right to be forgotten）</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
        </Pressable>

        <Text style={styles.footer}>
          你值得被好好對待{'\n'}深呼吸一下 🌿
        </Text>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
      <AvatarPickerModal
        visible={pickerOpen}
        currentKey={avatarKey}
        harvests={harvests}
        rice={rice}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAvatarSelect}
      />
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
  avatarWrap: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    overflow: 'visible',
    marginBottom: SPACING.sm,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
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

  privacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  privacySub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
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
  roleCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#C7A6D1',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  roleHint: { fontSize: 11, color: COLORS.textSecondary, marginBottom: SPACING.md },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  roleChipEmoji: { fontSize: 18 },
  roleChipLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  footer: {
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
});
