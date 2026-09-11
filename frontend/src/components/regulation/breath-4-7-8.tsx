import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import {
  breathShapeForActivity,
  type BreathShape,
} from '@/src/lib/ritual/breath-shape';

type Props = {
  visible: boolean;
  title?: string;
  activityKey?: string | null;
  onClose: () => void;
  onComplete: () => void;
};

type Phase = 'inhale' | 'hold' | 'exhale' | 'done';

const PHASE_LABEL: Record<Phase, string> = {
  inhale: '吸氣 · 4 秒',
  hold: '停 · 7 秒',
  exhale: '呼氣 · 8 秒',
  done: '搞掂啦',
};

export function Breath478({
  visible,
  title,
  activityKey,
  onClose,
  onComplete,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shape = breathShapeForActivity(activityKey);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (!visible) {
      clearTimers();
      setPhase('inhale');
      setCycle(0);
      scale.setValue(1);
      return;
    }

    let cancelled = false;

    const runCycle = (n: number) => {
      if (cancelled || n >= 3) {
        setPhase('done');
        return;
      }
      setCycle(n + 1);
      setPhase('inhale');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.timing(scale, { toValue: 1.7, duration: 4000, useNativeDriver: true }).start();

      timers.current.push(
        setTimeout(() => {
          if (cancelled) return;
          setPhase('hold');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }, 4000),
      );
      timers.current.push(
        setTimeout(() => {
          if (cancelled) return;
          setPhase('exhale');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(scale, { toValue: 1, duration: 8000, useNativeDriver: true }).start();
        }, 11000),
      );
      timers.current.push(
        setTimeout(() => {
          if (cancelled) return;
          runCycle(n + 1);
        }, 19000),
      );
    };

    runCycle(0);
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [visible, scale]);

  const heading = title?.trim() || '4-7-8 呼吸';

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, shape === 'ice' && styles.rootIce, shape === 'bowl' && styles.rootBowl]}>
        <Pressable testID="breath-478-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.sub}>
          {phase === 'done' ? '你可以唞一陣' : `第 ${cycle || 1} / 3 輪 · ${PHASE_LABEL[phase]}`}
        </Text>

        <View style={styles.circleWrap}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <BreathShapeVisual shape={shape} />
          </Animated.View>
        </View>

        {phase === 'done' ? (
          <View style={styles.actions}>
            <Pressable
              testID="breath-478-again"
              onPress={() => {
                setPhase('inhale');
                setCycle(0);
                onClose();
              }}
              style={styles.secondary}
            >
              <Text style={styles.secondaryText}>多做一次</Text>
            </Pressable>
            <Pressable
              testID="breath-478-done"
              onPress={onComplete}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>完成</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable testID="breath-478-skip" onPress={onComplete} style={styles.secondary}>
            <Text style={styles.secondaryText}>夠啦</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

function BreathShapeVisual({ shape }: { shape: BreathShape }) {
  if (shape === 'ice') {
    return (
      <View testID="breath-shape-ice" style={styles.iceWrap}>
        <Svg height={96} viewBox="0 0 96 96" width={96}>
          <Path d="M48 14 L78 30 L48 46 L18 30 Z" fill="#F7FCFE" stroke="#C5E3EE" strokeWidth="1.5" />
          <Path d="M18 30 L48 46 L48 82 L18 66 Z" fill="#B9DCE8" stroke="#8FBFCE" strokeWidth="1.5" />
          <Path d="M78 30 L48 46 L48 82 L78 66 Z" fill="#D4EEF5" stroke="#A7D0DC" strokeWidth="1.5" />
          <Path d="M30 28 L52 22" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
          <Path d="M58 54 L64 62" stroke="#FFFFFFAA" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      </View>
    );
  }

  if (shape === 'bowl') {
    return (
      <View testID="breath-shape-bowl" style={styles.bowlWrap}>
        <Svg height={90} viewBox="0 0 90 90" width={90}>
          <Ellipse cx="45" cy="28" fill="#F4E4C4" rx="28" ry="10" />
          <Path d="M17 28 C17 58 28 74 45 74 C62 74 73 58 73 28" fill="#E8C99A" />
          <Ellipse cx="45" cy="28" fill="#FFF6E4" rx="22" ry="7" />
        </Svg>
      </View>
    );
  }

  if (shape === 'wind') {
    return (
      <View testID="breath-shape-wind" style={styles.windOrb}>
        <Svg height={90} viewBox="0 0 90 90" width={90}>
          <Circle cx="45" cy="45" fill="#E3F1F6" r="36" stroke="#A8C9D4" strokeWidth="2" />
          <Path
            d="M22 40 C34 32 48 48 68 38"
            fill="none"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <Path
            d="M24 54 C38 46 52 62 70 52"
            fill="none"
            stroke="#C5E0E8"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </Svg>
      </View>
    );
  }

  return <View testID="breath-shape-orb" style={styles.circle} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rootIce: { backgroundColor: '#EAF4F8' },
  rootBowl: { backgroundColor: '#FBF6E9' },
  close: { position: 'absolute', top: 56, left: SPACING.lg },
  closeText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl, textAlign: 'center' },
  circleWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iceWrap: { alignItems: 'center', justifyContent: 'center', height: 96, width: 96 },
  bowlWrap: { alignItems: 'center', justifyContent: 'center', height: 90, width: 90 },
  windOrb: { alignItems: 'center', justifyContent: 'center', height: 90, width: 90 },
  actions: { width: '100%', gap: SPACING.sm },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  secondary: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
});
