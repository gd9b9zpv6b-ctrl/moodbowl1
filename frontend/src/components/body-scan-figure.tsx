import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BODY_CHIPS,
  type BodyChipKey,
  type BodyRegionKey,
} from '@/src/constants/body-chips';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const BUDDY = require('../../assets/mascots/body-scan-buddy.png');

type Props = {
  selected: BodyChipKey[];
  focusRegion: BodyRegionKey | null;
  onSelectRegion: (region: BodyRegionKey) => void;
  idlePrompt: string;
};

/** Silly floating gags that appear on 碗仔 for selected chips. */
const CHIP_GAGS: Partial<
  Record<
    BodyChipKey,
    { emoji: string; spot: 'head' | 'face' | 'chest' | 'belly' | 'leftHand' | 'rightHand' | 'feet' | 'aura' }
  >
> = {
  face_flush: { emoji: '♨️', spot: 'face' },
  jaw_clench: { emoji: '😬', spot: 'face' },
  teary: { emoji: '💧', spot: 'face' },
  eyelids_heavy: { emoji: '💤', spot: 'head' },
  eyes_bright: { emoji: '✨', spot: 'face' },
  head_heavy: { emoji: '🪨', spot: 'head' },
  brain_blank: { emoji: '🌫️', spot: 'head' },
  chest_warm: { emoji: '🌟', spot: 'chest' },
  chest_tight: { emoji: '🧱', spot: 'chest' },
  heart_fast: { emoji: '🐇', spot: 'chest' },
  breath_fast: { emoji: '💨', spot: 'chest' },
  heat_rising: { emoji: '🔥', spot: 'chest' },
  throat_tight: { emoji: '🪨', spot: 'belly' },
  belly_full: { emoji: '🦋', spot: 'belly' },
  no_appetite: { emoji: '🚫', spot: 'belly' },
  need_toilet: { emoji: '💨', spot: 'belly' },
  fists_clench: { emoji: '✊', spot: 'leftHand' },
  sweaty_palms: { emoji: '💦', spot: 'rightHand' },
  shaky: { emoji: '🫨', spot: 'leftHand' },
  soft_hands: { emoji: '🍜', spot: 'rightHand' },
  shoulders_heavy: { emoji: '📚', spot: 'aura' },
  body_tense: { emoji: '🏹', spot: 'aura' },
  want_jump: { emoji: '🦶', spot: 'feet' },
  smile_wide: { emoji: '😄', spot: 'face' },
  curled_up: { emoji: '🐚', spot: 'aura' },
  floaty: { emoji: '🪶', spot: 'aura' },
};

/** Percentage layout over the 碗仔 PNG (tuned to mascot proportions). */
const SPOT_STYLE: Record<string, object> = {
  head: { top: '6%', alignSelf: 'center' },
  face: { top: '38%', alignSelf: 'center' },
  chest: { top: '42%', alignSelf: 'center' },
  belly: { top: '58%', alignSelf: 'center' },
  leftHand: { top: '48%', left: '2%' },
  rightHand: { top: '48%', right: '2%' },
  feet: { bottom: '4%', alignSelf: 'center' },
  aura: { top: '28%', right: '4%' },
};

const REGION_COLORS: Record<BodyRegionKey, string> = {
  head: '#F4D0C9',
  chest: '#A3C4BC',
  belly: '#FFE6A7',
  hands: '#D1E2DE',
  whole: '#E8D5C4',
};

const REGION_SHORT: Record<BodyRegionKey, string> = {
  head: '頭',
  chest: '心',
  belly: '肚',
  hands: '手',
  whole: '腳',
};

/** Invisible hit targets over the mascot · % of FIGURE size. */
const HOTSPOTS: {
  region: BodyRegionKey;
  top: `${number}%`;
  left: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
}[] = [
  { region: 'head', top: '8%', left: '28%', width: '44%', height: '22%' },
  { region: 'chest', top: '30%', left: '28%', width: '44%', height: '22%' },
  { region: 'belly', top: '52%', left: '28%', width: '44%', height: '18%' },
  { region: 'hands', top: '40%', left: '4%', width: '22%', height: '28%' },
  { region: 'hands', top: '40%', left: '74%', width: '22%', height: '28%' },
  { region: 'whole', top: '72%', left: '30%', width: '40%', height: '22%' },
];

function FloatingGag({ emoji, delay }: { emoji: string; delay: number }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 700 + delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 700 + delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, delay]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });

  return (
    <Animated.Text style={[styles.gag, { transform: [{ translateY }, { rotate }] }]}>
      {emoji}
    </Animated.Text>
  );
}

/**
 * MoodBowl 碗仔 · pokeable rice-bowl buddy for somatic body scan.
 */
