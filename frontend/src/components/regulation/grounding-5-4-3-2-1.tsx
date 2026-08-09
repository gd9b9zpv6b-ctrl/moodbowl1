import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProgressDots } from '@/src/components/progress-dots';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const STEPS = [
  { count: 5, prompt: '你見到 5 樣嘢 · 打俾我聽', sense: '見' },
  { count: 4, prompt: '你摸到 4 樣嘢 · 打俾我聽', sense: '摸' },
  { count: 3, prompt: '你聽到 3 樣聲 · 打俾我聽', sense: '聽' },
  { count: 2, prompt: '你聞到 2 樣味 · 打俾我聽', sense: '嗅' },
  { count: 1, prompt: '你嚐到 1 樣味 · 打俾我聽', sense: '味' },
];

export function Grounding54321({ visible, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep(0);
      setText('');
      setDone(false);
    }
  }, [visible]);

  const current = STEPS[step];

  const next = () => {
    if (step >= STEPS.length - 1) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID="grounding-close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>返去</Text>
        </Pressable>

        {done ? (
          <View style={styles.center}>
            <Text style={styles.title}>你已經返到 here-and-now 啦 🌱</Text>
            <Pressable testID="grounding-done" onPress={onComplete} style={styles.cta}>
              <Text style={styles.ctaText}>搞掂</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <ProgressDots total={5} active={step + 1} />
            <Text style={styles.title}>{current.prompt}</Text>
            <Text style={styles.sub}>呢啲字淨係幫你返返嚟 · 唔會儲起</Text>
            <TextInput
              testID="grounding-input"
              value={text}
              onChangeText={setText}
              placeholder={`例如：寫 ${current.count} 樣 · 用 · 分隔`}
              placeholderTextColor={COLORS.textDisabled}
              multiline
              style={styles.input}
            />
            <Pressable testID="grounding-next" onPress={next} style={styles.cta}>
              <Text style={styles.ctaText}>
                {step >= STEPS.length - 1 ? '完成' : '下一步'}
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgMain, paddingTop: 56 },
  close: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  closeText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  sub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  input: {
    minHeight: 140,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minWidth: 180,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
