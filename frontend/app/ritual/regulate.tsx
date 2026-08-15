import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import {
  RegulateStateStage,
  STATE_REACTION,
} from '@/src/components/regulate-state-stage';
import { AffirmationSlideshow } from '@/src/components/regulation/affirmation-slideshow';
import { BoxBreathing } from '@/src/components/regulation/box-breathing';
import { Breath478 } from '@/src/components/regulation/breath-4-7-8';
import { GentleStretch } from '@/src/components/regulation/gentle-stretch';
import { Grounding54321 } from '@/src/components/regulation/grounding-5-4-3-2-1';
import { PunchBag } from '@/src/components/regulation/punch-bag';
import { Savor3Things } from '@/src/components/regulation/savor-3-things';
import { SoftScenes } from '@/src/components/regulation/soft-scenes';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { detectState, type NSState } from '@/src/lib/ritual/state-detector';
import { useRitualStore, type AgeGroup } from '@/src/lib/ritual/ritual-store';

type ActivityKind =
  | 'breath_4_7_8'
  | 'punch_bag'
  | 'grounding'
  | 'box_breathing'
  | 'affirmation'
  | 'soft_scenes'
  | 'gentle_stretch'
  | 'savor_3';

type ActivityDef = {
  key: string;
  kind: ActivityKind;
  icon: keyof typeof Feather.glyphMap;
};

const ACTIVITY_KEYS: Record<NSState, ActivityDef[]> = {
  sympathetic_fire: [
    { key: 'punch_bag', kind: 'punch_bag', icon: 'zap' },
    { key: 'ice_breath', kind: 'breath_4_7_8', icon: 'cloud-snow' },
    { key: 'box_breathing', kind: 'box_breathing', icon: 'square' },
  ],
  dorsal_sad: [
    { key: 'soft_scenes', kind: 'soft_scenes', icon: 'image' },
    { key: 'slideshow_affirmations', kind: 'affirmation', icon: 'book-open' },
    { key: 'soft_breath', kind: 'breath_4_7_8', icon: 'wind' },
  ],
  dorsal_freeze: [
    { key: 'grounding_5_4_3_2_1', kind: 'grounding', icon: 'sun' },
    { key: 'gentle_stretch', kind: 'gentle_stretch', icon: 'arrow-up' },
    { key: 'wake_breath', kind: 'breath_4_7_8', icon: 'wind' },
  ],
  sympathetic_anxious: [
    { key: 'box_breathing', kind: 'box_breathing', icon: 'square' },
    { key: 'breath_4_7_8', kind: 'breath_4_7_8', icon: 'wind' },
    { key: 'grounding_5_4_3_2_1', kind: 'grounding', icon: 'eye' },
  ],
  ventral_regulated: [
    { key: 'savor_3_things', kind: 'savor_3', icon: 'edit-3' },
    { key: 'savor_breath', kind: 'breath_4_7_8', icon: 'wind' },
    { key: 'slideshow_affirmations', kind: 'affirmation', icon: 'heart' },
  ],
  unspoken: [
    { key: 'sit_with_bowl', kind: 'breath_4_7_8', icon: 'coffee' },
    { key: 'slideshow_affirmations', kind: 'affirmation', icon: 'heart' },
  ],
};

/** Age-banded labels so P1–P3 vs P4–P6 feel different. */
const ACTIVITY_LABELS: Record<AgeGroup, Record<string, string>> = {
  lower: {
    punch_bag: '大力撳沙包！',
    ice_breath: '凍凍哋呼吸',
    box_breathing: '畫個四方唞氣',
    soft_scenes: '睇得意動物／風景',
    slideshow_affirmations: '聽溫柔小故事',
    soft_breath: '慢慢唞一陣',
    grounding_5_4_3_2_1: '玩 5-4-3-2-1',
    gentle_stretch: '伸個懶腰',
    wake_breath: '輕輕唞',
    breath_4_7_8: '慢慢數住唞',
    savor_3_things: '寫 3 樣開心嘢',
    savor_breath: '再唞多陣',
    sit_with_bowl: '同碗坐一坐',
  },
  upper: {
    punch_bag: '打沙包 · 撳快啲',
    ice_breath: '冰塊呼吸 · 4-7-8',
    box_breathing: '冷靜 box breathing',
    soft_scenes: '靚靚風景／小動物',
    slideshow_affirmations: '溫柔小故事',
    soft_breath: '慢慢唞一陣',
    grounding_5_4_3_2_1: '五感 5-4-3-2-1',
    gentle_stretch: '慢慢伸個懶腰',
    wake_breath: '輕輕呼吸',
    breath_4_7_8: '4-7-8 呼吸',
    savor_3_things: '寫 3 樣今日靚嘢',
    savor_breath: '繼續 savor 呼吸',
    sit_with_bowl: '同碗坐一坐 · 呼吸',
  },
  adult: {
    punch_bag: '釋放 · 打沙包',
    ice_breath: '冰塊呼吸引導',
    box_breathing: 'Box breathing',
    soft_scenes: '溫柔畫面',
    slideshow_affirmations: '溫柔金句',
    soft_breath: '慢慢呼吸',
    grounding_5_4_3_2_1: '五感 grounding',
    gentle_stretch: '伸展懶腰',
    wake_breath: '輕輕呼吸',
    breath_4_7_8: '4-7-8 呼吸',
    savor_3_things: '寫下今日 3 樣好事',
    savor_breath: 'savor 呼吸',
    sit_with_bowl: '同自己坐一坐',
  },
};

