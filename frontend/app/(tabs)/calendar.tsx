import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const [month, setMonth] = useState(currentMonthKey());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [loading, setLoading] = useState(true);

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

  // Latest entry per date, so each day cell shows one representative emotion.
  const entryByDate = useMemo(() => {
    const map: Record<string, Entry> = {};
    for (const e of entries) {
      if (!map[e.entry_date]) map[e.entry_date] = e;
    }
    return map;
  }, [entries]);

  const entriesForDay = entries.filter((e) => e.entry_date === selectedDate);

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
              const entry = entryByDate[date.dateString];
              const em = entry ? EMOTION_BY_KEY[entry.emotion] : undefined;
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

        <Text style={styles.sectionTitle}>{selectedDate}</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        ) : entriesForDay.length === 0 ? (
          <View style={styles.emptyCard} testID="calendar-empty">
            <Feather name="feather" size={22} color={COLORS.textDisabled} />
            <Text style={styles.emptyText}>呢一日冇記錄。</Text>
          </View>
        ) : (
          entriesForDay.map((entry) => {
            const em = EMOTION_BY_KEY[entry.emotion];
            return (
              <View
                key={entry.id}
                testID={`calendar-entry-${entry.id}`}
                style={[styles.entryCard, { backgroundColor: (em?.color || COLORS.primaryLight) + '40' }]}
              >
                <View style={styles.entryHeader}>
                  <EmotionVisual emotion={em} size={40} radius={RADIUS.sm} />
                  <Text style={styles.entryLabel}>{em?.label || entry.emotion}</Text>
                </View>
                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
              </View>
            );
          })
        )}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: { color: COLORS.textSecondary },
  entryCard: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  entryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  entryNote: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
});
