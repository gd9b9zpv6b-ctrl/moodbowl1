import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { EmotionVisual } from '@/src/components/emotion-visual';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const MILESTONES = [10, 30, 60, 100] as const;

export function typingTier(n: number): number {
  if (n <= 0) return 0;
  if (n <= 10) return 1;
  if (n <= 30) return 2;
  if (n <= 60) return 3;
  if (n <= 100) return 4;
  return 5;
}

export function typingTierHint(n: number): string {
  if (n <= 0) return '慢慢講 · 一個字都得';
  if (n <= 10) return '開始啦 · 精靈望住你';
  if (n <= 30) return '講多咗少少 · 好好';
  if (n <= 60) return '傾得幾深 · 彩虹嚟緊';
  if (n <= 100) return '火花閃緊 · 你好叻';
  return '深度傾訴 · 精靈記住咗';
}

function nextMilestone(n: number): number | null {
  for (const m of MILESTONES) {
    if (n < m) return m;
  }
  return null;
}

type BowlProps = {
  charCount: number;
  emotion?: Emotion | null;
  size?: number;
  emptyLabel?: string;
};

/**
 * 「打字換彩虹」· richer bowl overlays to reward writing.
 */
export function TypingRainbowBowl({
  charCount,
  emotion,
  size = 140,
  emptyLabel = '日記',
}: BowlProps) {
  const tier = typingTier(charCount);
  const prevTier = useRef(tier);

  const pulse = useRef(new Animated.Value(1)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const celebrate = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Soft idle / writing pulse
  useEffect(() => {
    const to = tier === 0 ? 1.04 : 1.02;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: to,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tier, pulse]);

  // Glow follows writing depth
  useEffect(() => {
    Animated.timing(glow, {
      toValue: Math.min(1, charCount / 100),
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [charCount, glow]);

  // Tier-up celebration
  useEffect(() => {
    if (tier > prevTier.current && tier > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      celebrate.setValue(0);
      Animated.sequence([
        Animated.timing(celebrate, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(celebrate, {
          toValue: 0,
          duration: 500,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevTier.current = tier;
  }, [tier, celebrate]);

  useEffect(() => {
    if (tier < 3) {
      ringSpin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: tier >= 5 ? 2800 : 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    ringSpin.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [tier, ringSpin]);

  useEffect(() => {
    if (tier < 4) {
      sparkle.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0.2, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tier, sparkle]);

  useEffect(() => {
    if (tier < 5) {
      badgePop.setValue(0);
      return;
    }
    Animated.spring(badgePop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [tier, badgePop]);

  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const washColors = useMemo((): [string, string, ...string[]] => {
    if (tier <= 1) return ['transparent', 'transparent'];
    if (tier === 2) return ['rgba(255,183,197,0.15)', 'rgba(255,214,165,0.35)'];
    if (tier === 3) return ['rgba(167,243,208,0.2)', 'rgba(147,197,253,0.4)', 'rgba(244,114,182,0.25)'];
    if (tier === 4) return ['rgba(253,224,71,0.25)', 'rgba(244,114,182,0.35)', 'rgba(96,165,250,0.3)'];
    return ['rgba(253,224,71,0.35)', 'rgba(244,114,182,0.45)', 'rgba(167,139,250,0.35)'];
  }, [tier]);

  const auraOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const celebrateScale = celebrate.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.15],
  });

  const dots = Math.min(5, Math.max(0, Math.ceil(charCount / 8)));

  return (
    <View style={[styles.wrap, { width: size + 48, height: size + 56 }]} testID="typing-rainbow-bowl">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.aura,
          {
            width: size + 28,
            height: size + 28,
            borderRadius: (size + 28) / 2,
            opacity: auraOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#F9A8D4', '#FDE68A', '#93C5FD', '#6EE7B7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {tier >= 3 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: size + 22,
              height: size + 22,
              borderRadius: (size + 22) / 2,
              transform: [{ rotate: ringRotate }],
            },
          ]}
        />
      ) : null}

      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={[styles.bowlClip, { width: size, height: size, borderRadius: RADIUS.lg }]}>
          {emotion ? (
            <EmotionVisual emotion={emotion} size={size} radius={RADIUS.lg} />
          ) : (
            <View
              style={[styles.emptyBowl, { width: size, height: size }]}
              accessibilityLabel={emptyLabel}
            />
          )}
          {tier >= 2 ? (
            <LinearGradient
              pointerEvents="none"
              colors={washColors}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.gradientWash}
            />
          ) : null}
        </View>
      </Animated.View>

      {tier >= 1 ? (
        <View style={styles.dotRow}>
          {Array.from({ length: dots }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: [
                    '#F472B6',
                    '#FBBF24',
                    '#34D399',
                    '#60A5FA',
                    '#A78BFA',
                  ][i % 5],
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {tier >= 4 ? (
        <>
          <Animated.Text style={[styles.sparkle, styles.s1, { opacity: sparkle }]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.s2, { opacity: sparkle }]}>🌈</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.s3, { opacity: sparkle }]}>✨</Animated.Text>
          {tier >= 5 ? (
            <Animated.Text style={[styles.sparkle, styles.s4, { opacity: sparkle }]}>💫</Animated.Text>
          ) : null}
        </>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.celebrateBurst,
          {
            opacity: celebrate,
            transform: [{ scale: celebrateScale }],
          },
        ]}
      >
        <Text style={styles.celebrateEmoji}>
          {tier === 1 ? '🌱' : tier === 2 ? '🌤️' : tier === 3 ? '🌈' : tier === 4 ? '✨' : '🏆'}
        </Text>
      </Animated.View>

      {tier >= 5 ? (
        <Animated.View
          style={[
            styles.badge,
            { opacity: badgePop, transform: [{ scale: badgePop }] },
          ]}
        >
          <Text style={styles.badgeText}>深度傾訴</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

type ProgressProps = {
  charCount: number;
  testID?: string;
};

/**
 * Milestone meter under the diary field · nudges kids to write more.
 */
export function TypingRainbowProgress({ charCount, testID }: ProgressProps) {
  const hint = typingTierHint(charCount);
  const next = nextMilestone(charCount);
  const tier = typingTier(charCount);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const fillRatio = useMemo(() => {
    if (charCount <= 0) return 0;
    if (!next) return 1;
    const prev = [...MILESTONES].reverse().find((m) => m <= charCount) ?? 0;
    return Math.min(1, (charCount - prev) / (next - prev));
  }, [charCount, next]);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillRatio,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fillRatio, fillAnim]);

  const widthInterp = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressCard} testID={testID}>
      <View style={styles.progressTop}>
        <Text style={styles.progressCount}>🌈 已寫 {charCount} 字</Text>
        <Text style={styles.progressHint}>{hint}</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.trackFillWrap, { width: widthInterp }]}>
          <LinearGradient
            colors={['#F9A8D4', '#FDE68A', '#93C5FD', '#6EE7B7']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.trackFill}
          />
        </Animated.View>
      </View>

      <View style={styles.milestones}>
        {MILESTONES.map((m) => {
          const reached = charCount >= m;
          return (
            <View key={m} style={[styles.chip, reached && styles.chipOn]}>
              <Text style={[styles.chipText, reached && styles.chipTextOn]}>
                {reached ? '✓ ' : ''}
                {m}
              </Text>
            </View>
          );
        })}
      </View>

      {next ? (
        <Text style={styles.nextLine}>
          再寫 {next - charCount} 字 · 解鎖下一層彩虹
          {tier >= 2 ? ' ✨' : ''}
        </Text>
      ) : (
        <Text style={styles.nextLine}>你已經傾得好深 · 精靈好開心</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    overflow: 'hidden',
  },
  bowlClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBowl: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  gradientWash: {
    ...StyleSheet.absoluteFillObject,
  },
  dotRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3.5,
    borderColor: 'transparent',
    borderTopColor: '#F472B6',
    borderRightColor: '#60A5FA',
    borderBottomColor: '#FBBF24',
    borderLeftColor: '#34D399',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  s1: { top: 2, right: 8 },
  s2: { top: 24, left: 2 },
  s3: { bottom: 28, right: 2 },
  s4: { top: 10, left: 18 },
  celebrateBurst: {
    position: 'absolute',
    top: '28%',
  },
  celebrateEmoji: { fontSize: 42 },
  badge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  progressCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  progressTop: { marginBottom: SPACING.sm },
  progressCount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  progressHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bgInput,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  trackFillWrap: { height: '100%' },
  trackFill: { flex: 1, borderRadius: 999 },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  chipOn: {
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextOn: {
    color: COLORS.textPrimary,
  },
  nextLine: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
