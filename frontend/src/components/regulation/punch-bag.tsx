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

export function PunchBag({ visible, onClose, onComplete }: Props) {
  const [hits, setHits] = useState(0);
  const [praise, setPraise] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setHits(0);
      setPraise(null);
      shake.setValue(0);
    }
  }, [visible, shake]);

  const onHit = () => {
    const next = hits + 1;
    setHits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();

    if (next === 20 || next === 50 || next === 100) {
      setPraise('你發洩得好 · 好啦');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="punch-bag-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>打沙包</Text>
        <Text style={styles.sub}>撳快啲 · 放低啲火氣</Text>

        <Pressable testID="punch-bag-hit" onPress={onHit} style={styles.bagHit}>
          <Animated.View style={[styles.bag, { transform: [{ translateX: shake }] }]}>
            <Text style={styles.bagEmoji}>🥊</Text>
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
    flex: 1,
    backgroundColor: '#2D3142',
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { position: 'absolute', top: 56, left: SPACING.lg },
  closeText: { fontSize: 15, color: COLORS.textDisabled, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textInverse, marginBottom: SPACING.sm },
  sub: { fontSize: 15, color: COLORS.textDisabled, marginBottom: SPACING.xl },
  bagHit: { marginBottom: SPACING.lg },
  bag: {
    width: 180,
    height: 220,
    borderRadius: RADIUS.lg,
    backgroundColor: '#3A3F55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagEmoji: { fontSize: 72 },
  counter: { fontSize: 28, fontWeight: '800', color: COLORS.textInverse, marginBottom: SPACING.sm },
  praise: { fontSize: 15, color: COLORS.accent, marginBottom: SPACING.lg },
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
