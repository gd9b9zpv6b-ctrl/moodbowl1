import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTIVITIES, ACTIVITY_CATEGORIES, Activity } from '@/src/constants/activities';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type CatKey = Activity['category'];
const CATEGORIES: CatKey[] = ['micro', 'outdoor', 'sensory', 'creative', 'social'];

export default function Activities() {
  const router = useRouter();
  const [cat, setCat] = useState<CatKey | 'all'>('all');
  const [pickedKey, setPickedKey] = useState<string | null>(null);

  const filtered = useMemo(
    () => (cat === 'all' ? ACTIVITIES : ACTIVITIES.filter((a) => a.category === cat)),
    [cat],
  );

  const pickRandom = () => {
    const pool = filtered;
    if (pool.length === 0) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setPickedKey(chosen.key);
  };

  const picked = pickedKey ? ACTIVITIES.find((a) => a.key === pickedKey) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="activities-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} testID="activities-title">
          行出去 · 探索
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stickyHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Chip active={cat === 'all'} label="全部" onPress={() => setCat('all')} testID="chip-all" />
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                testID={`chip-${c}`}
                active={cat === c}
                label={ACTIVITY_CATEGORIES[c]}
                onPress={() => setCat(c)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.body}>
          <Pressable style={styles.dicebutton} onPress={pickRandom} testID="random-activity-btn">
            <Feather name="shuffle" size={18} color={COLORS.textPrimary} />
            <Text style={styles.diceText}>
              {picked ? '再抽一個' : '幫我隨機抽一個'}
            </Text>
          </Pressable>

          {picked && (
            <View
              style={[styles.pickedCard, { backgroundColor: picked.color + '80' }]}
              testID="picked-activity"
            >
              <View style={styles.pickedIconWrap}>
                <Feather name={picked.icon as any} size={30} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.pickedTitle}>{picked.title}</Text>
              <Text style={styles.pickedDesc}>{picked.desc}</Text>
              <Text style={styles.pickedNudge}>試下今日就做呢件事,好嗎?</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            {cat === 'all' ? '全部溫柔提議' : ACTIVITY_CATEGORIES[cat]}
          </Text>

          {filtered.map((a) => (
            <View
              key={a.key}
              testID={`activity-${a.key}`}
              style={[styles.card, { backgroundColor: a.color + '55' }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: a.color }]}>
                <Feather name={a.icon as any} size={20} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stickyHeader: { backgroundColor: COLORS.bgMain },
  chipRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.sm, height: 56, alignItems: 'center' },
  chip: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.textPrimary },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  dicebutton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    height: 52,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
  },
  diceText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  pickedCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  pickedIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  pickedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  pickedDesc: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  pickedNudge: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.md, marginTop: SPACING.sm, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});
