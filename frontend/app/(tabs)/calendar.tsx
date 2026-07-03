import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EntryDetailModal } from '@/src/components/entry-detail-modal';
import { EntryEditModal } from '@/src/components/entry-edit-modal';
import { SupportCtaRow } from '@/src/components/support-cta-row';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NOTE_PREVIEW_LINES = 3;

export default function CalendarScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthKey());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [loading, setLoading] = useState(true);
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const featuredByDate = useMemo(() => user?.featured_by_date || {}, [user?.featured_by_date]);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await api.get<Entry[]>(`/entries/calendar?month=${m}`);
      setEntries(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
    }, [load, month]),
  );

  // Group entries by date. Featured takes priority, else latest.
  const entriesGroupedByDate = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const e of entries) {
      if (!map[e.entry_date]) map[e.entry_date] = [];
      map[e.entry_date].push(e);
    }
    return map;
  }, [entries]);

  const featuredEntryFor = useCallback(
    (date: string): Entry | undefined => {
      const list = entriesGroupedByDate[date] || [];
      if (list.length === 0) return undefined;
      const featuredId = featuredByDate[date];
      const featured = featuredId ? list.find((e) => e.id === featuredId) : undefined;
      return featured || list[0];
    },
    [entriesGroupedByDate, featuredByDate],
  );

  const entriesForDay = entriesGroupedByDate[selectedDate] || [];
  const featuredIdForSelected = featuredByDate[selectedDate] || entriesForDay[0]?.id;

  const setFeatured = async (entryId: string) => {
    setFeaturing(entryId);
    try {
      const updated = await api.post<User>(`/entries/${entryId}/feature`);
      setUser(updated);
    } catch {
      // ignore
    } finally {
      setFeaturing(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} testID="calendar-title">
          你嘅心路
        </Text>
        <Text style={styles.subtitle}>每一個小小嘅感受,都值得記低。</Text>

        <View style={styles.calendarWrap}>
          <Calendar
            testID="calendar"
            current={`${month}-01`}
            onMonthChange={(d: DateData) => setMonth(currentMonthKey(new Date(d.dateString)))}
            onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
            monthFormat="yyyy 年 M 月"
            firstDay={1}
            hideExtraDays
            dayComponent={({ date, state }) => {
              if (!date) return <View style={styles.dayCell} />;
              const featured = featuredEntryFor(date.dateString);
              const em = featured ? EMOTION_BY_KEY[featured.emotion] : undefined;
              const isSelected = selectedDate === date.dateString;
              const isToday = todayISO() === date.dateString;
              const isDisabled = state === 'disabled';

              return (
                <Pressable
                  testID={`calendar-day-${date.dateString}`}
                  onPress={() => setSelectedDate(date.dateString)}
                  style={styles.dayCell}
                >
                  {em ? (
                    <View
                      style={[
                        styles.dayIconWrap,
                        isSelected && styles.dayIconWrapSelected,
                      ]}
                    >
                      <EmotionVisual emotion={em} size={38} radius={RADIUS.sm} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.dayNumWrap,
                        isSelected && styles.dayNumWrapSelected,
                        isToday && !isSelected && styles.dayNumWrapToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          isToday && { color: COLORS.primary, fontWeight: '700' },
                          isDisabled && { color: COLORS.textDisabled },
                        ]}
                      >
                        {date.day}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
            theme={{
              calendarBackground: COLORS.bgCard,
              monthTextColor: COLORS.textPrimary,
              textMonthFontWeight: '700',
              textMonthFontSize: 18,
              arrowColor: COLORS.primary,
              textSectionTitleColor: COLORS.textSecondary,
            }}
            style={{ borderRadius: RADIUS.lg }}
          />
        </View>

        <View style={styles.dayHeader}>
          <Text style={styles.sectionTitle}>{selectedDate}</Text>
          {entriesForDay.length > 0 && (
            <Text style={styles.dayCount}>{entriesForDay.length} 段故事</Text>
          )}
        </View>

        {entriesForDay.length > 1 && (
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Feather name="star" size={14} color={COLORS.primary} />
              <Text style={styles.pickerTitle}>揀個心情擺上日曆</Text>
            </View>
            <Text style={styles.pickerHint}>
              呢一日有 {entriesForDay.length} 段記錄 · 撳一下決定邊個做「代表」
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerRow}
            >
              {entriesForDay.map((entry) => {
                const emList = (entry.emotions?.length ? entry.emotions : [entry.emotion])
                  .map((k) => EMOTION_BY_KEY[k])
                  .filter(Boolean);
                const em = emList[0];
                const active = featuredIdForSelected === entry.id;
                const isLoading = featuring === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    testID={`feature-pick-${entry.id}`}
                    onPress={() => setFeatured(entry.id)}
                    disabled={isLoading}
                    style={[
                      styles.pickerChip,
                      { backgroundColor: (em?.color || COLORS.primaryLight) + '80' },
                      active && styles.pickerChipActive,
                    ]}
                  >
                    <EmotionVisual emotion={em} size={44} radius={RADIUS.sm} />
                    <Text style={styles.pickerChipLabel} numberOfLines={1}>
                      {emList.map((e) => e.label).join('·')}
                    </Text>
                    {active && (
                      <View style={styles.activeBadge}>
                        <Feather name="check" size={10} color={COLORS.textPrimary} />
                      </View>
                    )}
                    {isLoading && (
                      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 4 }} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        ) : entriesForDay.length === 0 ? (
          <View style={styles.emptyCard} testID="calendar-empty">
            <Feather name="feather" size={22} color={COLORS.textDisabled} />
            <Text style={styles.emptyText}>呢一日冇記錄。</Text>
          </View>
        ) : (
          entriesForDay.map((entry) => {
            const emList = (entry.emotions?.length ? entry.emotions : [entry.emotion])
              .map((k) => EMOTION_BY_KEY[k])
              .filter(Boolean);
            const em = emList[0];
            const isFeatured = featuredIdForSelected === entry.id;
            const noteIsLong = (entry.note || '').length > 60;
            return (
              <Pressable
                key={entry.id}
                testID={`calendar-entry-${entry.id}`}
                onPress={() => setDetailEntry(entry)}
                style={({ pressed }) => [
                  styles.entryCard,
                  { backgroundColor: (em?.color || COLORS.primaryLight) + '40' },
                  isFeatured && styles.entryCardFeatured,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryEmotionStack}>
                    {emList.slice(0, 3).map((e, i) => (
                      <View
                        key={e.key}
                        style={[
                          styles.entryEmotionStackItem,
                          { marginLeft: i === 0 ? 0 : -14, zIndex: 3 - i },
                        ]}
                      >
                        <EmotionVisual emotion={e} size={40} radius={RADIUS.sm} />
                      </View>
                    ))}
                    {emList.length > 3 && (
                      <View style={styles.entryMoreBadge}>
                        <Text style={styles.entryMoreText}>+{emList.length - 3}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryLabel} numberOfLines={1}>
                      {emList.map((e) => e.label).join(' · ') || (em?.label || entry.emotion)}
                    </Text>
                    {isFeatured && entriesForDay.length > 1 && (
                      <View style={styles.featuredTag}>
                        <Feather name="star" size={10} color={COLORS.primary} />
                        <Text style={styles.featuredTagText}>喺日曆上代表呢一日</Text>
                      </View>
                    )}
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
                </View>
                {entry.note ? (
                  <>
                    <Text style={styles.entryNote} numberOfLines={NOTE_PREVIEW_LINES}>
                      {entry.note}
                    </Text>
                    {noteIsLong && (
                      <Text style={styles.readMore}>撳入去 · 睇全部故事</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.entryEmptyNote}>仲未寫故事 · 撳入去加返</Text>
                )}
              </Pressable>
            );
          })
        )}
        <View style={{ marginTop: SPACING.lg }}>
          <SupportCtaRow title="需要陪伴嘅時候" />
          <Pressable
            testID="cal-cta-explore"
            style={styles.exploreCard}
            onPress={() => router.push('/explore')}
          >
            <View style={styles.exploreIcon}>
              <Feather name="book-open" size={22} color={COLORS.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exploreTitle}>探索自己 · 回望</Text>
              <Text style={styles.exploreSub}>
                溫柔咁記起過去 · 認識自己多啲
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      <EntryDetailModal
        visible={!!detailEntry}
        entry={detailEntry}
        onClose={() => setDetailEntry(null)}
        onEdit={() => detailEntry && setEditingEntry(detailEntry)}
      />
      <EntryEditModal
        visible={!!editingEntry}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={(updated) => {
          setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        }}
        onDeleted={(id) => {
          setEntries((prev) => prev.filter((e) => e.id !== id));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { padding: SPACING.lg },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  calendarWrap: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dayCell: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconWrapSelected: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  dayNumWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumWrapSelected: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  dayNumWrapToday: {
    backgroundColor: COLORS.primaryLight,
  },
  dayNum: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  dayCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  pickerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pickerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  pickerHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  pickerRow: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  pickerChip: {
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    alignItems: 'center',
    minWidth: 68,
    position: 'relative',
  },
  pickerChipActive: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  pickerChipLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  activeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: { color: COLORS.textSecondary },
  entryCard: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  entryCardFeatured: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  entryEmotionStack: { flexDirection: 'row', alignItems: 'center' },
  entryEmotionStackItem: {
    borderWidth: 2,
    borderColor: COLORS.bgCard,
    borderRadius: RADIUS.sm + 2,
  },
  entryMoreBadge: {
    marginLeft: 4,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  entryMoreText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  entryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  featuredTagText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  entryNote: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  entryEmptyNote: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  readMore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#FFC8DD',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  exploreIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFB3D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  exploreSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
