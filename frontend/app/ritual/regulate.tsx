import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
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
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

type ActivityKind =
  | 'breath_4_7_8'
  | 'punch_bag'
  | 'grounding'
  | 'box_breathing'
  | 'affirmation'
  | 'soft_scenes'
  | 'gentle_stretch'
  | 'savor_3'
  | 'skip_hint';

type ActivityDef = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  kind: ActivityKind;
};

/**
 * 「陪碗做啲嘢」· mapped to product table (shake / music / video deferred).
 */
const ACTIVITIES: Record<NSState, ActivityDef[]> = {
  sympathetic_fire: [
    { key: 'punch_bag', label: '打沙包 · 撳快啲', icon: 'zap', kind: 'punch_bag' },
    { key: 'ice_breath', label: '冰塊呼吸 · 4-7-8', icon: 'cloud-snow', kind: 'breath_4_7_8' },
    { key: 'box_breathing', label: '冷靜 box breathing', icon: 'square', kind: 'box_breathing' },
  ],
  dorsal_sad: [
    { key: 'soft_scenes', label: '靚靚風景／小動物', icon: 'image', kind: 'soft_scenes' },
    { key: 'slideshow_affirmations', label: '溫柔小故事', icon: 'book-open', kind: 'affirmation' },
    { key: 'soft_breath', label: '慢慢唞一陣', icon: 'wind', kind: 'breath_4_7_8' },
  ],
  dorsal_freeze: [
    { key: 'grounding_5_4_3_2_1', label: '五感 5-4-3-2-1', icon: 'sun', kind: 'grounding' },
    { key: 'gentle_stretch', label: '慢慢伸個懶腰', icon: 'arrow-up', kind: 'gentle_stretch' },
    { key: 'wake_breath', label: '輕輕呼吸', icon: 'wind', kind: 'breath_4_7_8' },
  ],
  sympathetic_anxious: [
    { key: 'box_breathing', label: 'Box breathing · 落地', icon: 'square', kind: 'box_breathing' },
    { key: 'breath_4_7_8', label: '4-7-8 呼吸', icon: 'wind', kind: 'breath_4_7_8' },
    { key: 'grounding_5_4_3_2_1', label: '五感 grounding', icon: 'eye', kind: 'grounding' },
  ],
  ventral_regulated: [
    { key: 'savor_3_things', label: '寫 3 樣今日靚嘢', icon: 'edit-3', kind: 'savor_3' },
    { key: 'savor_breath', label: '繼續 savor 呼吸', icon: 'wind', kind: 'breath_4_7_8' },
    { key: 'slideshow_affirmations', label: '溫柔金句', icon: 'heart', kind: 'affirmation' },
  ],
  unspoken: [
    { key: 'sit_with_bowl', label: '同碗坐一坐', icon: 'coffee', kind: 'breath_4_7_8' },
    { key: 'slideshow_affirmations', label: '淡淡地金句', icon: 'heart', kind: 'affirmation' },
    { key: 'soft_skip', label: '唔使 goal · 直接繼續', icon: 'skip-forward', kind: 'skip_hint' },
  ],
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
  const activities = ACTIVITIES[state];
  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;

  const [active, setActive] = useState<ActivityKind | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const goRelease = () => router.push('/ritual/release');

  const openActivity = (a: ActivityDef) => {
    if (a.kind === 'skip_hint') {
      goRelease();
      return;
    }
    setActiveKey(a.key);
    setActive(a.kind);
  };

  const completeActivity = (key?: string) => {
    addRegulation(key || activeKey || 'activity');
    setActive(null);
    setActiveKey(null);
  };

  const closeActivity = () => {
    setActive(null);
    setActiveKey(null);
  };

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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.bowl}>
          <EmotionVisual emotion={emotion} size={160} radius={RADIUS.lg} />
        </View>
        <Text testID="regulate-state-title" style={styles.title}>
          {w.regulate_by_state[state]}
        </Text>
        <Text style={styles.sub}>揀一樣同碗一齊做 · 唔使全部</Text>

        {activities.map((a) => {
          const done = regulationUsed.includes(a.key);
          return (
            <Pressable
              key={a.key}
              testID={`regulate-activity-${a.key}`}
              onPress={() => openActivity(a)}
              style={styles.activity}
            >
              <View style={styles.activityIcon}>
                <Feather name={a.icon} size={18} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.activityLabel}>{a.label}</Text>
              {done ? (
                <Feather name="check" size={18} color={COLORS.primary} />
              ) : (
                <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
              )}
            </Pressable>
          );
        })}

        <Pressable testID="regulate-skip-btn" onPress={goRelease} style={styles.skip}>
          <Text style={styles.skipText}>{w.regulate_skip}</Text>
        </Pressable>

        <Pressable testID="regulate-next-btn" onPress={goRelease} style={styles.cta}>
          <Text style={styles.ctaText}>下一步 →</Text>
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
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  bowl: { alignItems: 'center', marginBottom: SPACING.md },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 30,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  skip: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  skipText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
