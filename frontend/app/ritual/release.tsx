import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import { encodeDecorations } from '@/src/constants/bowl-decorations';
import {
  BOWL_RELEASE_ACTIONS,
  type BowlReleaseKey,
} from '@/src/constants/bowl-release';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { markRitualSmileCompleted, saveRitualWithActivities } from '@/src/lib/diary';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

const SMILE_HOLD_MS = 2000;

/**
 * Symbolic release + share/save + short done (smile / home) in one step.
 */
export default function RitualReleaseScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const decorations = useRitualStore((s) => s.decorations);
  const bowlSize = useRitualStore((s) => s.bowlSize);
  const diaryText = useRitualStore((s) => s.diaryText);
  const checkInType = useRitualStore((s) => s.checkInType);
  const bowlRelease = useRitualStore((s) => s.bowlRelease);
  const shareClass = useRitualStore((s) => s.shareClass);
  const shareFamily = useRitualStore((s) => s.shareFamily);
  const shareTimeline = useRitualStore((s) => s.shareTimeline);
  const startedAt = useRitualStore((s) => s.startedAt);
  const regulationUsed = useRitualStore((s) => s.regulationUsed);
  const setBowlRelease = useRitualStore((s) => s.setBowlRelease);
  const addRegulation = useRitualStore((s) => s.addRegulation);
  const setShares = useRitualStore((s) => s.setShares);
  const reset = useRitualStore((s) => s.reset);
  const w = wordingFor(ageGroup);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const [picked, setPicked] = useState<BowlReleaseKey | null>(bowlRelease);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<'act' | 'done'>('act');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(1);
  const [smiled, setSmiled] = useState(false);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStarted = useRef(0);

  const onPick = (key: BowlReleaseKey) => {
    setPicked(key);
    setBowlRelease(key);
    addRegulation(`release:${key}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const onSave = async () => {
    if (!picked || saving) return;
    setSaving(true);
    try {
      const timeSpent =
        startedAt != null ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
      const entry = await saveRitualWithActivities(
        {
          soup,
          body_chips: bodyChips,
          bowl_emotion_key: selectedBowlKey,
          bowl_color_tint: encodeDecorations(decorations),
          bowl_size: bowlSize,
          diary_text: checkInType === 'hug_only' ? null : diaryText || null,
          check_in_type: checkInType === 'hug_only' ? 'hug_only' : 'full',
          is_public: shareClass,
          shared_with_class: shareClass,
          shared_with_family: shareFamily,
          smile_completed: false,
          time_spent_sec: timeSpent,
        },
        regulationUsed,
      );
      setEntryId(entry.id);
      setMinutes(Math.max(1, Math.round((timeSpent || 60) / 60)));
      setPhase('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '過陣再試';
      Alert.alert('儲存唔到', msg, [{ text: '好' }]);
    } finally {
      setSaving(false);
    }
  };

  const clearHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const onSmilePressIn = () => {
    if (smiled) return;
    holdStarted.current = Date.now();
    holdProgress.setValue(0);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: SMILE_HOLD_MS,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (Date.now() - holdStarted.current >= SMILE_HOLD_MS) {
        clearHold();
        setSmiled(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (entryId) {
          markRitualSmileCompleted(entryId).catch(() => {});
        }
      }
    }, 500);
  };

  const onSmilePressOut = () => {
    if (!smiled) clearHold();
  };

  const goHome = () => {
    reset();
    router.replace('/(tabs)');
  };

  const ringWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.doneWrap}>
          <View style={styles.bowl}>
            <BowlWithDecor
              emotion={emotion}
              size={160}
              radius={RADIUS.lg}
              decorations={decorations}
            />
          </View>

          <Text style={styles.doneTitle}>{w.release_done_title}</Text>
          <Text style={styles.doneSub}>
            {w.release_done_sub(minutes)}
          </Text>

          <Text style={styles.smileHint}>{w.release_smile_hint}</Text>
          <Pressable
            testID="release-smile-btn"
            onPressIn={onSmilePressIn}
            onPressOut={onSmilePressOut}
            style={[styles.smileBtn, smiled && styles.smileBtnDone]}
          >
            <Text style={styles.smileEmoji}>{smiled ? '😊' : '🙂'}</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: ringWidth }]} />
            </View>
            <Text style={styles.smileLabel}>
              {smiled ? w.release_smile_done : w.release_smile_hold}
            </Text>
          </Pressable>

          <Pressable testID="release-home-btn" onPress={goHome} style={styles.cta}>
            <Text style={styles.ctaText}>{w.release_home}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-release-back"
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
          <BowlWithDecor
            emotion={emotion}
            size={140}
            radius={RADIUS.lg}
            decorations={decorations}
          />
        </View>

        <Text style={styles.title}>{w.release_title(emotion?.label || '碗')}</Text>
        <Text style={styles.sub}>{w.release_sub}</Text>

        <View style={styles.list}>
          {BOWL_RELEASE_ACTIONS.map((action) => {
            const active = picked === action.key;
            return (
              <Pressable
                key={action.key}
                testID={`release-${action.key}`}
                onPress={() => onPick(action.key)}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.emoji}>{action.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{w.release_actions[action.key].label}</Text>
                  <Text style={styles.cardHint}>{w.release_actions[action.key].hint}</Text>
                </View>
                {active && <Feather name="check" size={18} color={COLORS.textPrimary} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.shareHeading}>{w.release_share_heading}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{w.bridge_share_timeline}</Text>
          <Switch
            testID="release-share-timeline"
            value={shareTimeline}
            onValueChange={(v) => setShares({ shareTimeline: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{w.bridge_share_class}</Text>
          <Switch
            testID="release-share-class"
            value={shareClass}
            onValueChange={(v) => setShares({ shareClass: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{w.bridge_share_family}</Text>
          <Switch
            testID="release-share-family"
            value={shareFamily}
            onValueChange={(v) => setShares({ shareFamily: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>

        <Pressable
          testID="release-finish-btn"
          onPress={onSave}
          disabled={!picked || saving}
          style={[styles.cta, (!picked || saving) && { opacity: 0.45 }]}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.ctaText}>{w.release_finish}</Text>
          )}
        </Pressable>

        <Pressable
          testID="release-regulate-btn"
          onPress={() => {
            if (!picked) return;
            router.push('/ritual/regulate');
          }}
          disabled={!picked || saving}
          style={styles.secondary}
        >
          <Text style={[styles.secondaryText, !picked && { opacity: 0.45 }]}>
            {w.release_regulate}
          </Text>
        </Pressable>
      </ScrollView>
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
  list: { gap: SPACING.sm, marginBottom: SPACING.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: COLORS.textPrimary,
    backgroundColor: COLORS.primaryLight,
  },
  emoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  cardHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  shareHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    minWidth: 200,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  secondary: { alignItems: 'center', paddingVertical: SPACING.md },
  secondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  doneWrap: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  doneSub: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  smileHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  smileBtn: {
    width: 150,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  smileBtnDone: { backgroundColor: COLORS.primaryLight },
  smileEmoji: { fontSize: 36 },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bgInput,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  smileLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
});
