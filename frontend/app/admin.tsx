import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

type AdminStats = {
  users: number;
  entries: number;
  public_entries: number;
  tasks: number;
  memories: number;
  premium_users: number;
};

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_premium: boolean;
  credits: number;
  entry_count: number;
};

const TABS = ['stats', 'users', 'community'] as const;
type TabKey = (typeof TABS)[number];

export default function Admin() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, c] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<AdminUser[]>('/admin/users'),
        api.get<Entry[]>('/admin/community'),
      ]);
      setStats(s);
      setUsers(u);
      setEntries(c);
      setNotAdmin(false);
    } catch (e: any) {
      if (String(e?.message || '').toLowerCase().includes('admin')) setNotAdmin(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const removeEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await api.del(`/admin/entries/${id}`);
    } catch {
      load();
    }
  };

  if (!user?.is_admin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>管理員後台</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.forbidden} testID="admin-forbidden">
          你唔係管理員 🌿
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable testID="admin-back" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>管理員後台</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            testID={`admin-tab-${t}`}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'stats' ? '概覽' : t === 'users' ? '用戶' : '社群'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !stats ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : notAdmin ? (
        <Text style={styles.forbidden}>你唔係管理員 🌿</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'stats' && stats && (
            <View style={styles.statsGrid}>
              {[
                ['用戶總數', stats.users, 'users'],
                ['會員用戶', stats.premium_users, 'star'],
                ['心情記錄', stats.entries, 'edit-3'],
                ['社群分享', stats.public_entries, 'send'],
                ['任務數量', stats.tasks, 'check-square'],
                ['回憶記錄', stats.memories, 'book-open'],
              ].map(([label, value, icon]) => (
                <View key={label as string} style={styles.statCard} testID={`stat-${icon}`}>
                  <View style={styles.statIcon}>
                    <Feather name={icon as any} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{value as number}</Text>
                  <Text style={styles.statLabel}>{label as string}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'users' && (
            <>
              {users.map((u) => (
                <View key={u.id} style={styles.userCard} testID={`admin-user-${u.id}`}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{u.display_name || u.email.split('@')[0]}</Text>
                      {u.is_premium && (
                        <View style={styles.premiumChip}>
                          <Feather name="star" size={10} color="#8B4513" />
                          <Text style={styles.premiumText}>會員</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userMeta}>
                      {u.entry_count} 個記錄 · {u.credits} 個小心心 · {new Date(u.created_at).toLocaleDateString('zh-HK')}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === 'community' && (
            <>
              {entries.length === 0 ? (
                <Text style={styles.empty}>暫時冇公開分享</Text>
              ) : (
                entries.map((e) => (
                  <View key={e.id} style={styles.entryCard} testID={`admin-entry-${e.id}`}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryEmotion}>{e.emotion}</Text>
                      <Text style={styles.entryDate}>{e.entry_date}</Text>
                      <Pressable
                        testID={`admin-delete-${e.id}`}
                        onPress={() => removeEntry(e.id)}
                        hitSlop={10}
                      >
                        <Feather name="trash-2" size={16} color={COLORS.danger} />
                      </Pressable>
                    </View>
                    {e.note ? <Text style={styles.entryNote}>{e.note}</Text> : null}
                    <Text style={styles.entryMeta}>
                      💗 {e.hearts} · {e.display_name}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  forbidden: { padding: SPACING.xl, textAlign: 'center', color: COLORS.textSecondary },
  tabRow: {
    flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  tab: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  statCard: {
    width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'flex-start',
  },
  statIcon: {
    width: 34, height: 34, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  userCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  premiumChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill,
    backgroundColor: '#FFF3B0',
  },
  premiumText: { fontSize: 10, fontWeight: '800', color: '#8B4513' },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  userMeta: { fontSize: 11, color: COLORS.textDisabled, marginTop: 4 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.xl },
  entryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  entryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  entryEmotion: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  entryDate: { fontSize: 11, color: COLORS.textSecondary },
  entryNote: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  entryMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: SPACING.sm },
});
