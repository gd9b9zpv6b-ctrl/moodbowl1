import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import type { PlacedDecoration } from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import {
  STREAM_DURATION_MS,
  streamCaptionForProgress,
} from '@/src/lib/ritual/stream-drift';

type Props = {
  emotion?: Emotion | null;
  decorations?: PlacedDecoration[];
  diaryMode?: boolean;
  onDone?: () => void;
};

/**
 * Stream ending: set the bowl (or a folded paper boat) on a creek
 * and let the current carry it out of sight.
 */
export function StreamDriftScene({
  emotion,
  decorations = [],
  diaryMode,
  onDone,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [line, setLine] = useState(streamCaptionForProgress(0, !!diaryMode));

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    setLine(streamCaptionForProgress(0, !!diaryMode));
    const id = progress.addListener(({ value }) => {
      setLine(streamCaptionForProgress(value, !!diaryMode));
    });
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STREAM_DURATION_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });
    let finishedOnce = false;
    const finish = () => {
      if (finishedOnce) return;
      finishedOnce = true;
      onDone?.();
    };
    anim.start(({ finished }) => {
      if (finished) finish();
    });
    return () => {
      progress.removeListener(id);
      anim.stop();
    };
  }, [diaryMode, onDone, progress]);

  const boatX = progress.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [18, 28, 248],
    extrapolate: 'clamp',
  });
  const boatY = progress.interpolate({
    inputRange: [0, 0.22, 0.48, 0.74, 1],
    outputRange: [8, -4, 6, -5, 2],
    extrapolate: 'clamp',
  });
  const boatBob = progress.interpolate({
    inputRange: [0, 0.18, 0.36, 0.54, 0.72, 0.9, 1],
    outputRange: [0, 5, -4, 6, -3, 4, 0],
    extrapolate: 'clamp',
  });
  const boatOpacity = progress.interpolate({
    inputRange: [0, 0.08, 0.72, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const boatScale = progress.interpolate({
    inputRange: [0, 0.12, 0.7, 1],
    outputRange: [0.86, 1, 0.92, 0.62],
    extrapolate: 'clamp',
  });
  const rippleA = progress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0.15, 0.55, 0.2, 0.4],
    extrapolate: 'clamp',
  });
  const rippleB = progress.interpolate({
    inputRange: [0, 0.2, 0.55, 0.9],
    outputRange: [0.4, 0.15, 0.6, 0.2],
    extrapolate: 'clamp',
  });
  const rippleShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 36],
  });
  const leafX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 220],
  });

  const cargo = emotion ? (
    <BowlWithDecor emotion={emotion} size={92} radius={RADIUS.md} decorations={decorations} />
  ) : (
    <View style={styles.diaryCard}>
      <Text style={styles.diaryEmoji}>{diaryMode ? '📔' : '🥣'}</Text>
    </View>
  );

  return (
    <View testID="stream-drift-scene" style={styles.card}>
      <View style={styles.stage}>
        <View style={styles.sky} />
        <View style={styles.hillFar} />
        <View style={styles.hillNear} />

        <View style={styles.creek}>
          <View style={styles.water}>
            <Svg height="100%" width="100%" viewBox="0 0 320 150" preserveAspectRatio="none">
              <Path
                d="M0 40 C40 18 70 62 110 40 C150 18 180 64 220 38 C260 16 290 58 320 36 L320 150 L0 150 Z"
                fill="#7CB8C9"
              />
              <Path
                d="M0 58 C50 38 80 78 130 56 C180 34 210 80 260 54 C290 40 310 70 320 58 L320 150 L0 150 Z"
                fill="#6AADC2"
              />
            </Svg>
          </View>
          <Animated.View style={[styles.ripple, { opacity: rippleA, left: 36 }]} />
          <Animated.View
            style={[
              styles.ripple,
              styles.rippleWide,
              { opacity: rippleB, left: 118, transform: [{ translateX: rippleShift }] },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              { opacity: rippleA, left: 210, top: 28, transform: [{ translateX: rippleShift }] },
            ]}
          />
          <Animated.View
            style={[styles.leaf, { transform: [{ translateX: leafX }, { translateY: boatBob }] }]}
          />
        </View>

        <View style={styles.bankFar} />
        <View style={styles.bankNear} />
        <View style={styles.reedLeft} />
        <View style={styles.reedLeftHead} />
        <View style={styles.reedRight} />
        <View style={styles.reedRightHead} />
        <View style={styles.pebbleA} />
        <View style={styles.pebbleB} />

        <Animated.View
          style={[
            styles.boatWrap,
            {
              opacity: boatOpacity,
              transform: [
                { translateX: boatX },
                { translateY: Animated.add(boatY, boatBob) },
                { scale: boatScale },
              ],
            },
          ]}
        >
          <View style={styles.cargo}>{cargo}</View>
          <Svg height={54} viewBox="0 0 120 44" width={120} style={styles.boatSvg}>
            <Path d="M10 22 L60 38 L110 22 L86 22 L60 8 L34 22 Z" fill="#F4E6C8" />
            <Path d="M34 22 L60 8 L86 22 Z" fill="#E9D4A8" />
            <Path d="M18 22 L60 34 L102 22 L86 22 L60 14 L34 22 Z" fill="#FBF3DE" />
            <Path d="M10 22 L60 38 L110 22" fill="none" stroke="#D7C39A" strokeWidth={1.4} />
          </Svg>
        </Animated.View>
      </View>
      <Text style={styles.caption}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E4F1EA',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
    width: '100%',
  },
  stage: {
    backgroundColor: '#CDE6F2',
    borderRadius: RADIUS.md,
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CDE6F2',
  },
  hillFar: {
    backgroundColor: '#A7C9B4',
    borderRadius: 80,
    height: 90,
    left: -24,
    position: 'absolute',
    top: 78,
    width: '62%',
  },
  hillNear: {
    backgroundColor: '#8FB89F',
    borderRadius: 90,
    height: 80,
    position: 'absolute',
    right: -30,
    top: 96,
    width: '58%',
  },
  creek: {
    bottom: 42,
    height: 148,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  water: {
    ...StyleSheet.absoluteFillObject,
  },
  ripple: {
    backgroundColor: '#FFFFFF55',
    borderRadius: RADIUS.pill,
    height: 8,
    left: 40,
    position: 'absolute',
    top: 46,
    width: 54,
  },
  rippleWide: {
    height: 10,
    top: 72,
    width: 78,
  },
  leaf: {
    backgroundColor: '#7FA889',
    borderRadius: 8,
    height: 10,
    left: 0,
    position: 'absolute',
    top: 88,
    transform: [{ rotate: '24deg' }],
    width: 16,
  },
  bankFar: {
    backgroundColor: '#B7D4A8',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: 36,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 168,
  },
  bankNear: {
    backgroundColor: '#9FCA8C',
    bottom: 0,
    height: 52,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  reedLeft: {
    backgroundColor: '#5E8F62',
    borderRadius: RADIUS.pill,
    bottom: 46,
    height: 54,
    left: 22,
    position: 'absolute',
    width: 6,
  },
  reedLeftHead: {
    backgroundColor: '#4F7348',
    borderRadius: RADIUS.pill,
    bottom: 92,
    height: 16,
    left: 18,
    position: 'absolute',
    width: 14,
  },
  reedRight: {
    backgroundColor: '#5E8F62',
    borderRadius: RADIUS.pill,
    bottom: 50,
    height: 62,
    position: 'absolute',
    right: 28,
    width: 6,
  },
  reedRightHead: {
    backgroundColor: '#4F7348',
    borderRadius: RADIUS.pill,
    bottom: 104,
    height: 16,
    position: 'absolute',
    right: 24,
    width: 14,
  },
  pebbleA: {
    backgroundColor: '#C5B8A4',
    borderRadius: RADIUS.pill,
    bottom: 18,
    height: 14,
    left: 48,
    position: 'absolute',
    width: 22,
  },
  pebbleB: {
    backgroundColor: '#B7A894',
    borderRadius: RADIUS.pill,
    bottom: 16,
    height: 12,
    position: 'absolute',
    right: 64,
    width: 18,
  },
  boatWrap: {
    alignItems: 'center',
    bottom: 78,
    left: 0,
    position: 'absolute',
    width: 132,
  },
  boatSvg: {
    marginTop: -4,
  },
  cargo: {
    marginBottom: -22,
    zIndex: 2,
  },
  diaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderColor: '#E6D9C2',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  diaryEmoji: {
    fontSize: 28,
  },
  caption: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
