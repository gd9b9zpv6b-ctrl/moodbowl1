import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const BAG_H = 360;

/**
 * Hanging punching bag in the foreground. Tap it and it swings from the chain.
 */
export function PunchBag({ visible, onClose, onComplete }: Props) {
  const [hits, setHits] = useState(0);
  const [praise, setPraise] = useState<string | null>(null);
  const swing = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const impact = useRef(new Animated.Value(0)).current;
  const hitDir = useRef(1);
  const idle = useRef<Animated.CompositeAnimation | null>(null);

  const stopIdle = () => {
    idle.current?.stop();
    idle.current = null;
  };

  const startIdle = () => {
    stopIdle();
    swing.setValue(0);
    idle.current = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {
          toValue: 0.12,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          toValue: -0.12,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    idle.current.start();
  };

  useEffect(() => {
    if (!visible) {
      setHits(0);
      setPraise(null);
      stopIdle();
      swing.setValue(0);
      squash.setValue(1);
      impact.setValue(0);
      return;
    }
    startIdle();
    return () => stopIdle();
    // Idle loop is local to this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onHit = () => {
    const next = hits + 1;
    setHits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    stopIdle();
    const dir = hitDir.current;
    hitDir.current = -dir;
    swing.stopAnimation();
    squash.stopAnimation();
    impact.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(swing, {
          toValue: dir * 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(swing, {
          toValue: 0,
          friction: 4.2,
          tension: 92,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(squash, {
          toValue: 0.9,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(squash, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(impact, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(impact, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished && visible) startIdle();
    });

    if (next === 20 || next === 50 || next === 100) {
      setPraise('你發洩得好 · 好啦');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const rotate = swing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });
  const impactScale = impact.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.15],
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.ceiling} />
        <View style={styles.floor} />

        <Pressable testID="punch-bag-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>打沙包</Text>
        <Text style={styles.sub}>喺前頭大力打 · 放低啲火氣</Text>

        <Pressable
          testID="punch-bag-hit"
          onPress={onHit}
          style={styles.bagHit}
          accessibilityLabel="打沙包"
        >
          <Animated.View
            style={[
              styles.hang,
              {
                transform: [
                  { translateY: BAG_H / 2 },
                  { rotate },
                  { translateY: -BAG_H / 2 },
                  { scaleX: squash },
                ],
              },
            ]}
          >
            <View style={styles.hookRow}>
              <Svg height={28} viewBox="0 0 36 28" width={36}>
                <Circle cx="18" cy="8" fill="none" r="6" stroke="#C5CBD6" strokeWidth="3" />
                <Path d="M18 14 V28" stroke="#C5CBD6" strokeLinecap="round" strokeWidth="3" />
              </Svg>
            </View>
            <View style={styles.chain}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.chainLink, i % 2 === 1 && styles.chainLinkAlt]} />
              ))}
            </View>
            <View style={styles.bag}>
              <View style={styles.bagCap} />
              <View style={styles.bagBody}>
                <View style={styles.bagShade} />
                <View style={styles.bagHighlight} />
                <View style={styles.bagPanel} />
                <View style={[styles.bagPanel, styles.bagPanelRight]} />
                <View style={styles.strap} />
                <View style={[styles.strap, { top: 78 }]} />
                <View style={[styles.strap, { top: 148 }]} />
              </View>
              <View style={styles.bagBottom} />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.impact,
                  { opacity: impact, transform: [{ scale: impactScale }] },
                ]}
              >
                <Svg height={86} viewBox="0 0 86 86" width={86}>
                  <Circle cx="43" cy="43" fill="#FFFFFF22" r="20" />
                  <Circle cx="43" cy="43" fill="#FFFFFF55" r="8" />
                  <Path
                    d="M43 8 L45 28 M43 78 L41 58 M8 43 L28 45 M78 43 L58 41"
                    stroke="#F4E4C4"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </Svg>
              </Animated.View>
            </View>
          </Animated.View>
        </Pressable>

        <Text style={styles.counter}>{hits} 下</Text>
        {praise && <Text style={styles.praise}>{praise}</Text>}

        <Pressable testID="punch-bag-done" onPress={onComplete} style={styles.cta}>
          <Text style={styles.ctaText}>夠啦</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: '#2A2C38',
    flex: 1,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
  },
  ceiling: {
    backgroundColor: '#1F212C',
    height: 90,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  floor: {
    backgroundColor: '#232530',
    bottom: 0,
    height: '18%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  close: { left: SPACING.lg, position: 'absolute', top: 56, zIndex: 2 },
  closeText: { color: COLORS.textDisabled, fontSize: 15, fontWeight: '600' },
  title: {
    color: COLORS.textInverse,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  sub: { color: COLORS.textDisabled, fontSize: 15, marginBottom: SPACING.md },
  bagHit: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
    width: '100%',
  },
  hang: {
    alignItems: 'center',
    height: BAG_H,
  },
  hookRow: { alignItems: 'center', height: 28 },
  chain: { alignItems: 'center', height: 36, justifyContent: 'space-between' },
  chainLink: {
    borderColor: '#B8BFC9',
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    height: 10,
    width: 8,
  },
  chainLinkAlt: { width: 10 },
  bag: {
    alignItems: 'center',
    width: 176,
  },
  bagCap: {
    backgroundColor: '#8B5340',
    borderColor: '#6F4031',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 18,
    width: 92,
    zIndex: 1,
  },
  bagBody: {
    backgroundColor: '#C17A58',
    borderColor: '#8C4E3A',
    borderRadius: 46,
    borderWidth: 2,
    height: 248,
    marginTop: -8,
    overflow: 'hidden',
    width: 168,
  },
  bagShade: {
    backgroundColor: '#A35F44',
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '38%',
  },
  bagHighlight: {
    backgroundColor: '#E0A07A55',
    borderRadius: RADIUS.pill,
    height: '78%',
    left: 18,
    position: 'absolute',
    top: '10%',
    width: 18,
  },
  bagPanel: {
    borderColor: '#9A5842AA',
    borderLeftWidth: 1.5,
    bottom: 12,
    left: '33%',
    position: 'absolute',
    top: 12,
    width: 1,
  },
  bagPanelRight: { left: '66%' },
  strap: {
    backgroundColor: '#E6D3A3',
    borderRadius: RADIUS.pill,
    height: 8,
    left: 10,
    position: 'absolute',
    right: 10,
    top: 22,
  },
  bagBottom: {
    backgroundColor: '#8B5340',
    borderRadius: RADIUS.pill,
    height: 16,
    marginTop: -10,
    width: 110,
  },
  impact: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 90,
  },
  counter: {
    color: COLORS.textInverse,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  praise: { color: COLORS.accent, fontSize: 15, marginBottom: SPACING.md },
  cta: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    height: 56,
    justifyContent: 'center',
    minWidth: 180,
    paddingHorizontal: SPACING.xl,
  },
  ctaText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
});
