import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const PHASES = ['吸氣', '停', '呼氣', '停'] as const;
const SIDE = 140;

export function BoxBreathing({ visible, onClose, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [done, setDone] = useState(false);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (!visible) {
      clear();
      setRound(0);
      setPhaseIdx(0);
      setDone(false);
      x.setValue(0);
      y.setValue(0);
      return;
    }

    let cancelled = false;

    const animateSide = (idx: number, r: number) => {
      if (cancelled) return;
      if (r >= 4) {
        setDone(true);
        return;
      }
      setRound(r + 1);
      setPhaseIdx(idx);
      Haptics.selectionAsync().catch(() => {});

      const anim =
        idx === 0
          ? Animated.timing(x, { toValue: SIDE, duration: 4000, useNativeDriver: false })
          : idx === 1
            ? Animated.timing(y, { toValue: SIDE, duration: 4000, useNativeDriver: false })
            : idx === 2
              ? Animated.timing(x, { toValue: 0, duration: 4000, useNativeDriver: false })
              : Animated.timing(y, { toValue: 0, duration: 4000, useNativeDriver: false });

      anim.start();
      timers.current.push(
        setTimeout(() => {
          if (cancelled) return;
          const nextIdx = (idx + 1) % 4;
          const nextRound = nextIdx === 0 ? r + 1 : r;
          animateSide(nextIdx, nextRound);
        }, 4000),
      );
    };

    animateSide(0, 0);
    return () => {
      cancelled = true;
      clear();
    };
  }, [visible, x, y]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="box-breathing-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>Box Breathing</Text>
        <Text style={styles.sub}>
          {done ? '搞掂啦' : `第 ${Math.min(round || 1, 4)} / 4 輪 · ${PHASES[phaseIdx]}`}
        </Text>

        <View style={styles.box}>
          <Animated.View style={[styles.dot, { left: x, top: y }]} />
        </View>

        <Pressable
          testID="box-breathing-done"
          onPress={onComplete}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{done ? '完成' : '夠啦'}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { position: 'absolute', top: 56, left: SPACING.lg },
  closeText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  box: {
    width: SIDE + 16,
    height: SIDE + 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginLeft: -8,
    marginTop: -8,
  },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    minWidth: 180,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
