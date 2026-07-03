import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api } from '@/src/lib/api';
import { unlockDiary } from '@/src/lib/diary-lock';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export function PinUnlockModal({ visible, onClose, onUnlocked }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError(null);
    }
  }, [visible]);

  const submit = async () => {
    setError(null);
    if (pin.length !== 4) {
      setError('請輸入 4 位數字');
      return;
    }
    setChecking(true);
    try {
      const res = await api.post<{ ok: boolean }>('/premium/verify-pin', { pin });
      if (res.ok) {
        unlockDiary();
        onUnlocked();
        onClose();
      } else {
        setError('密碼錯誤 · 再試一次');
        setPin('');
      }
    } catch {
      setError('出錯 · 請稍後再試');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={28} color="#E86A6A" />
          </View>
          <Text style={styles.title}>輸入密碼</Text>
          <Text style={styles.hint}>4 位數字密碼 解鎖秘密日記</Text>

          <TextInput
            testID="pin-unlock-input"
            autoFocus
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
            placeholder="****"
            placeholderTextColor={COLORS.textDisabled}
            onSubmitEditing={submit}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              testID="pin-unlock-cancel"
              onPress={onClose}
              style={[styles.btn, styles.btnGhost]}
            >
              <Text style={styles.btnGhostText}>取消</Text>
            </Pressable>
            <Pressable
              testID="pin-unlock-submit"
              onPress={submit}
              disabled={checking || pin.length !== 4}
              style={[styles.btn, styles.btnPrimary, (checking || pin.length !== 4) && { opacity: 0.5 }]}
            >
              {checking ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <Text style={styles.btnPrimaryText}>解鎖</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,49,66,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFE4E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    height: 56,
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  error: { color: COLORS.danger, marginTop: SPACING.sm, fontSize: 13 },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, width: '100%' },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  btnGhost: { backgroundColor: COLORS.bgInput },
  btnGhostText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
