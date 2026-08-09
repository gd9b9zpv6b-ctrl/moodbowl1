import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AFFIRMATIONS } from '@/src/constants/affirmations';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const SLIDES = AFFIRMATIONS.slice(0, 15);

export function AffirmationSlideshow({ visible, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      setPaused(false);
      if (timer.current) clearInterval(timer.current);
      return;
    }
    if (paused) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= SLIDES.length - 1) {
          if (timer.current) clearInterval(timer.current);
          return i;
        }
        return i + 1;
      });
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [visible, paused]);

  const quote = SLIDES[index] || SLIDES[0];

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="affirmation-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.meta}>
          {index + 1} / {SLIDES.length}
          {paused ? ' · 暫停' : ''}
        </Text>

        <Pressable
          testID="affirmation-card"
          onPress={() => setPaused((p) => !p)}
          style={styles.card}
        >
          <Text style={styles.quote}>「{quote}」</Text>
          <Text style={styles.hint}>撳一下 · {paused ? '繼續' : '暫停'}</Text>
        </Pressable>

        <View style={styles.nav}>
          <Pressable
            testID="affirmation-prev"
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            style={styles.navBtn}
          >
            <Text style={styles.navText}>上一句</Text>
          </Pressable>
          <Pressable
            testID="affirmation-next"
            onPress={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}
            style={styles.navBtn}
          >
            <Text style={styles.navText}>下一句</Text>
          </Pressable>
        </View>

        <Pressable testID="affirmation-done" onPress={onComplete} style={styles.cta}>
          <Text style={styles.ctaText}>完成</Text>
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
    justifyContent: 'center',
  },
  close: { position: 'absolute', top: 56, left: SPACING.lg },
  closeText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  meta: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    minHeight: 220,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  quote: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 32,
    textAlign: 'center',
  },
  hint: {
    marginTop: SPACING.lg,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  nav: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  navBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
