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

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
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

export function Breath478({ visible, onClose, onComplete }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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
      Animated.timing(scale, { toValue: 2, duration: 4000, useNativeDriver: true }).start();

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

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="breath-478-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>4-7-8 呼吸</Text>
        <Text style={styles.sub}>
          {phase === 'done' ? '你可以唞一陣' : `第 ${cycle || 1} / 3 輪 · ${PHASE_LABEL[phase]}`}
        </Text>

        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        </View>

        {phase === 'done' ? (
          <View style={styles.actions}>
            <Pressable
              testID="breath-478-again"
              onPress={() => {
                setPhase('inhale');
                setCycle(0);
                // remount effect by toggling — simple restart via complete path
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: { position: 'absolute', top: 56, left: SPACING.lg },
  closeText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  circleWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
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
