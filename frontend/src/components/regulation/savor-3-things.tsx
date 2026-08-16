import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

/**
 * 「留住呢個瞬間」· write 3 gentle things from today.
 */
export function Savor3Things({ visible, onClose, onComplete }: Props) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');

  const filled = [a, b, c].filter((t) => t.trim().length > 0).length;
  const canDone = filled >= 1;

  const reset = () => {
    setA('');
    setB('');
    setC('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={reset}
    >
      <View style={styles.root}>
        <Pressable testID="savor3-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        <Text style={styles.title}>寫 3 樣今日靚嘢</Text>
        <Text style={styles.sub}>一個字都得 · 寫到幾多都 OK</Text>

        <TextInput
          testID="savor3-a"
          value={a}
          onChangeText={setA}
          placeholder="1 ·"
          placeholderTextColor={COLORS.textDisabled}
          style={styles.input}
        />
        <TextInput
          testID="savor3-b"
          value={b}
          onChangeText={setB}
          placeholder="2 ·"
          placeholderTextColor={COLORS.textDisabled}
          style={styles.input}
        />
        <TextInput
          testID="savor3-c"
          value={c}
          onChangeText={setC}
          placeholder="3 ·"
          placeholderTextColor={COLORS.textDisabled}
          style={styles.input}
        />

        <Pressable
          testID="savor3-done"
          onPress={() => {
            if (!canDone) return;
            onComplete();
          }}
          style={[styles.cta, !canDone && { opacity: 0.45 }]}
        >
          <Text style={styles.ctaText}>留低啦</Text>
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
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cta: {
    marginTop: SPACING.lg,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