export default function RitualRegulateScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const regulationUsed = useRitualStore((s) => s.regulationUsed);
  const addRegulation = useRitualStore((s) => s.addRegulation);
  const w = wordingFor(ageGroup);

  const state = useMemo(() => detectState(soup, bodyChips), [soup, bodyChips]);
  const reaction = STATE_REACTION[state];
  const activityDefs = ACTIVITY_KEYS[state];
  const labels = ACTIVITY_LABELS[ageGroup] || ACTIVITY_LABELS.upper;
  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const didCompanion = useMemo(
    () => activityDefs.some((a) => regulationUsed.includes(a.key)),
    [activityDefs, regulationUsed],
  );

  const [active, setActive] = useState<ActivityKind | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sessionDone, setSessionDone] = useState<string[]>([]);

  const goRelease = () => router.push('/ritual/release');

  const openActivity = (a: ActivityDef) => {
    setActiveKey(a.key);
    setActive(a.kind);
  };

  const completeActivity = (key?: string) => {
    const k = key || activeKey || 'activity';
    addRegulation(k);
    setSessionDone((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setActive(null);
    setActiveKey(null);
  };

  const closeActivity = () => {
    setActive(null);
    setActiveKey(null);
  };

  const accompanied = didCompanion || sessionDone.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-regulate-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text testID="regulate-eyebrow" style={styles.eyebrow}>
          {w.regulate_eyebrow}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RegulateStateStage
          state={state}
          title={w.regulate_by_state[state]}
          subtitle={w.regulate_sub_by_state[state]}
        />

        <View style={styles.bowl}>
          <EmotionVisual emotion={emotion} size={120} radius={RADIUS.lg} />
        </View>

        <Text style={styles.hint}>{w.regulate_pick_hint(reaction.feel)}</Text>

        {activityDefs.map((a) => {
          const done = regulationUsed.includes(a.key) || sessionDone.includes(a.key);
          return (
            <Pressable
              key={a.key}
              testID={`regulate-activity-${a.key}`}
              onPress={() => openActivity(a)}
              style={[
                styles.activity,
                { borderColor: done ? reaction.accent : 'transparent' },
                done && { backgroundColor: reaction.tint },
              ]}
            >
              <View style={[styles.activityIcon, { backgroundColor: reaction.tint }]}>
                <Text style={styles.activityEmoji}>{reaction.emoji}</Text>
              </View>
              <Text style={styles.activityLabel}>{labels[a.key] || a.key}</Text>
              {done ? (
                <Feather name="check" size={18} color={reaction.accent} />
              ) : (
                <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
              )}
            </Pressable>
          );
        })}

        <Pressable
          testID="regulate-next-btn"
          onPress={goRelease}
          disabled={!accompanied}
          style={[styles.cta, !accompanied && { opacity: 0.4 }]}
        >
          <Text style={styles.ctaText}>{w.regulate_next}</Text>
        </Pressable>

        <Pressable testID="regulate-skip-btn" onPress={goRelease} style={styles.skip}>
          <Text style={styles.skipText}>{w.regulate_skip}</Text>
        </Pressable>
      </ScrollView>

      <Breath478
        visible={active === 'breath_4_7_8'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <PunchBag
        visible={active === 'punch_bag'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <Grounding54321
        visible={active === 'grounding'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <BoxBreathing
        visible={active === 'box_breathing'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <AffirmationSlideshow
        visible={active === 'affirmation'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <SoftScenes
        visible={active === 'soft_scenes'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <GentleStretch
        visible={active === 'gentle_stretch'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
      <Savor3Things
        visible={active === 'savor_3'}
        onClose={closeActivity}
        onComplete={() => completeActivity()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  bowl: { alignItems: 'center', marginBottom: SPACING.md },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: { fontSize: 20 },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  skip: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  skipText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
