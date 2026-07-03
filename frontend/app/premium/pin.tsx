import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';
import { unlockDiary } from '@/src/lib/diary-lock';

export default function SetPinScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('請輸入 4 位數字');
      return;
    }
    if (pin !== confirm) {
      setError('兩次輸入唔一樣');
      return;
    }
    setSaving(true);
    try {
      await api.post<User>('/premium/set-pin', { pin });
      unlockDiary();
      await refreshUser();
      router.back();
    } catch (e: any) {
      setError(e?.message || '設定失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable testID="pin-back" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>秘密日記密碼</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconWrap}>
            <Feather name="lock" size={30} color="#E86A6A" />
          </View>
          <Text style={styles.title}>設定 4 位數字密碼</Text>
          <Text style={styles.hint}>
            將日記標記為秘密後,{'\n'}要輸入密碼先睇到內容
          </Text>

          <Text style={styles.label}>新密碼</Text>
          <TextInput
            testID="pin-input"
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
            placeholder="****"
            placeholderTextColor={COLORS.textDisabled}
          />

          <Text style={styles.label}>再輸入一次</Text>
          <TextInput
            testID="pin-confirm-input"
            value={confirm}
            onChangeText={(t) => setConfirm(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
            placeholder="****"
            placeholderTextColor={COLORS.textDisabled}
          />

          {error && <Text style={styles.error} testID="pin-error">{error}</Text>}

          <Pressable
            testID="pin-save"
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.saveText}>儲存密碼</Text>
            )}
          </Pressable>

          <Text style={styles.warn}>
            ⚠ 請記住呢個密碼 · 我哋唔會保留原始碼{'\n'}
            如果忘記,只能重設一個新嘅
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  iconWrap: {
    width: 68, height: 68, borderRadius: RADIUS.pill, backgroundColor: '#FFE4E4',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: SPACING.md,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm, letterSpacing: 0.4 },
  input: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 56, fontSize: 22, letterSpacing: 8,
    color: COLORS.textPrimary, marginBottom: SPACING.md, textAlign: 'center',
  },
  error: { color: COLORS.danger, textAlign: 'center', marginBottom: SPACING.sm },
  saveBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md,
  },
  saveText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  warn: {
    marginTop: SPACING.lg, color: COLORS.textSecondary,
    fontSize: 12, textAlign: 'center', lineHeight: 20,
  },
});
