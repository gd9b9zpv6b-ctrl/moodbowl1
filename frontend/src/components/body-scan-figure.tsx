import { Image } from 'expo-image';
import { useEffect, useMemo, useRef } from 'react';
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
import {
  resolveWanjaiMood,
  type WanjaiMood,
} from '@/src/lib/ritual/wanjai-mood';

/** Blank tall 碗仔 · no face; decorations layer on top. */
const WANJAI_BASE = require('../../assets/mascots/wanjai-base.png');

type Props = {
  selected: BodyChipKey[];
  focusRegion: BodyRegionKey | null;
  onSelectRegion: (region: BodyRegionKey) => void;
  idlePrompt: string;
};

type Spot =
  | 'head'
  | 'face'
  | 'chest'
  | 'belly'
  | 'leftHand'
  | 'rightHand'
  | 'feet'
  | 'auraL'
  | 'auraR';

/** Decorations only · water / stars / steam / hearts — never facial features. */
const CHIP_DECOR: Partial<Record<BodyChipKey, { emoji: string; spot: Spot }>> = {
  face_flush: { emoji: '♨️', spot: 'face' },
  jaw_clench: { emoji: '💢', spot: 'face' },
  teary: { emoji: '💧', spot: 'face' },
  eyelids_heavy: { emoji: '💤', spot: 'head' },
  eyes_bright: { emoji: '✨', spot: 'head' },
  head_heavy: { emoji: '🪨', spot: 'head' },
  brain_blank: { emoji: '💭', spot: 'head' },
  chest_warm: { emoji: '🌟', spot: 'chest' },
  chest_tight: { emoji: '💢', spot: 'chest' },
  heart_fast: { emoji: '💓', spot: 'chest' },
  breath_fast: { emoji: '💨', spot: 'chest' },
  heat_rising: { emoji: '🔥', spot: 'auraL' },
  throat_tight: { emoji: '🫧', spot: 'belly' },
  belly_full: { emoji: '🦋', spot: 'belly' },
  no_appetite: { emoji: '🍂', spot: 'belly' },
  need_toilet: { emoji: '💦', spot: 'belly' },
  fists_clench: { emoji: '✊', spot: 'leftHand' },
  sweaty_palms: { emoji: '💧', spot: 'rightHand' },
  shaky: { emoji: '〰', spot: 'auraR' },
  soft_hands: { emoji: '🍃', spot: 'rightHand' },
  shoulders_heavy: { emoji: '📚', spot: 'auraL' },
  body_tense: { emoji: '〰', spot: 'auraL' },
  want_jump: { emoji: '⭐', spot: 'feet' },
  smile_wide: { emoji: '⭐', spot: 'face' },
  curled_up: { emoji: '🌑', spot: 'auraR' },
  floaty: { emoji: '✨', spot: 'auraR' },
};

/** Tuned for tall slender goblet proportions. */
const SPOT_STYLE: Record<Spot, object> = {
  head: { top: '4%', alignSelf: 'center' },
  face: { top: '28%', alignSelf: 'center' },
  chest: { top: '36%', alignSelf: 'center' },
  belly: { top: '52%', alignSelf: 'center' },
  leftHand: { top: '40%', left: '0%' },
  rightHand: { top: '40%', right: '0%' },
  feet: { bottom: '2%', alignSelf: 'center' },
  auraL: { top: '34%', left: '2%' },
  auraR: { top: '34%', right: '2%' },
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

const STAGE_BG: Record<WanjaiMood, string> = {
  neutral: '#E8F3EE',
  anxious: '#E8E0F0',
  warm: '#E5F5EA',
  heavy: '#E4EAF2',
  fiery: '#FCE8E2',
};

/** Tall bowl · vertical stack of poke zones. */
const HOTSPOTS: {
  region: BodyRegionKey;
  top: `${number}%`;
  left: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
}[] = [
  { region: 'head', top: '6%', left: '30%', width: '40%', height: '16%' },
  { region: 'chest', top: '24%', left: '30%', width: '40%', height: '20%' },
  { region: 'belly', top: '44%', left: '30%', width: '40%', height: '18%' },
  { region: 'hands', top: '32%', left: '6%', width: '20%', height: '22%' },
  { region: 'hands', top: '32%', left: '74%', width: '20%', height: '22%' },
  { region: 'whole', top: '68%', left: '32%', width: '36%', height: '24%' },
];

function FloatingDecor({ emoji, delay }: { emoji: string; delay: number }) {
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
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.Text style={[styles.decor, { transform: [{ translateY }, { rotate }] }]}>
      {emoji}
    </Animated.Text>
  );
}

function TrembleMarks({ visible }: { visible: boolean }) {
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      shake.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, shake]);

  if (!visible) return null;
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.trembleWrap, { transform: [{ translateX: tx }] }]}
    >
      <Text style={[styles.tremble, styles.trembleL]}>〰〰</Text>
      <Text style={[styles.tremble, styles.trembleR]}>〰〰</Text>
    </Animated.View>
  );
}

