import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ReleaseActionAnim } from '@/src/components/release-action-anim';
import { DiaryRitualScene, diaryRitualForRelease } from '@/src/components/ritual/diary-ritual-scene';
import { StreamDriftScene } from '@/src/components/ritual/stream-drift-scene';
import { STATE_REACTION } from '@/src/components/regulate-state-stage';
import { encodeDecorations } from '@/src/constants/bowl-decorations';
import {
  BOWL_RELEASE_ACTIONS,
  type BowlReleaseKey,
} from '@/src/constants/bowl-release';
import { emotionForBowlKey, resolvedBowlKey } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import {
  listMyDiaryEntries,
  markRitualSmileCompleted,
  saveRitualWithActivities,
} from '@/src/lib/diary';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { pickPraise } from '@/src/lib/ritual/praise-pool';
import { detectState } from '@/src/lib/ritual/state-detector';
import { usesStreamDriftScene } from '@/src/lib/ritual/stream-drift';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

const SMILE_HOLD_MS = 2000;

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

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
  const notifyTeacher = useRitualStore((s) => s.notifyTeacher);
  const startedAt = useRitualStore((s) => s.startedAt);
  const regulationUsed = useRitualStore((s) => s.regulationUsed);
  const setBowlRelease = useRitualStore((s) => s.setBowlRelease);
  const addRegulation = useRitualStore((s) => s.addRegulation);
  const setShares = useRitualStore((s) => s.setShares);
  const reset = useRitualStore((s) => s.reset);
  const ensureBowl = useRitualStore((s) => s.ensureBowl);
  const w = wordingFor(ageGroup);

  useEffect(() => {
    ensureBowl();
  }, [ensureBowl]);

  const nsState = useMemo(() => detectState(soup, bodyChips), [soup, bodyChips]);
  const bridgeLine = w.bridge_by_state[nsState];
  const releaseLead = w.release_lead_by_state[nsState];
  const reaction = STATE_REACTION[nsState];

  const emotion = emotionForBowlKey(selectedBowlKey);
  const bowlKey = resolvedBowlKey(selectedBowlKey);
  const hasBowl = !!emotion;
  const wroteDiary = checkInType !== 'hug_only' && diaryText.trim().length > 0;
  const releaseSub = hasBowl ? w.release_sub : w.release_diary_sub;
  const releaseActions = hasBowl ? w.release_actions : w.release_diary_actions;
  const animCaptions = hasBowl ? w.release_anim_captions : w.release_diary_anim_captions;
  const [picked, setPicked] = useState<BowlReleaseKey | null>(bowlRelease);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<'act' | 'anim' | 'done'>('act');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(1);
  const [smiled, setSmiled] = useState(false);
  const [praiseLine, setPraiseLine] = useState<string | null>(null);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStarted = useRef(0);

  const onAnimDone = useCallback(() => {
    setPhase('act');
  }, []);

  const onPick = (key: BowlReleaseKey) => {
    setPicked(key);
    setBowlRelease(key);
    addRegulation(`release:${key}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('anim');
  };

  const buildPraise = async (bowlKey: string | null) => {
    try {
      const entries = await listMyDiaryEntries();
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const weekEntries = entries.filter((e) => {
        const t = e.created_at ? Date.parse(e.created_at) : 0;
        return t >= weekAgo;
      }).length;
      let daysSinceLast = 0;
      if (entries.length >= 2) {
        const prev = entries[1];
        const prevT = prev.created_at ? Date.parse(prev.created_at) : now;
        daysSinceLast = Math.max(
          0,
          Math.floor((startOfLocalDay(new Date()) - startOfLocalDay(new Date(prevT))) / 86400000),
        );
      }
      const isNewBowlThisMonth =
        !!bowlKey &&
        !entries.slice(1).some((e) => {
          const t = e.created_at ? Date.parse(e.created_at) : 0;
          const key = e.emotions?.[0] || e.emotion;
          return t >= monthStart.getTime() && key === bowlKey;
        });
      setPraiseLine(
        pickPraise({
          totalEntries: entries.length,
          weekEntries,
          daysSinceLast,
          isNewBowlThisMonth,
        }),
      );
    } catch {
      setPraiseLine(pickPraise({ totalEntries: 1, weekEntries: 1, daysSinceLast: 0 }));
    }
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
          bowl_emotion_key: bowlKey,
          bowl_color_tint: encodeDecorations(decorations),
          bowl_size: bowlSize,
          bowl_release: picked,
          diary_text: checkInType === 'hug_only' ? null : diaryText || null,
          check_in_type: checkInType === 'hug_only' ? 'hug_only' : 'full',
          is_public: false,
          // notify_teacher = 「想老師留意」only · never opens diary content
          notify_teacher: notifyTeacher,
          // Family notify UI hidden until parent inbox ships
          shared_with_family: false,
          smile_completed: false,
          time_spent_sec: timeSpent,
        },
        regulationUsed,
      );
      setEntryId(entry.id);
      setMinutes(Math.max(1, Math.round((timeSpent || 60) / 60)));
      await buildPraise(bowlKey);
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
          {praiseLine ? (
            <Text testID="release-praise-pool" style={styles.wrotePraise}>
              {praiseLine}
            </Text>
          ) : null}
          {wroteDiary && (
            <Text testID="release-wrote-praise" style={styles.wrotePraise}>
              {w.release_wrote_praise}
            </Text>
          )}

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

  if (phase === 'anim' && picked) {
    const paperRitual = diaryRitualForRelease(picked);
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.animWrap}>
          {usesStreamDriftScene(picked) ? (
            <StreamDriftScene
              emotion={emotion}
              decorations={decorations}
              diaryMode={!hasBowl}
              onDone={onAnimDone}
            />
          ) : paperRitual ? (
            <DiaryRitualScene
              ritual={paperRitual}
              emotion={emotion}
              caption={animCaptions[picked]}
              onDone={onAnimDone}
            />
          ) : (
            <ReleaseActionAnim
              action={picked}
              emotion={emotion}
              decorations={decorations}
              diaryMode={!hasBowl}
              caption={animCaptions[picked]}
              onDone={onAnimDone}
            />
          )}
          <Pressable
            testID="release-anim-skip"
            onPress={onAnimDone}
            style={styles.animSkip}
            accessibilityLabel="繼續"
          >
            <Text style={styles.animSkipText}>繼續</Text>
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

        {/* Optional share invite · state × age tone · first */}
        <View
          testID="release-bridge-card"
          style={[styles.bridgeCard, { backgroundColor: reaction.tint, borderColor: reaction.accent }]}
        >
          <Text style={styles.bridgeEyebrow}>{w.bridge_eyebrow}</Text>
          <Text style={styles.bridgeEmoji}>{reaction.emoji}</Text>
          <Text style={[styles.bridgeFeel, { color: reaction.accent }]}>
            碗 feel 到 · {reaction.feel}
          </Text>
          <Text testID="release-bridge-line" style={styles.bridgeLine}>
            {bridgeLine}
          </Text>
        </View>

        <Text testID="release-share-heading" style={styles.shareHeading}>
          {w.release_share_heading}
        </Text>
        <Text testID="release-share-privacy" style={styles.sharePrivacy}>
          日記原文永遠只有你睇到。系統可能提示老師「值得關心」· 唔顯示你寫咩。如果你撳「想老師留意」· 老師只會見「可能要關注」。
        </Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{w.bridge_share_class}</Text>
          <Switch
            testID="release-notify-teacher"
            value={notifyTeacher}
            onValueChange={(v) => setShares({ notifyTeacher: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>
        <Text testID="release-family-soon" style={styles.sharePrivacy}>
          「想屋企人留意」稍後推出 · 而家未會通知屋企
        </Text>

        <Text testID="release-lead" style={styles.title}>
          {releaseLead}
        </Text>
        <Text style={styles.sub}>{releaseSub}</Text>
        {wroteDiary && (
          <Text testID="release-wrote-praise-act" style={styles.wrotePraiseAct}>
            {w.release_wrote_praise}
          </Text>
        )}

        <View style={styles.list}>
          {BOWL_RELEASE_ACTIONS.map((action) => {
            const active = picked === action.key;
            const copy = releaseActions[action.key];
            return (
              <Pressable
                key={action.key}
                testID={`release-${action.key}`}
                onPress={() => onPick(action.key)}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.emoji}>{action.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{copy.label}</Text>
                  <Text style={styles.cardHint}>{copy.hint}</Text>
                </View>
                {active && <Feather name="check" size={18} color={COLORS.textPrimary} />}
              </Pressable>
            );
          })}
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
  bridgeCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bridgeEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bridgeEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  bridgeFeel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  bridgeLine: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  shareHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  sharePrivacy: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.sm,
    marginTop: -4,
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
  animWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    width: '100%',
  },
  animSkip: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  animSkipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
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
    marginBottom: SPACING.sm,
  },
  wrotePraise: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  wrotePraiseAct: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    lineHeight: 22,
    overflow: 'hidden',
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