export function BodyScanFigure({
  selected,
  focusRegion,
  onSelectRegion,
  idlePrompt,
}: Props) {
  const wiggle = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  const wantsJump = selected.includes('want_jump');
  const isTense = selected.includes('body_tense') || selected.includes('fists_clench');
  const isCurled = selected.includes('curled_up');
  const isFloaty = selected.includes('floaty');
  const isFlush = selected.includes('face_flush');

  useEffect(() => {
    if (wantsJump) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    bounce.setValue(0);
  }, [wantsJump, bounce]);

  useEffect(() => {
    if (isTense) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: -1, duration: 90, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    wiggle.setValue(0);
  }, [isTense, wiggle]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const gags = selected
    .map((key) => ({ key, gag: CHIP_GAGS[key] }))
    .filter(
      (x): x is { key: BodyChipKey; gag: NonNullable<(typeof CHIP_GAGS)[BodyChipKey]> } =>
        !!x.gag,
    );

  const regionLit = (region: BodyRegionKey) =>
    focusRegion === region ||
    selected.some((k) => BODY_CHIPS.find((c) => c.key === k)?.region === region);

  const figureScale = isCurled ? 0.86 : isFloaty ? 1.05 : 1;
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
  });

  return (
    <View style={styles.wrap} testID="body-scan-figure">
      <View style={styles.speech}>
        <Text style={styles.speechName}>碗仔話</Text>
        <Text style={styles.speechText}>{idlePrompt}</Text>
      </View>

      <Animated.View
        style={[
          styles.stage,
          {
            transform: [{ translateY }, { rotate }, { scale: figureScale }],
          },
        ]}
      >
        <View style={styles.stageGlow} />
        <Image
          source={BUDDY}
          style={styles.buddy}
          contentFit="contain"
          accessibilityLabel="MoodBowl 碗仔"
        />

        {/* Soft blush overlay when 面紅 */}
        {isFlush && (
          <>
            <View style={[styles.blush, styles.blushL]} />
            <View style={[styles.blush, styles.blushR]} />
          </>
        )}

        {/* Region hotspot highlights */}
        {HOTSPOTS.map((hs, i) => {
          const active = focusRegion === hs.region;
          const lit = regionLit(hs.region);
          if (!active && !lit) return null;
          return (
            <Animated.View
              key={`glow-${hs.region}-${i}`}
              pointerEvents="none"
              style={[
                styles.hotGlow,
                {
                  top: hs.top,
                  left: hs.left,
                  width: hs.width,
                  height: hs.height,
                  borderColor: REGION_COLORS[hs.region],
                  backgroundColor: REGION_COLORS[hs.region],
                  opacity: active ? glow : 0.22,
                },
              ]}
            />
          );
        })}

        {/* Poke targets */}
        {HOTSPOTS.map((hs, i) => (
          <Pressable
            key={`hit-${hs.region}-${i}`}
            testID={`body-hotspot-${hs.region}${i > 0 && hs.region === 'hands' ? '-r' : ''}`}
            onPress={() => onSelectRegion(hs.region)}
            style={[
              styles.hotspot,
              {
                top: hs.top,
                left: hs.left,
                width: hs.width,
                height: hs.height,
              },
            ]}
            accessibilityLabel={`戳${REGION_SHORT[hs.region]}`}
          />
        ))}

        {/* Floating gags */}
        {gags.map(({ key, gag }, i) => (
          <View key={key} pointerEvents="none" style={[styles.gagSlot, SPOT_STYLE[gag.spot]]}>
            <FloatingGag emoji={gag.emoji} delay={i * 120} />
          </View>
        ))}
      </Animated.View>

      <Text style={styles.pokeHint}>戳戳碗仔 · 邊度有感覺?</Text>

      <View style={styles.regionRow}>
        {(['head', 'chest', 'belly', 'hands', 'whole'] as BodyRegionKey[]).map((r) => (
          <Pressable
            key={r}
            testID={`body-region-tab-${r}`}
            onPress={() => onSelectRegion(r)}
            style={[
              styles.regionTab,
              { borderColor: REGION_COLORS[r] },
              focusRegion === r && { backgroundColor: REGION_COLORS[r] },
            ]}
          >
            <Text style={styles.regionTabText}>{REGION_SHORT[r]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const FIGURE = 260;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  speech: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: '#F0D78C',
    maxWidth: 300,
  },
  speechName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C4A035',
    marginBottom: 2,
    textAlign: 'center',
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stage: {
    width: FIGURE,
    height: FIGURE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  stageGlow: {
    position: 'absolute',
    width: FIGURE * 0.72,
    height: FIGURE * 0.72,
    borderRadius: FIGURE,
    backgroundColor: '#FFF6D6',
    opacity: 0.55,
  },
  buddy: {
    width: FIGURE,
    height: FIGURE,
    zIndex: 1,
  },
  blush: {
    position: 'absolute',
    width: 28,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#F4A09A',
    opacity: 0.55,
    top: '44%',
    zIndex: 2,
  },
  blushL: { left: '28%' },
  blushR: { right: '28%' },
  hotspot: {
    position: 'absolute',
    zIndex: 4,
  },
  hotGlow: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 2,
    zIndex: 2,
  },
  gagSlot: {
    position: 'absolute',
    zIndex: 5,
  },
  gag: {
    fontSize: 26,
  },
  pokeHint: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  regionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionTab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
  },
  regionTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
