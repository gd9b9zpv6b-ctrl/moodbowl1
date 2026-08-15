import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { AffirmationSlideshow } from '@/src/components/regulation/affirmation-slideshow';
import { BoxBreathing } from '@/src/components/regulation/box-breathing';
import { Breath478 } from '@/src/components/regulation/breath-4-7-8';
import { Grounding54321 } from '@/src/components/regulation/grounding-5-4-3-2-1';
import { PunchBag } from '@/src/components/regulation/punch-bag';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { detectState, type NSState } from '@/src/lib/ritual/state-detector';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

type ActivityDef = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  kind: 'breath_4_7_8' | 'punch_bag' | 'grounding' | 'box_breathing' | 'affirmation' | 'skip_hint';
};

const ACTIVITIES: Record<NSState, ActivityDef[]> = {
  sympathetic_fire: [
    { key: 'breath_4_7_8', label: '4-7-8 呼吸圈', icon: 'wind', kind: 'breath_4_7_8' },
    { key: 'punch_bag', label: '打沙包', icon: 'zap', kind: 'punch_bag' },
    { key: 'box_breathing', label: 'Box Breathing', icon: 'square', kind: 'box_breathing' },
  ],
  dorsal_sad: [
    { key: 'slideshow_affirmations', label: '溫柔金句', icon: 'heart', kind: 'affirmation' },
    { key: 'grounding_5_4_3_2_1', label: '5-4-3-2-1 grounding', icon: 'eye', kind: 'grounding' },
    { key: 'breath_4_7_8', label: '慢慢呼吸', icon: 'wind', kind: 'breath_4_7_8' },
  ],
  sympathetic_anxious: [
    { key: 'box_breathing', label: 'Box Breathing', icon: 'square', kind: 'box_breathing' },
    { key: 'grounding_5_4_3_2_1', label: '5-4-3-2-1 grounding', icon: 'eye', kind: 'grounding' },
    { key: 'breath_4_7_8', label: '4-7-8 呼吸', icon: 'wind', kind: 'breath_4_7_8' },
  ],
  dorsal_freeze: [
    { key: 'grounding_5_4_3_2_1', label: '五感 activation', icon: 'sun', kind: 'grounding' },
    { key: 'breath_4_7_8', label: '輕輕呼吸', icon: 'wind', kind: 'breath_4_7_8' },
    { key: 'slideshow_affirmations', label: '溫柔金句', icon: 'heart', kind: 'affirmation' },
  ],
  ventral_regulated: [
    { key: 'slideshow_affirmations', label: '溫柔金句', icon: 'heart', kind: 'affirmation' },
    { key: 'breath_4_7_8', label: '繼續呼吸 savor', icon: 'wind', kind: 'breath_4_7_8' },
    { key: 'box_breathing', label: 'Box Breathing', icon: 'square', kind: 'box_breathing' },
  ],
  unspoken: [
    { key: 'sit_with_bowl', label: '同碗坐一坐', icon: 'coffee', kind: 'breath_4_7_8' },
    { key: 'slideshow_affirmations', label: '淡淡地金句', icon: 'heart', kind: 'affirmation' },
    { key: 'soft_skip', label: '直接 skip', icon: 'skip-forward', kind: 'skip_hint' },
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

  const [active, setActive] = useState<ActivityDef['kind'] | null>(null);

  const completeActivity = (key: string) => {
    addRegulation(key);
    setActive(null);
  };

  const goRelease = () => router.push('/ritual/release');

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
        <Text style={styles.title}>{w.regulate_by_state[state]}</Text>

        {activities.map((a) => {
          const done = regulationUsed.includes(a.key);
          return (
            <Pressable
              key={a.key}
              testID={`regulate-activity-${a.key}`}
              onPress={() => {
                if (a.kind === 'skip_hint') {
                  goRelease();
                  return;
                }
                setActive(a.kind);
              }}
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
        onClose={() => setActive(null)}
        onComplete={() => completeActivity('breath_4_7_8')}
      />
      <PunchBag
        visible={active === 'punch_bag'}
        onClose={() => setActive(null)}
        onComplete={() => completeActivity('punch_bag')}
      />
      <Grounding54321
        visible={active === 'grounding'}
        onClose={() => setActive(null)}
        onComplete={() => completeActivity('grounding_5_4_3_2_1')}
      />
      <BoxBreathing
        visible={active === 'box_breathing'}
        onClose={() => setActive(null)}
        onComplete={() => completeActivity('box_breathing')}
      />
      <AffirmationSlideshow
        visible={active === 'affirmation'}
        onClose={() => setActive(null)}
        onComplete={() => completeActivity('slideshow_affirmations')}
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
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 28,
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  skip: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  skipText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
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
