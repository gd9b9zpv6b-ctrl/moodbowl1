/**
 * Auth · Activate by invite code screen.
 * Student / parent enters the invite code the school admin distributed · sets a password.
 * On success, backend returns a JWT and the AuthProvider treats them as logged in.
 */
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, setToken, User, AuthResponse } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

export default function Activate() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    const c = code.trim().toUpperCase();
    if (!c) { setError('請輸入邀請碼'); return; }
    if (password.length < 6) { setError('密碼至少 6 個字'); return; }
    if (password !== confirmPw) { setError('兩次密碼唔一樣'); return; }
    setBusy(true);
    try {
      const res = await api.post<AuthResponse>('/auth/activate', {
        invite_code: c, password,
      });
      await setToken(res.access_token);
      setUser(res.user as User);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || '啟用失敗 · 請 double check 邀請碼');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="activate-back">
            <Feather name="chevron-left" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>

          <Text style={styles.title}>🎫 用邀請碼啟用帳戶</Text>
          <Text style={styles.sub}>
            學校 admin 派俾你嘅 8 位字碼 · 輸入後設定密碼 · 就可以開始用。
          </Text>

          <Text style={styles.label}>邀請碼</Text>
          <TextInput
            testID="activate-code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="例如：S-A1B2C3D4"
            placeholderTextColor={COLORS.textDisabled}
            style={[styles.input, { fontFamily: 'monospace', letterSpacing: 2 }]}
          />

          <Text style={styles.label}>設定密碼（至少 6 個字）</Text>
          <TextInput
            testID="activate-pw"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="密碼"
            placeholderTextColor={COLORS.textDisabled}
            style={styles.input}
          />

          <Text style={styles.label}>再打一次密碼</Text>
          <TextInput
            testID="activate-pw-confirm"
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry
            placeholder="密碼"
            placeholderTextColor={COLORS.textDisabled}
            style={styles.input}
          />

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={12} color="#8A3F3F" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            testID="activate-submit"
            onPress={submit}
            disabled={busy}
            style={[styles.primaryBtn, busy && { opacity: 0.5 }]}
          >
            {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>啟用 · 開始用</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgApp },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, alignSelf: 'flex-start' },
  backText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  sub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: SPACING.lg },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: COLORS.bgInput,
    borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.bgCard,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FDECEC', borderRadius: RADIUS.sm, padding: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: '#8A3F3F', marginTop: SPACING.md,
  },
  errorText: { fontSize: 12, color: '#8A3F3F', flex: 1 },
  primaryBtn: {
    backgroundColor: '#7B5B9F', borderRadius: RADIUS.pill,
    paddingVertical: 14, alignItems: 'center', marginTop: SPACING.lg,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
