import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EXPLORE_PROMPTS,
  ExploreStage,
  STAGE_COLOR,
  STAGE_ICON,
  STAGE_TITLE,
} from '@/src/constants/explore-prompts';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Memory } from '@/src/lib/api';

const STAGES: ExploreStage[] = ['childhood', 'teen', 'young-adult', 'adult', 'reflection'];

export default function Explore() {
  const router = useRouter();
  const [stage, setStage] = useState<ExploreStage>('childhood');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await api.get<Memory[]>('/memories');
      setMemories(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const promptsForStage = useMemo(
    () => EXPLORE_PROMPTS.filter((p) => p.stage === stage),
    [stage],
  );

  const memoriesByPrompt = useMemo(() => {
    const map: Record<string, Memory[]> = {};
    for (const m of memories) {
      if (!map[m.prompt_key]) map[m.prompt_key] = [];
      map[m.prompt_key].push(m);
    }
    return map;
  }, [memories]);

  const openWrite = (promptKey: string) => {
    router.push({ pathname: '/explore/write', params: { promptKey } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="explore-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} testID="explore-title">
          探索自己
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View style={styles.introWrap}>
          <Text style={styles.intro}>
            寫俾自己聽 · 每一段記憶{'\n'}都會幫你認識自己多啲
          </Text>
          {memories.length > 0 && (
            <View style={styles.savedBadge}>
              <Feather name="book-open" size={14} color={COLORS.primary} />
              <Text style={styles.savedText}>
                你已經寫低 {memories.length} 段回憶
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stickyHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {STAGES.map((s) => {
              const active = stage === s;
              return (
                <Pressable
                  key={s}
                  testID={`stage-${s}`}
                  onPress={() => setStage(s)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Feather
                    name={STAGE_ICON[s] as any}
                    size={14}
                    color={active ? COLORS.textPrimary : COLORS.textSecondary}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {STAGE_TITLE[s]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
          ) : (
            promptsForStage.map((p) => {
              const written = memoriesByPrompt[p.key];
              return (
                <Pressable
                  key={p.key}
                  testID={`prompt-${p.key}`}
                  onPress={() => openWrite(p.key)}
                  style={[styles.promptCard, { backgroundColor: STAGE_COLOR[p.stage] + '60' }]}
                >
                  <Text style={styles.promptText}>{p.text}</Text>
                  {p.hint && <Text style={styles.promptHint}>{p.hint}</Text>}
                  {written && written.length > 0 ? (
                    <View style={styles.writtenChip}>
                      <Feather name="check-circle" size={12} color={COLORS.primary} />
                      <Text style={styles.writtenText}>已寫低 · 撳入去睇 / 加多啲</Text>
                    </View>
                  ) : (
                    <View style={styles.writePromptChip}>
                      <Feather name="edit-3" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.writePromptText}>撳一下 開始寫</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
          <Text style={styles.footer}>
            你有你嘅節奏。{'\n'}唔想寫就唔寫 · 想幾時停就幾時停。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  introWrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  intro: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24 },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  savedText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  stickyHeader: { backgroundColor: COLORS.bgMain, paddingVertical: SPACING.xs },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    height: 56,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.textPrimary },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  promptCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  promptText: { fontSize: 17, color: COLORS.textPrimary, fontWeight: '600', lineHeight: 26 },
  promptHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  writtenChip: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
  },
  writtenText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  writePromptChip: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  writePromptText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  footer: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
});
