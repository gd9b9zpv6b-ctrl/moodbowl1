import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';

export default function Community() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
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

  const toggleHeart = async (id: string) => {
    // Optimistic update
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
      // revert
      load();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} testID="community-title">
          Community
        </Text>
        <Text style={styles.subtitle}>
          Gentle words from others. You&apos;re never alone.
        </Text>
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
          {entries.length === 0 ? (
            <View style={styles.emptyCard} testID="community-empty">
              <Feather name="cloud" size={30} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>
                Nothing shared yet. When someone shares, their words will land here — gently.
              </Text>
            </View>
          ) : (
            entries.map((entry) => {
              const em = EMOTION_BY_KEY[entry.emotion];
              return (
                <View
                  key={entry.id}
                  testID={`community-entry-${entry.id}`}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[styles.iconWrap, { backgroundColor: em?.color || COLORS.primaryLight }]}
                    >
                      <Feather
                        name={(em?.icon as any) || 'circle'}
                        size={18}
                        color={COLORS.textPrimary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emotionLabel}>{em?.label || entry.emotion}</Text>
                      <Text style={styles.author}>Anonymous · {entry.entry_date}</Text>
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
                      {entry.hearts} {entry.hearts === 1 ? 'heart' : 'hearts'}
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  author: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
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
