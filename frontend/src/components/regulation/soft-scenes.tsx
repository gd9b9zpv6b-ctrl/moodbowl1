import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

/** Soft stand-in for animal / scenery clips until media assets land. */
const SCENES = [
  { emoji: '🐱', line: '有隻小貓瞓得好甜' },
  { emoji: '🌅', line: '天邊有啲暖色' },
  { emoji: '🌿', line: '風輕輕吹過樹葉' },
  { emoji: '🐶', line: '小狗搖住條尾' },
  { emoji: '☁️', line: '白雲慢慢郁' },
  { emoji: '🌊', line: '海浪一下一下' },
];

/**
 * 「同碗睇啲嘢」· gentle scene cards (no streaming video yet).
 */
export function SoftScenes({ visible, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      return;
    }
    const t = setInterval(() => {
      setIndex((i) => (i >= SCENES.length - 1 ? i : i + 1));
    }, 4000);
    return () => clearInterval(t);
  }, [visible]);

  const scene = SCENES[index] || SCENES[0];
  const atEnd = index >= SCENES.length - 1;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="soft-scenes-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.meta}>
          {index + 1} / {SCENES.length}
        </Text>
        <Text style={styles.emoji}>{scene.emoji}</Text>
        <Text style={styles.line}>{scene.line}</Text>

        <Pressable
          testID="soft-scenes-next"
          onPress={() => {
            if (atEnd) {
              onComplete();
              return;
            }
            setIndex((i) => Math.min(SCENES.length - 1, i + 1));
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{atEnd ? '睇完啦' : '下一張'}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { position: 'absolute', top: SPACING.xxl, left: SPACING.lg },
  closeText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  emoji: { fontSize: 72, marginBottom: SPACING.md },
  line: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  cta: {
    height: 52,
    minWidth: 160,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
