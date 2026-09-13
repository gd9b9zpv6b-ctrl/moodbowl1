import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';

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

/** Winding creek through the meadow · same path for water, sand, and current. */
const RIVER =
  'M-24 248 C46 214 86 276 148 246 C208 218 248 278 344 236';

function CreekBackdrop({ flow }: { flow: Animated.AnimatedInterpolation<number> }) {
  const currentA = flow.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 80],
  });
  const currentB = flow.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 110],
  });
  const sparkle = flow.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0.2, 0.55, 0.25, 0.5],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 320 360" width="100%">
        <Defs>
          <LinearGradient id="creekSky" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#A9D8F0" />
            <Stop offset="0.55" stopColor="#D4EDE0" />
            <Stop offset="1" stopColor="#8FBF73" />
          </LinearGradient>
          <LinearGradient id="creekWater" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#9FDBEE" />
            <Stop offset="0.4" stopColor="#5BB4CE" />
            <Stop offset="1" stopColor="#2F87A6" />
          </LinearGradient>
        </Defs>

        <Rect fill="url(#creekSky)" height="360" width="320" />
        <Circle cx="262" cy="54" fill="#F8E7A6" opacity="0.95" r="20" />
        <Circle cx="262" cy="54" fill="#FFF6C8" opacity="0.35" r="32" />

        <Ellipse cx="78" cy="46" fill="#FFFFFF" opacity="0.55" rx="34" ry="12" />
        <Ellipse cx="108" cy="42" fill="#FFFFFF" opacity="0.4" rx="22" ry="9" />
        <Ellipse cx="196" cy="36" fill="#FFFFFF" opacity="0.45" rx="28" ry="10" />

        <Path d="M-20 168 C70 128 130 176 210 142 C260 122 300 150 340 136 L340 220 L-20 220 Z" fill="#8FB89A" />
        <Path d="M-20 186 C90 154 160 198 340 168 L340 230 L-20 230 Z" fill="#6F9F7E" />

        <Path d="M0 176 C80 158 170 188 320 166 L320 360 L0 360 Z" fill="#8FBF73" />
        <Path d="M0 214 C90 196 180 228 320 206 L320 360 L0 360 Z" fill="#74A85C" />
        <Path d="M0 292 C120 274 200 310 320 288 L320 360 L0 360 Z" fill="#5E9148" />

        <Path
          d={RIVER}
          fill="none"
          stroke="#CDB892"
          strokeLinecap="round"
          strokeWidth="78"
        />
        <Path
          d={RIVER}
          fill="none"
          stroke="#E6D3A8"
          strokeLinecap="round"
          strokeWidth="66"
        />
        <Path
          d={RIVER}
          fill="none"
          stroke="url(#creekWater)"
          strokeLinecap="round"
          strokeWidth="52"
        />
        <Path
          d={RIVER}
          fill="none"
          opacity="0.28"
          stroke="#EAF8FF"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <Path
          d={RIVER}
          fill="none"
          opacity="0.22"
          stroke="#1F6F88"
          strokeLinecap="round"
          strokeWidth="16"
          strokeDasharray="10 18"
        />

        <Ellipse cx="38" cy="286" fill="#B7A58A" rx="16" ry="8" />
        <Ellipse cx="58" cy="292" fill="#C8B59A" rx="10" ry="6" />
        <Ellipse cx="92" cy="304" fill="#A99478" rx="14" ry="7" />
        <Ellipse cx="246" cy="298" fill="#C2B093" rx="15" ry="7" />
        <Ellipse cx="272" cy="308" fill="#B39E82" rx="11" ry="6" />
        <Ellipse cx="168" cy="218" fill="#C9B89A" opacity="0.85" rx="9" ry="5" />

        <Path d="M28 262 L31 214" stroke="#4F7A48" strokeLinecap="round" strokeWidth="3" />
        <Ellipse cx="31" cy="210" fill="#3F6238" rx="7" ry="11" />
        <Path d="M42 266 L46 222" stroke="#4F7A48" strokeLinecap="round" strokeWidth="3" />
        <Ellipse cx="46" cy="218" fill="#466C3E" rx="6" ry="10" />
        <Path d="M268 254 L272 206" stroke="#4F7A48" strokeLinecap="round" strokeWidth="3" />
        <Ellipse cx="272" cy="202" fill="#3F6238" rx="7" ry="11" />
        <Path d="M284 258 L289 214" stroke="#4F7A48" strokeLinecap="round" strokeWidth="3" />
        <Ellipse cx="289" cy="210" fill="#466C3E" rx="6" ry="10" />

        <Path d="M18 318 C28 300 40 300 48 318 Z" fill="#4F8A3E" />
        <Path d="M70 328 C80 310 94 310 102 328 Z" fill="#457C36" />
        <Path d="M210 322 C220 304 234 304 242 322 Z" fill="#4F8A3E" />
        <Path d="M286 332 C296 314 310 314 318 332 Z" fill="#3F7030" />
      </Svg>

      <Animated.View
        style={[
          styles.currentLayer,
          { opacity: sparkle, transform: [{ translateX: currentA }] },
        ]}
      >
        <View style={[styles.glint, { left: 36, top: 18 }]} />
        <View style={[styles.glint, styles.glintLong, { left: 110, top: 42 }]} />
        <View style={[styles.glint, { left: 188, top: 8 }]} />
      </Animated.View>
      <Animated.View
        style={[
          styles.currentLayer,
          { opacity: 0.35, transform: [{ translateX: currentB }] },
        ]}
      >
        <View style={[styles.glint, styles.glintSoft, { left: 70, top: 30 }]} />
        <View style={[styles.glint, styles.glintLong, { left: 150, top: 16 }]} />
        <View style={[styles.glint, styles.glintSoft, { left: 230, top: 38 }]} />
      </Animated.View>
    </View>
  );
}

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
    inputRange: [0, 0.42, 0.52, 0.72, 1],
    outputRange: [78, 70, 64, 150, 248],
    extrapolate: 'clamp',
  });
  const craftY = progress.interpolate({
    inputRange: [0, 0.36, 0.5, 0.64, 0.8, 1],
    outputRange: [-92, -84, 10, 22, 4, 14],
    extrapolate: 'clamp',
  });
  const bob = progress.interpolate({
    inputRange: [0.5, 0.62, 0.74, 0.86, 1],
    outputRange: [0, 6, -5, 6, 0],
    extrapolate: 'clamp',
  });
  const craftOpacity = progress.interpolate({
    inputRange: [0, 0.04, 0.78, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const craftScale = progress.interpolate({
    inputRange: [0, 0.1, 0.42, 0.7, 1],
    outputRange: [0.92, 1, 1, 0.88, 0.58],
    extrapolate: 'clamp',
  });
  const craftTilt = progress.interpolate({
    inputRange: [0.5, 0.64, 0.8, 1],
    outputRange: ['0deg', '-8deg', '6deg', '-4deg'],
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
        <CreekBackdrop flow={progress} />

        <Animated.View
          testID="stream-fold-craft"
          style={[
            styles.craftWrap,
            {
              opacity: craftOpacity,
              transform: [
                { translateX: craftX },
                { translateY: Animated.add(craftY, bob) },
                { rotate: craftTilt },
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
              <Path d="M22 26 H98" stroke="#E4D4B8" strokeLinecap="round" strokeWidth="3" />
              <Path d="M22 40 H86" stroke="#E4D4B8" strokeLinecap="round" strokeWidth="3" />
              <Path d="M22 54 H74" stroke="#E4D4B8" strokeLinecap="round" strokeWidth="3" />
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
              <Path d="M10 22 L60 38 L110 22" fill="none" stroke="#D7C39A" strokeWidth={1.4} />
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
    backgroundColor: '#D7EBDF',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
    width: '100%',
  },
  stage: {
    backgroundColor: '#A9D8F0',
    borderRadius: RADIUS.md,
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  currentLayer: {
    height: 90,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 206,
  },
  glint: {
    backgroundColor: '#F4FCFF',
    borderRadius: RADIUS.pill,
    height: 5,
    position: 'absolute',
    width: 28,
  },
  glintLong: {
    height: 6,
    width: 46,
  },
  glintSoft: {
    backgroundColor: '#D7F3FA',
    width: 34,
  },
  craftWrap: {
    alignItems: 'center',
    bottom: 86,
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
