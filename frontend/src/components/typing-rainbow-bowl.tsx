import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export function typingTierHint(n: number): string {
  if (n <= 0) return '慢慢講 · 一個字都得';
  if (n <= 10) return '開始啦 · 繼續都可以';
  if (n <= 30) return '講多咗少少 · 好好';
  if (n <= 60) return '傾得幾深 · 精靈聽緊';
  if (n <= 100) return '火花閃緊 · 你好叻';
  return '深度傾訴 · 精靈記住咗';
}

type Props = {
  charCount: number;
  emotion?: Emotion | null;
  size?: number;
  emptyLabel?: string;
};

/**
 * 「打字換彩虹」· bowl overlays by character-count tiers.
 */
export function TypingRainbowBowl({
  charCount,
  emotion,
  size = 140,
  emptyLabel = '日記',
}: Props) {
  const tier =
    charCount <= 0 ? 0 : charCount <= 10 ? 1 : charCount <= 30 ? 2 : charCount <= 60 ? 3 : charCount <= 100 ? 4 : 5;

  const pulse = useRef(new Animated.Value(1)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tier === 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [tier, pulse]);

  useEffect(() => {
    if (tier < 3) {
      ringSpin.setValue(0);
      return;
    }
    ringSpin.setValue(0);
    const anim = Animated.timing(ringSpin, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [tier, ringSpin]);

  useEffect(() => {
    if (tier < 4) {
      sparkle.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0.25, duration: 700, useNativeDriver: true }),
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
    badgePop.setValue(0);
    Animated.spring(badgePop, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [tier, badgePop]);

  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const gradientTint = useMemo(() => {
    if (tier < 2) return 'transparent';
    if (tier === 2) return 'rgba(255, 183, 197, 0.28)';
    if (tier === 3) return 'rgba(186, 230, 253, 0.22)';
    return 'rgba(253, 224, 71, 0.18)';
  }, [tier]);

  return (
    <View style={[styles.wrap, { width: size + 36, height: size + 36 }]} testID="typing-rainbow-bowl">
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
            <View
              pointerEvents="none"
              style={[styles.gradientWash, { backgroundColor: gradientTint }]}
            />
          ) : null}
        </View>
      </Animated.View>

      {tier >= 1 ? <View style={[styles.dot, { backgroundColor: emotion?.color || COLORS.primary }]} /> : null}

      {tier >= 3 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: size + 18,
              height: size + 18,
              borderRadius: (size + 18) / 2,
              transform: [{ rotate: ringRotate }],
            },
          ]}
        />
      ) : null}

      {tier >= 4 ? (
        <>
          <Animated.Text style={[styles.sparkle, styles.s1, { opacity: sparkle }]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.s2, { opacity: sparkle }]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.s3, { opacity: sparkle }]}>💫</Animated.Text>
        </>
      ) : null}

      {tier >= 5 ? (
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: badgePop,
              transform: [{ scale: badgePop }],
            },
          ]}
        >
          <Text style={styles.badgeText}>深度傾訴</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
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
  dot: {
    position: 'absolute',
    bottom: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#F472B6',
    borderRightColor: '#60A5FA',
    borderBottomColor: '#FBBF24',
    borderLeftColor: '#34D399',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 18,
  },
  s1: { top: 6, right: 10 },
  s2: { top: 28, left: 4 },
  s3: { bottom: 22, right: 4 },
  badge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