function SweatDrops({ visible }: { visible: boolean }) {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fall, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(fall, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, fall]);
  if (!visible) return null;
  const ty = fall.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const op = fall.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.sweatWrap, { opacity: op, transform: [{ translateY: ty }] }]}
    >
      <Text style={[styles.sweat, styles.sweatL]}>💧</Text>
      <Text style={[styles.sweat, styles.sweatR]}>💧</Text>
    </Animated.View>
  );
}

function StarBurst({ visible }: { visible: boolean }) {
  const twinkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, twinkle]);
  if (!visible) return null;
  const op = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <Animated.View pointerEvents="none" style={[styles.starWrap, { opacity: op }]}>
      <Text style={[styles.star, { top: '10%', left: '18%' }]}>✨</Text>
      <Text style={[styles.star, { top: '16%', right: '16%' }]}>⭐</Text>
      <Text style={[styles.star, { top: '28%', left: '12%' }]}>✨</Text>
    </Animated.View>
  );
}

/**
 * MoodBowl 碗仔 · tall blank bowl (no face).
 * Body feelings appear only as decorations (💧 ⭐ ♨️ …).
 */
export function BodyScanFigure({
  selected,
  focusRegion,
  onSelectRegion,
  idlePrompt,
}: Props) {
  const bounce = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const mood = useMemo(() => resolveWanjaiMood(selected), [selected]);

  const wantsJump = selected.includes('want_jump');
  const showTremble =
    mood === 'anxious' ||
    selected.includes('shaky') ||
    selected.includes('body_tense') ||
    selected.includes('heart_fast');
  const showSweat =
    mood === 'anxious' ||
    selected.includes('sweaty_palms') ||
    selected.includes('teary') ||
    selected.includes('face_flush');
  const showStars =
    mood === 'warm' ||
    selected.includes('eyes_bright') ||
    selected.includes('smile_wide') ||
    selected.includes('chest_warm');

  useEffect(() => {
    if (wantsJump || mood === 'warm') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    bounce.setValue(0);
  }, [wantsJump, mood, bounce]);

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

  const decors = selected
    .map((key) => ({ key, decor: CHIP_DECOR[key] }))
    .filter(
      (x): x is { key: BodyChipKey; decor: NonNullable<(typeof CHIP_DECOR)[BodyChipKey]> } =>
        !!x.decor,
    );

  const regionLit = (region: BodyRegionKey) =>
    focusRegion === region ||
    selected.some((k) => BODY_CHIPS.find((c) => c.key === k)?.region === region);

  const figureScale = mood === 'heavy' || selected.includes('curled_up') ? 0.92 : 1;
  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mood === 'warm' || wantsJump ? -14 : -6],
  });

  return (
    <View style={styles.wrap} testID="body-scan-figure">
      <View style={[styles.speech, { borderColor: mood === 'anxious' ? '#C4B0D8' : '#F0D78C' }]}>
        <Text style={styles.speechName}>碗仔話</Text>
        <Text style={styles.speechText}>{idlePrompt}</Text>
      </View>

      <Animated.View
        style={[
          styles.stage,
          { backgroundColor: STAGE_BG[mood] },
          { transform: [{ translateY }, { scale: figureScale }] },
        ]}
      >
        <Image
          source={WANJAI_BASE}
          style={styles.buddy}
          contentFit="contain"
          accessibilityLabel="MoodBowl 碗仔"
          testID="wanjai-base"
        />

        <TrembleMarks visible={showTremble} />
        <SweatDrops visible={showSweat} />
        <StarBurst visible={showStars} />

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
                  opacity: active ? glow : 0.2,
                },
              ]}
            />
          );
        })}

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

        {decors.map(({ key, decor }, i) => (
          <View key={key} pointerEvents="none" style={[styles.decorSlot, SPOT_STYLE[decor.spot]]}>
            <FloatingDecor emoji={decor.emoji} delay={i * 120} />
          </View>
        ))}
      </Animated.View>

      <Text style={styles.pokeHint}>戳戳碗仔 · 裝飾會話你知佢點</Text>

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

const FIGURE = 280;

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
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  buddy: {
    width: FIGURE,
    height: FIGURE,
    zIndex: 1,
  },
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
  decorSlot: {
    position: 'absolute',
    zIndex: 5,
  },
  decor: {
    fontSize: 26,
  },
  trembleWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  tremble: {
    position: 'absolute',
    top: '42%',
    fontSize: 18,
    color: COLORS.textPrimary,
    opacity: 0.55,
    fontWeight: '800',
  },
  trembleL: { left: 8 },
  trembleR: { right: 8 },
  sweatWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  sweat: {
    position: 'absolute',
    top: '14%',
    fontSize: 20,
  },
  sweatL: { left: 36 },
  sweatR: { right: 36 },
  starWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  star: {
    position: 'absolute',
    fontSize: 18,
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
