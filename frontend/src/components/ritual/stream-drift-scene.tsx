import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Path, Rect, Svg } from 'react-native-svg';

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
 * Stream ending: fold the bowl / diary page into a paper boat,
 * set it on the creek, then let the current carry it away.
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

  const craftX = progress.interpolate({
    inputRange: [0, 0.42, 0.5, 1],
    outputRange: [86, 78, 70, 248],
    extrapolate: 'clamp',
  });
  const craftY = progress.interpolate({
    inputRange: [0, 0.36, 0.5, 0.72, 1],
    outputRange: [-78, -70, 8, 2, 6],
    extrapolate: 'clamp',
  });
  const bob = progress.interpolate({
    inputRange: [0.5, 0.62, 0.74, 0.86, 1],
    outputRange: [0, 5, -4, 5, 0],
    extrapolate: 'clamp',
  });
  const craftOpacity = progress.interpolate({
    inputRange: [0, 0.04, 0.78, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const craftScale = progress.interpolate({
    inputRange: [0, 0.1, 0.42, 0.7, 1],
    outputRange: [0.92, 1, 1, 0.9, 0.6],
    extrapolate: 'clamp',
  });

  const subjectOpacity = progress.interpolate({
    inputRange: [0, 0.1, 0.22],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const pageOpacity = progress.interpolate({
    inputRange: [0.04, 0.12, 0.22, 0.3],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const hatOpacity = progress.interpolate({
    inputRange: [0.22, 0.3, 0.36, 0.44],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const boatOpacity = progress.interpolate({
    inputRange: [0.36, 0.44, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  const pageFold = progress.interpolate({
    inputRange: [0.12, 0.3],
    outputRange: [1, 0.62],
    extrapolate: 'clamp',
  });
  const creaseOpacity = progress.interpolate({
    inputRange: [0.14, 0.22, 0.32],
    outputRange: [0, 1, 0],
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

  const subject = emotion ? (
    <BowlWithDecor emotion={emotion} size={88} radius={RADIUS.md} decorations={decorations} />
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
            style={[styles.leaf, { transform: [{ translateX: leafX }, { translateY: bob }] }]}
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
          testID="stream-fold-craft"
          style={[
            styles.craftWrap,
            {
              opacity: craftOpacity,
              transform: [
                { translateX: craftX },
                { translateY: Animated.add(craftY, bob) },
                { scale: craftScale },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.layer, { opacity: subjectOpacity }]}>
            {subject}
          </Animated.View>

          <Animated.View
            style={[
              styles.layer,
              { opacity: pageOpacity, transform: [{ scaleY: pageFold }, { scaleX: pageFold }] },
            ]}
          >
            <Svg height={86} viewBox="0 0 120 86" width={120}>
              <Rect
                x="10"
                y="8"
                width="100"
                height="70"
                rx="5"
                fill="#FFFDF8"
                stroke="#E6D9C2"
                strokeWidth="1.6"
              />
              <Path d="M22 26 H98" stroke="#E4D4B8" strokeWidth="3" strokeLinecap="round" />
              <Path d="M22 40 H86" stroke="#E4D4B8" strokeWidth="3" strokeLinecap="round" />
              <Path d="M22 54 H74" stroke="#E4D4B8" strokeWidth="3" strokeLinecap="round" />
            </Svg>
            <Animated.View style={[styles.crease, { opacity: creaseOpacity }]} />
          </Animated.View>

          <Animated.View style={[styles.layer, { opacity: hatOpacity }]}>
            <Svg height={70} viewBox="0 0 120 70" width={120}>
              <Path d="M8 46 L60 10 L112 46 L96 60 L24 60 Z" fill="#F4E6C8" />
              <Path d="M24 46 L60 16 L96 46 Z" fill="#FBF3DE" />
              <Path d="M8 46 L60 10 L112 46" fill="none" stroke="#D7C39A" strokeWidth="1.5" />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.layer, { opacity: boatOpacity }]}>
            <Svg height={54} viewBox="0 0 120 44" width={120}>
              <Path d="M10 22 L60 38 L110 22 L86 22 L60 8 L34 22 Z" fill="#F4E6C8" />
              <Path d="M34 22 L60 8 L86 22 Z" fill="#E9D4A8" />
              <Path d="M18 22 L60 34 L102 22 L86 22 L60 14 L34 22 Z" fill="#FBF3DE" />
              <Path
                d="M10 22 L60 38 L110 22"
                fill="none"
                stroke="#D7C39A"
                strokeWidth={1.4}
              />
            </Svg>
          </Animated.View>
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
  craftWrap: {
    alignItems: 'center',
    bottom: 78,
    height: 120,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    width: 132,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crease: {
    backgroundColor: '#D7C39A',
    height: 64,
    left: '50%',
    marginLeft: -1,
    position: 'absolute',
    top: 14,
    width: 2,
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
