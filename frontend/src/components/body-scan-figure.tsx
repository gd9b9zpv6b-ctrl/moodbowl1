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

type Props = {
  selected: BodyChipKey[];
  focusRegion: BodyRegionKey | null;
  onSelectRegion: (region: BodyRegionKey) => void;
  idlePrompt: string;
};

/** Silly floating gags that appear on the figure for selected chips. */
const CHIP_GAGS: Partial<Record<BodyChipKey, { emoji: string; spot: 'head' | 'face' | 'chest' | 'belly' | 'leftHand' | 'rightHand' | 'feet' | 'aura' }>> = {
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

const SPOT_STYLE: Record<string, object> = {
  head: { top: 2, alignSelf: 'center' },
  face: { top: 28, alignSelf: 'center' },
  chest: { top: 88, alignSelf: 'center' },
  belly: { top: 148, alignSelf: 'center' },
  leftHand: { top: 110, left: 18 },
  rightHand: { top: 110, right: 18 },
  feet: { bottom: 8, alignSelf: 'center' },
  aura: { top: 70, right: 8 },
};

const REGION_COLORS: Record<BodyRegionKey, string> = {
  head: '#F4D0C9',
  chest: '#A3C4BC',
  belly: '#FFE6A7',
  hands: '#D1E2DE',
  whole: '#E8D5C4',
};

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

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.Text
      style={[styles.gag, { transform: [{ translateY }, { rotate }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

/**
 * Cartoon “cup-person” kids poke to scan body feelings.
 * Regions light up; selected chips spawn silly floating gags.
 */
export function BodyScanFigure({
  selected,
  focusRegion,
  onSelectRegion,
  idlePrompt,
}: Props) {
  const wiggle = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  const wantsJump = selected.includes('want_jump');
  const isTense = selected.includes('body_tense') || selected.includes('fists_clench');
  const isCurled = selected.includes('curled_up');
  const isFloaty = selected.includes('floaty');

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

  const gags = selected
    .map((key) => ({ key, gag: CHIP_GAGS[key] }))
    .filter((x): x is { key: BodyChipKey; gag: NonNullable<(typeof CHIP_GAGS)[BodyChipKey]> } => !!x.gag);

  const regionActive = (region: BodyRegionKey) =>
    focusRegion === region ||
    selected.some((k) => BODY_CHIPS.find((c) => c.key === k)?.region === region);

  const figureScale = isCurled ? 0.82 : isFloaty ? 1.04 : 1;
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  return (
    <View style={styles.wrap} testID="body-scan-figure">
      <View style={styles.speech}>
        <Text style={styles.speechText}>{idlePrompt}</Text>
      </View>

      <Animated.View
        style={[
          styles.figure,
          {
            transform: [
              { translateY },
              { rotate },
              { scale: figureScale },
            ],
          },
        ]}
      >
        {/* Head */}
        <Pressable
          testID="body-hotspot-head"
          onPress={() => onSelectRegion('head')}
          style={[
            styles.head,
            regionActive('head') && { backgroundColor: REGION_COLORS.head },
            focusRegion === 'head' && styles.hot,
          ]}
        >
          <Text style={styles.faceEyes}>
            {selected.includes('eyelids_heavy')
              ? '— —'
              : selected.includes('eyes_bright')
                ? '✦ ✦'
                : selected.includes('teary')
                  ? '· ·'
                  : '• •'}
          </Text>
          <Text style={styles.faceMouth}>
            {selected.includes('smile_wide')
              ? '⌣'
              : selected.includes('jaw_clench')
                ? '≡'
                : selected.includes('teary')
                  ? '⌢'
                  : 'ᴗ'}
          </Text>
          {selected.includes('face_flush') && (
            <>
              <View style={[styles.blush, styles.blushL]} />
              <View style={[styles.blush, styles.blushR]} />
            </>
          )}
        </Pressable>

        {/* Neck stub */}
        <View style={styles.neck} />

        {/* Torso · chest + belly stacked */}
        <View style={styles.torso}>
          <Pressable
            testID="body-hotspot-chest"
            onPress={() => onSelectRegion('chest')}
            style={[
              styles.chest,
              regionActive('chest') && { backgroundColor: REGION_COLORS.chest },
              focusRegion === 'chest' && styles.hot,
            ]}
          >
            <Text style={styles.partLabel}>胸口</Text>
          </Pressable>
          <Pressable
            testID="body-hotspot-belly"
            onPress={() => onSelectRegion('belly')}
            style={[
              styles.belly,
              regionActive('belly') && { backgroundColor: REGION_COLORS.belly },
              focusRegion === 'belly' && styles.hot,
            ]}
          >
            <Text style={styles.partLabel}>肚仔</Text>
          </Pressable>
        </View>

        {/* Arms */}
        <Pressable
          testID="body-hotspot-hands"
          onPress={() => onSelectRegion('hands')}
          style={styles.armsHit}
        >
          <View
            style={[
              styles.arm,
              styles.armL,
              regionActive('hands') && { backgroundColor: REGION_COLORS.hands },
              focusRegion === 'hands' && styles.hot,
            ]}
          />
          <View
            style={[
              styles.arm,
              styles.armR,
              regionActive('hands') && { backgroundColor: REGION_COLORS.hands },
              focusRegion === 'hands' && styles.hot,
            ]}
          />
        </Pressable>

        {/* Legs / whole body */}
        <Pressable
          testID="body-hotspot-whole"
          onPress={() => onSelectRegion('whole')}
          style={[
            styles.legs,
            regionActive('whole') && { backgroundColor: REGION_COLORS.whole },
            focusRegion === 'whole' && styles.hot,
          ]}
        >
          <View style={styles.leg} />
          <View style={styles.leg} />
        </Pressable>

        {/* Floating gags */}
        {gags.map(({ key, gag }, i) => (
          <View
            key={key}
            pointerEvents="none"
            style={[styles.gagSlot, SPOT_STYLE[gag.spot]]}
          >
            <FloatingGag emoji={gag.emoji} delay={i * 120} />
          </View>
        ))}
      </Animated.View>

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
            <Text style={styles.regionTabText}>
              {r === 'head' ? '頭' : r === 'chest' ? '心' : r === 'belly' ? '肚' : r === 'hands' ? '手' : '身'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

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
    borderColor: '#E8D5C4',
    maxWidth: 300,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  figure: {
    width: 220,
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
  },
  head: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#F7E8D5',
    borderWidth: 3,
    borderColor: '#D4B896',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  faceEyes: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  faceMouth: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  blush: {
    position: 'absolute',
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: '#F4A09A',
    opacity: 0.7,
    top: 42,
  },
  blushL: { left: 10 },
  blushR: { right: 10 },
  neck: {
    width: 18,
    height: 12,
    backgroundColor: '#F0DCC4',
    marginTop: -2,
    zIndex: 2,
  },
  torso: {
    width: 110,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#C9B8A4',
    zIndex: 2,
  },
  chest: {
    height: 58,
    backgroundColor: '#EDE4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  belly: {
    height: 58,
    backgroundColor: '#E8DFD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  armsHit: {
    position: 'absolute',
    top: 96,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1,
  },
  arm: {
    position: 'absolute',
    width: 28,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#EDE4D8',
    borderWidth: 3,
    borderColor: '#C9B8A4',
  },
  armL: { left: 12, transform: [{ rotate: '18deg' }] },
  armR: { right: 12, transform: [{ rotate: '-18deg' }] },
  legs: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
    padding: 4,
    borderRadius: 16,
  },
  leg: {
    width: 28,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#EDE4D8',
    borderWidth: 3,
    borderColor: '#C9B8A4',
  },
  hot: {
    borderColor: COLORS.textPrimary,
    borderWidth: 3,
  },
  gagSlot: {
    position: 'absolute',
    zIndex: 5,
  },
  gag: {
    fontSize: 22,
  },
  regionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionTab: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
