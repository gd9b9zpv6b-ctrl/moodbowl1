import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import type { PlacedDecoration } from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import {
  WASH_DURATION_MS,
  washCaptionForProgress,
} from '@/src/lib/ritual/wash-shower';

type Props = {
  emotion?: Emotion | null;
  decorations?: PlacedDecoration[];
  diaryMode?: boolean;
  onDone?: () => void;
};

/**
 * Wash ending: wipe the stage clean, bowl walks into a shower room,
 * rinses, then comes back out sparkling.
 */
export function WashShowerScene({
  emotion,
  decorations = [],
  diaryMode,
  onDone,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [line, setLine] = useState(washCaptionForProgress(0, !!diaryMode));

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    setLine(washCaptionForProgress(0, !!diaryMode));
    const id = progress.addListener(({ value }) => {
      setLine(washCaptionForProgress(value, !!diaryMode));
    });
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: WASH_DURATION_MS,
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
    const fallback = setTimeout(finish, WASH_DURATION_MS + 400);
    return () => {
      progress.removeListener(id);
      anim.stop();
      clearTimeout(fallback);
    };
  }, [diaryMode, onDone, progress]);

  const wipeX = progress.interpolate({
    inputRange: [0, 0.16],
    outputRange: [0, 920],
    extrapolate: 'clamp',
  });
  const roomOpacity = progress.interpolate({
    inputRange: [0, 0.08, 0.18],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });
  const bowlX = progress.interpolate({
    inputRange: [0, 0.16, 0.4, 0.72, 0.9, 1],
    outputRange: [0, 0, 78, 78, 0, 0],
    extrapolate: 'clamp',
  });
  const bowlY = progress.interpolate({
    inputRange: [0, 0.42, 0.5, 0.58, 0.66, 0.74, 1],
    outputRange: [8, 18, 12, 18, 12, 8, 4],
    extrapolate: 'clamp',
  });
  const bowlScale = progress.interpolate({
    inputRange: [0, 0.28, 0.4, 0.74, 0.9],
    outputRange: [1, 1, 0.78, 0.78, 1],
    extrapolate: 'clamp',
  });
  const dirtOpacity = progress.interpolate({
    inputRange: [0.38, 0.7],
    outputRange: [0.38, 0],
    extrapolate: 'clamp',
  });
  const waterOpacity = progress.interpolate({
    inputRange: [0.4, 0.46, 0.68, 0.74],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const steamOpacity = progress.interpolate({
    inputRange: [0.42, 0.5, 0.7, 0.8],
    outputRange: [0, 0.55, 0.45, 0],
    extrapolate: 'clamp',
  });
  const sparkleOpacity = progress.interpolate({
    inputRange: [0.78, 0.88, 1],
    outputRange: [0, 1, 0.7],
    extrapolate: 'clamp',
  });
  const curtainShift = progress.interpolate({
    inputRange: [0.32, 0.42, 0.72, 0.82],
    outputRange: [0, 22, 22, 0],
    extrapolate: 'clamp',
  });
  const dropY = progress.interpolate({
    inputRange: [0.42, 0.72],
    outputRange: [0, 78],
    extrapolate: 'clamp',
  });

  const subject = emotion ? (
    <BowlWithDecor emotion={emotion} size={108} radius={RADIUS.md} decorations={decorations} />
  ) : (
    <View style={styles.diaryCard}>
      <Text style={styles.diaryEmoji}>{diaryMode ? '📔' : '🥣'}</Text>
    </View>
  );

  return (
    <View testID="wash-shower-scene" style={styles.card}>
      <View style={styles.stage}>
        <Animated.View style={[styles.room, { opacity: roomOpacity }]}>
          <View style={styles.wall} />
          <View style={styles.floor} />
          <View style={styles.stall}>
            <View style={styles.tileRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.tile} />
              ))}
            </View>
            <View style={styles.tileRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={`b-${i}`} style={[styles.tile, i % 2 === 0 && styles.tileAlt]} />
              ))}
            </View>
            <View style={styles.showerArm}>
              <Svg height={40} viewBox="0 0 56 40" width={56}>
                <Path
                  d="M8 6 H28 C28 6 28 14 40 14"
                  fill="none"
                  stroke="#8AA9A3"
                  strokeLinecap="round"
                  strokeWidth={3.2}
                />
                <Ellipse cx="44" cy="22" fill="#9BB8B2" rx="10" ry="7" />
                <Circle cx="40" cy="24" fill="#D7EBE6" r="1.4" />
                <Circle cx="44" cy="25" fill="#D7EBE6" r="1.4" />
                <Circle cx="48" cy="24" fill="#D7EBE6" r="1.4" />
              </Svg>
            </View>
            <Animated.View style={[styles.water, { opacity: waterOpacity }]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.drop,
                    {
                      left: 10 + i * 9,
                      top: (i % 3) * 12,
                      transform: [{ translateY: dropY }],
                    },
                  ]}
                />
              ))}
            </Animated.View>
            <Animated.View style={[styles.steam, { opacity: steamOpacity }]}>
              <View style={[styles.wisp, { left: 8 }]} />
              <View style={[styles.wisp, styles.wispMid]} />
              <View style={[styles.wisp, { right: 6, top: 10 }]} />
            </Animated.View>
            <Animated.View
              style={[styles.curtain, { transform: [{ translateX: curtainShift }] }]}
            />
          </View>
          <View style={styles.door}>
            <View style={styles.doorPanel} />
            <View style={styles.doorKnob} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.bowlWrap,
            {
              transform: [{ translateX: bowlX }, { translateY: bowlY }, { scale: bowlScale }],
            },
          ]}
        >
          {subject}
          <Animated.View pointerEvents="none" style={[styles.dirt, { opacity: dirtOpacity }]} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.sparkles, { opacity: sparkleOpacity }]}>
          <View style={[styles.spark, { left: 48, top: 36 }]} />
          <View style={[styles.spark, styles.sparkBig, { right: 64, top: 58 }]} />
          <View style={[styles.spark, { left: 92, bottom: 88 }]} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.wipe, { transform: [{ translateX: wipeX }] }]}
        />
      </View>
      <Text style={styles.caption}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E7F3F0',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
    width: '100%',
  },
  stage: {
    backgroundColor: '#F4FAF8',
    borderRadius: RADIUS.md,
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  room: {
    ...StyleSheet.absoluteFillObject,
  },
  wall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E4F1EE',
  },
  floor: {
    backgroundColor: '#E8DDD0',
    bottom: 0,
    height: '22%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  stall: {
    backgroundColor: '#D3E7E2',
    borderColor: '#B7D0CA',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    bottom: '18%',
    height: '62%',
    overflow: 'hidden',
    position: 'absolute',
    right: '8%',
    width: '42%',
  },
  tileRow: {
    flexDirection: 'row',
    opacity: 0.45,
  },
  tile: {
    backgroundColor: '#F7FBFA',
    borderColor: '#C5DDD8',
    borderWidth: 1,
    height: 28,
    width: '25%',
  },
  tileAlt: { backgroundColor: '#EAF6F3' },
  showerArm: {
    position: 'absolute',
    right: 10,
    top: 8,
  },
  water: {
    height: 120,
    position: 'absolute',
    right: 14,
    top: 46,
    width: 58,
  },
  drop: {
    backgroundColor: '#74BDE0',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 6,
    height: 16,
    opacity: 0.75,
    position: 'absolute',
    top: 0,
    width: 5,
  },
  steam: {
    height: 70,
    position: 'absolute',
    right: 8,
    top: 70,
    width: 70,
  },
  wisp: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.pill,
    height: 18,
    position: 'absolute',
    top: 4,
    width: 28,
  },
  wispMid: {
    height: 22,
    left: 18,
    top: 22,
    width: 34,
  },
  curtain: {
    backgroundColor: '#F7FBFAEE',
    borderLeftColor: '#C5DDD8',
    borderLeftWidth: 2,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '38%',
  },
  door: {
    bottom: '18%',
    height: '58%',
    position: 'absolute',
    right: '46%',
    width: 18,
  },
  doorPanel: {
    backgroundColor: '#D7C4AE',
    borderColor: '#C4AE95',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
  },
  doorKnob: {
    backgroundColor: '#E8D9A8',
    borderRadius: RADIUS.pill,
    height: 8,
    position: 'absolute',
    right: 4,
    top: '48%',
    width: 8,
  },
  bowlWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: '18%',
    position: 'absolute',
    top: '28%',
  },
  dirt: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C4B8A866',
    borderRadius: RADIUS.md,
  },
  sparkles: {
    ...StyleSheet.absoluteFillObject,
  },
  spark: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  sparkBig: {
    height: 12,
    width: 12,
  },
  wipe: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgMain,
  },
  diaryCard: {
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 108,
    justifyContent: 'center',
    width: 108,
  },
  diaryEmoji: { fontSize: 42 },
  caption: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    textAlign: 'center',
  },
});
