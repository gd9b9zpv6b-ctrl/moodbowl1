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

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import type { PlacedDecoration } from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import {
  STRETCH_STEPS,
  stretchPoseForStep,
} from '@/src/lib/ritual/stretch-pose';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  emotion?: Emotion | null;
  decorations?: PlacedDecoration[];
};

/**
 * 「碗想搞醒你少少」· the bowl stretches with you on each cue.
 */
export function GentleStretch({
  visible,
  onClose,
  onComplete,
  emotion,
  decorations = [],
}: Props) {
  const [index, setIndex] = useState(0);
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const armRaise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    const pose = stretchPoseForStep(visible ? index : 0);
    const easing = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(scaleX, { toValue: pose.scaleX, duration: 520, easing, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: pose.scaleY, duration: 520, easing, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: pose.rotateDeg, duration: 520, easing, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: pose.translateY, duration: 520, easing, useNativeDriver: true }),
      Animated.timing(armRaise, { toValue: pose.armRaise, duration: 520, easing, useNativeDriver: true }),
    ]).start();
  }, [armRaise, index, rotate, scaleX, scaleY, translateY, visible]);

  const atEnd = index >= STRETCH_STEPS.length - 1;
  const rotateStr = rotate.interpolate({
    inputRange: [-30, 30],
    outputRange: ['-30deg', '30deg'],
  });
  const leftArmRotate = armRaise.interpolate({
    inputRange: [0, 1],
    outputRange: ['22deg', '-78deg'],
  });
  const rightArmRotate = armRaise.interpolate({
    inputRange: [0, 1],
    outputRange: ['-22deg', '78deg'],
  });
  const armLift = armRaise.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -18],
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="stretch-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>慢慢伸個懶腰</Text>
        <Text style={styles.meta}>
          {index + 1} / {STRETCH_STEPS.length}
        </Text>

        <View style={styles.stage} testID="stretch-bowl">
          <View style={styles.shadow} />
          <Animated.View
            style={{
              transform: [{ translateY }, { rotate: rotateStr }, { scaleX }, { scaleY }],
            }}
          >
            <View style={styles.buddy}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shoulder,
                  styles.shoulderLeft,
                  { transform: [{ translateY: armLift }, { rotate: leftArmRotate }] },
                ]}
              >
                <View style={styles.arm} />
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shoulder,
                  styles.shoulderRight,
                  { transform: [{ translateY: armLift }, { rotate: rightArmRotate }] },
                ]}
              >
                <View style={styles.arm} />
              </Animated.View>
              <BowlWithDecor
                emotion={emotion}
                decorations={decorations}
                size={168}
                radius={RADIUS.lg}
                empty={!emotion}
                style={styles.bowlFront}
              />
            </View>
          </Animated.View>
        </View>
        <Text style={styles.buddyHint}>碗同你一齊伸</Text>

        <Text style={styles.step}>{STRETCH_STEPS[index]}</Text>

        <Pressable
          testID="stretch-next"
          onPress={() => {
            if (atEnd) {
              onComplete();
              return;
            }
            setIndex((i) => i + 1);
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{atEnd ? '搞掂' : '下一步'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  close: { alignSelf: 'flex-start', marginBottom: SPACING.lg },
  closeText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  stage: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  shadow: {
    position: 'absolute',
    bottom: 28,
    width: 120,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(45, 49, 66, 0.08)',
  },
  buddy: {
    width: 220,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    overflow: 'visible',
  },
  shoulder: {
    position: 'absolute',
    top: 52,
    width: 16,
    height: 16,
    zIndex: 0,
  },
  shoulderLeft: {
    left: 36,
  },
  shoulderRight: {
    right: 36,
  },
  arm: {
    width: 16,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E8D4B8',
  },
  bowlFront: {
    zIndex: 2,
  },
  buddyHint: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  step: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: SPACING.xl,
  },
  cta: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
