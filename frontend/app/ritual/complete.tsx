import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { RitualDiaryFooter } from '@/src/components/ritual-diary-escape';
import { tintBackdrop } from '@/src/constants/bowl-color-tints';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { listMyDiaryEntries, markRitualSmileCompleted } from '@/src/lib/diary';
import { pickPraise } from '@/src/lib/ritual/praise-pool';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualCompleteScreen() {
  const router = useRouter();
  const { entryId, minutes } = useLocalSearchParams<{ entryId?: string; minutes?: string }>();
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const colorTint = useRitualStore((s) => s.colorTint);
  const reset = useRitualStore((s) => s.reset);
  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;

  const [praise, setPraise] = useState('你今日肯打開呢個 app · 呢件事本身好勇敢');
  const [smiled, setSmiled] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStarted = useRef(0);

  const mins = useMemo(() => {
    const n = Number(minutes);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }, [minutes]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listMyDiaryEntries();
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const weekEntries = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;
        const last = rows[1]; // after current save, [0] is newest
        const daysSinceLast = last
          ? Math.floor((now - new Date(last.created_at).getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        setPraise(
          pickPraise({
            totalEntries: rows.length,
            weekEntries,
            daysSinceLast,
          }),
        );
      } catch {
        // keep default praise
      }
    })();
  }, []);

  const clearHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const onSmilePressIn = () => {
    if (smiled) return;
    holdStarted.current = Date.now();
    holdProgress.setValue(0);
    Animated.timing(holdProgress, { toValue: 1, duration: 3000, useNativeDriver: false }).start();
    holdTimer.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (Date.now() - holdStarted.current >= 3000) {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View
          style={[
            styles.bowl,
            tintBackdrop(colorTint) && { backgroundColor: tintBackdrop(colorTint) },
          ]}
        >
          <EmotionVisual emotion={emotion} size={200} radius={RADIUS.lg} />
        </View>

        <Text style={styles.headline}>✨ 你搞掂啦 🌸</Text>
        <Text style={styles.praiseMain}>
          你今日肯坐低同自己相處咗 {mins} 分鐘 · 好厲害 · 好棒 🌱
        </Text>
        <Text style={styles.praiseExtra}>{praise}</Text>

        <Text style={styles.smileHint}>對住碗笑一笑 · 3 秒</Text>
        <Pressable
          testID="complete-smile-btn"
          onPressIn={onSmilePressIn}
          onPressOut={onSmilePressOut}
          style={[styles.smileBtn, smiled && styles.smileBtnDone]}
        >
          <Text style={styles.smileEmoji}>{smiled ? '😊' : '🙂'}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: ringWidth }]} />
          </View>
          <Text style={styles.smileLabel}>{smiled ? '多謝你嘅笑' : '撳住 3 秒'}</Text>
        </Pressable>

        <Pressable testID="complete-home-btn" onPress={goHome} style={styles.cta}>
          <Text style={styles.ctaText}>回主頁</Text>
        </Pressable>
      </View>
      <RitualDiaryFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  content: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowl: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  praiseMain: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  praiseExtra: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  smileHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  smileBtn: {
    width: 160,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  smileBtnDone: { backgroundColor: COLORS.primaryLight },
  smileEmoji: { fontSize: 40 },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bgInput,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  smileLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    minWidth: 200,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
