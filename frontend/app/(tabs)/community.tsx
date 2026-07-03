import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';
import { CommunityConfig, DEFAULT_CONFIG, SchoolCommunityConfig } from '@/src/lib/school-community-config';

type Scope = 'student' | 'adult';

export default function Community() {
  const { user } = useAuth();
  const realRole = (user?.role || 'student') as string;
  const isStudent = realRole === 'student';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cfg, setCfg] = useState<CommunityConfig>(DEFAULT_CONFIG);
  // For adults: which scope tab to show (defaults to their own scope)
  const [activeScope, setActiveScope] = useState<Scope>(isStudent ? 'student' : 'adult');

  const load = useCallback(async () => {
    try {
      const c = await SchoolCommunityConfig.get();
      setCfg(c);
      const res = await api.get<Entry[]>('/entries/community');
      setEntries(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  // For adults: honor the school config for viewing student community
  const adultCanViewStudent = !isStudent && cfg.adultCanViewStudentCommunity;

  // Determine which scope tabs to display
  const tabs: Scope[] = useMemo(() => {
    if (isStudent) return ['student']; // students never see adult tab
    if (!cfg.adultCommunityEnabled && !adultCanViewStudent) return [];
    const list: Scope[] = [];
    if (cfg.adultCommunityEnabled) list.push('adult');
    if (adultCanViewStudent) list.push('student');
    return list;
  }, [isStudent, cfg.adultCommunityEnabled, adultCanViewStudent]);

  // Filter entries by active scope (backend already blocks students from adult · this is UI-side scope switching for adults)
  const visibleEntries = useMemo(() => {
    if (isStudent) return entries.filter((e) => (e.community_scope || 'student') === 'student');
    return entries.filter((e) => (e.community_scope || 'student') === activeScope);
  }, [entries, isStudent, activeScope]);

  // Anonymity mode for a given entry
  const displayNameFor = (entry: Entry): { name: string; roleLabel?: string } => {
    const scope = (entry.community_scope || 'student') as Scope;
    if (scope === 'adult') {
      // Adult community: always show display_name + role label
      const roleLabel = entry.author_role_label || undefined;
      return { name: entry.display_name || '朋友', roleLabel };
    }
    // Student community: honor school anonymity config
    if (cfg.studentAnonymity === 'nickname') {
      return { name: entry.display_name || '同學' };
    }
    return { name: '同學' }; // full anonymity default
  };

  const toggleHeart = async (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              hearted_by_me: !e.hearted_by_me,
              hearts: e.hearts + (e.hearted_by_me ? -1 : 1),
            }
          : e,
      ),
    );
    try {
      const updated = await api.post<Entry>(`/entries/${id}/react`);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch {
      load();
    }
  };

  // Header banner text explains scope + privacy in one line
  const scopeBanner = isStudent
    ? { text: '學生同儕之間 · 老師 · 家長 · 冇任何大人可以睇到', color: '#DFF0DE', icon: 'users' as const }
    : activeScope === 'adult'
      ? { text: '大人專屬社群 · 學生一定睇唔到', color: '#E0EAFC', icon: 'briefcase' as const }
      : { text: '你依家係大人身份 · 匿名瀏覽學生 post（校方已授權）', color: '#FFEAC2', icon: 'eye' as const };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} testID="community-title">社群</Text>
        <Text style={styles.subtitle}>其他朋友嘅心聲。你唔係孤單一個。</Text>
      </View>

      {/* Scope tabs — only visible when 2+ scopes available */}
      {!isStudent && tabs.length > 1 && (
        <View style={styles.tabBar}>
          {tabs.map((s) => {
            const active = activeScope === s;
            const label = s === 'adult' ? '大人社群' : '學生社群';
            return (
              <Pressable
                key={s}
                testID={`community-tab-${s}`}
                onPress={() => setActiveScope(s)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Scope banner — always visible for context */}
      <View style={[styles.scopeBanner, { backgroundColor: scopeBanner.color }]}>
        <Feather name={scopeBanner.icon} size={13} color={COLORS.textPrimary} />
        <Text style={styles.scopeBannerText}>{scopeBanner.text}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {visibleEntries.length === 0 ? (
            <View style={styles.emptyCard} testID="community-empty">
              <Feather name="cloud" size={30} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>
                仲未有人分享。當有人願意分享,佢哋嘅心聲會溫柔咁停喺呢度。
              </Text>
            </View>
          ) : (
            visibleEntries.map((entry) => {
              const emList = (entry.emotions?.length ? entry.emotions : [entry.emotion])
                .map((k) => EMOTION_BY_KEY[k])
                .filter(Boolean);
              const em = emList[0];
              const dn = displayNameFor(entry);
              return (
                <View
                  key={entry.id}
                  testID={`community-entry-${entry.id}`}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.emotionStack}>
                      {emList.slice(0, 3).map((e, i) => (
                        <View
                          key={e.key}
                          style={[
                            styles.emotionStackItem,
                            { marginLeft: i === 0 ? 0 : -14, zIndex: 3 - i },
                          ]}
                        >
                          <EmotionVisual emotion={e} size={44} radius={RADIUS.sm} />
                        </View>
                      ))}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emotionLabel} numberOfLines={1}>
                        {emList.map((e) => e.label).join(' · ') || (em?.label || entry.emotion)}
                      </Text>
                      <View style={styles.authorRow}>
                        <Text style={styles.author}>{dn.name}</Text>
                        {dn.roleLabel && (
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>{dn.roleLabel}</Text>
                          </View>
                        )}
                        <Text style={styles.dateText}>· {entry.entry_date}</Text>
                      </View>
                    </View>
                  </View>
                  {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
                  <Pressable
                    testID={`heart-btn-${entry.id}`}
                    style={styles.heartBtn}
                    onPress={() => toggleHeart(entry.id)}
                  >
                    <Feather
                      name="heart"
                      size={18}
                      color={entry.hearted_by_me ? '#E86A6A' : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.heartCount,
                        entry.hearted_by_me && { color: '#E86A6A', fontWeight: '700' },
                      ]}
                    >
                      {entry.hearts} 個心心
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  emotionStack: { flexDirection: 'row', alignItems: 'center' },
  emotionStackItem: {
    borderWidth: 2,
    borderColor: COLORS.bgCard,
    borderRadius: RADIUS.sm + 2,
  },
  iconWrap: { width: 44, height: 44, borderRadius: RADIUS.sm },
  emotionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  author: { fontSize: 12, color: COLORS.textSecondary },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E0EAFC',
  },
  roleTagText: { fontSize: 10, fontWeight: '700', color: '#5A7A8C' },
  dateText: { fontSize: 11, color: COLORS.textDisabled },

  // Scope tabs (for adults with dual community access)
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.bgCard },
  tabLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.textPrimary, fontWeight: '800' },

  // Scope explanation banner
  scopeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  scopeBannerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 15,
  },
  note: { marginTop: SPACING.md, fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  heartBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  heartCount: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
});
