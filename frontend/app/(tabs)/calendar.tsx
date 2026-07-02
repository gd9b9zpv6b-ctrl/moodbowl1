import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const markedDates = useMemo(() => {
    const map: Record<string, any> = {};
    for (const e of entries) {
      const em = EMOTION_BY_KEY[e.emotion];
      map[e.entry_date] = {
        customStyles: {
          container: {
            backgroundColor: em?.color || COLORS.primaryLight,
            borderRadius: RADIUS.pill,
          },
          text: { color: COLORS.textPrimary, fontWeight: '700' },
        },
      };
    }
    map[selectedDate] = {
      ...(map[selectedDate] || {}),
      customStyles: {
        ...((map[selectedDate] || {}).customStyles || {}),
        container: {
          ...((map[selectedDate]?.customStyles?.container as any) || {}),
          borderWidth: 2,
          borderColor: COLORS.textPrimary,
          borderRadius: RADIUS.pill,
          backgroundColor:
            ((map[selectedDate]?.customStyles?.container as any) || {}).backgroundColor ||
            COLORS.bgCard,
        },
      },
    };
    return map;
  }, [entries, selectedDate]);

  const entriesForDay = entries.filter((e) => e.entry_date === selectedDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} testID="calendar-title">
          你嘅心路
        </Text>
        <Text style={styles.subtitle}>每一個顏色,都係你曾經好好感受過嘅心情。</Text>

        <View style={styles.calendarWrap}>
          <Calendar
            testID="calendar"
            current={`${month}-01`}
            onMonthChange={(d: DateData) => setMonth(currentMonthKey(new Date(d.dateString)))}
            markingType="custom"
            markedDates={markedDates}
            onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
            monthFormat="yyyy 年 M 月"
            theme={{
              calendarBackground: COLORS.bgCard,
              monthTextColor: COLORS.textPrimary,
              textMonthFontWeight: '700',
              textMonthFontSize: 18,
              dayTextColor: COLORS.textPrimary,
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
              textDayFontWeight: '500',
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
                  {em?.image && <Image source={em.image} style={styles.entryImg} />}
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
  entryImg: { width: 40, height: 40, borderRadius: RADIUS.sm },
  entryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  entryNote: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
});
