import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const STEPS = [
  '慢慢企直啲 · 或者坐穩',
  '雙手向上伸 · 好似想掂到天花',
  '輕輕側一側 · 左邊',
  '再側一側 · 右邊',
  '放下雙手 · 呼一大口氣',
];

/**
 * 「碗想搞醒你少少」· gentle stretch guide (text-led for now).
 */
export function GentleStretch({ visible, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) setIndex(0);
  }, [visible]);

  const atEnd = index >= STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="stretch-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>慢慢伸個懶腰</Text>
        <Text style={styles.meta}>
          {index + 1} / {STEPS.length}
        </Text>
        <Text style={styles.step}>{STEPS[index]}</Text>

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
  meta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xl },
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
