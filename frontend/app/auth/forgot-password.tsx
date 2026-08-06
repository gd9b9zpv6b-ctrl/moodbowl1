/**
 * Auth · Forgot password screen.
 * Two-step flow · both in the same screen:
 *   Step 1 · Enter email → Supabase Auth emails a recovery OTP.
 *   Step 2 · Verify OTP → update the authenticated user's password.
 */
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import { supabase } from '@/src/lib/supabase-client';

type Step = 'request' | 'verify';

export default function ForgotPassword() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setError(null);
    setInfo(null);
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('請輸入正確嘅 email');
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: Linking.createURL('/auth/forgot-password'),
      });
      if (authError) throw authError;
      setInfo('如果呢個 email 有帳戶 · 我哋已經寄咗驗證碼過去 · 記得望埋垃圾郵件');
      setStep('verify');
    } catch {
      setError('出咗少少問題 · 過陣再試');
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setInfo(null);
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: Linking.createURL('/auth/forgot-password'),
        },
      );
      if (authError) throw authError;
      setInfo('已經再寄一次 · 慢慢睇下 inbox');
    } catch {
      setError('暫時寄唔到 · 過陣再試');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError(null);
    setInfo(null);
    const e = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) { setError('驗證碼係 6 位數字'); return; }
    if (newPw.length < 6) { setError('新密碼至少要 6 個字'); return; }
    if (newPw !== confirmPw) { setError('兩次密碼唔一樣'); return; }
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: e,
        token: cleanOtp,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) throw updateError;
      const currentUser = await refreshUser();
      // Route to correct home based on role
      const routes: Record<string, string> = {
        student: '/(tabs)',
        teacher: '/teacher-dashboard',
        counsellor: '/counsellor-panel',
        parent: '/parent-home',
        school_admin: '/school-admin',
      };
      const target = routes[currentUser?.role || 'student'] || '/(tabs)';
      router.replace(target as never);
    } catch {
      setError('驗證碼唔啱或者已經過期 · 可以再寄一次');
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
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="forgot-back">
            <Feather name="chevron-left" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>

          <Text style={styles.title}>🔐 忘記密碼</Text>
          <Text style={styles.sub}>
            {step === 'request'
              ? '輸入你註冊嗰陣用嘅 email · 我哋會寄一個 6 位驗證碼俾你。'
              : `驗證碼已寄去 ${email} · 15 分鐘內有效。`}
          </Text>

          {step === 'request' && (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="forgot-email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textDisabled}
                style={styles.input}
              />

              {error && <ErrorLine text={error} />}
              {info && <InfoLine text={info} />}

              <Pressable
                testID="forgot-send-otp"
                onPress={requestOtp}
                disabled={busy || !email}
                style={[styles.primaryBtn, (busy || !email) && { opacity: 0.5 }]}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>寄送驗證碼</Text>}
              </Pressable>
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={styles.label}>6 位驗證碼</Text>
              <TextInput
                testID="forgot-otp"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={COLORS.textDisabled}
                maxLength={6}
                style={[styles.input, { fontFamily: 'monospace', letterSpacing: 8, textAlign: 'center', fontSize: 22 }]}
              />

              <Text style={styles.label}>新密碼（至少 6 個字）</Text>
              <TextInput
                testID="forgot-new-pw"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                placeholder="新密碼"
                placeholderTextColor={COLORS.textDisabled}
                style={styles.input}
              />

              <Text style={styles.label}>再打一次新密碼</Text>
              <TextInput
                testID="forgot-confirm-pw"
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                placeholder="新密碼"
                placeholderTextColor={COLORS.textDisabled}
                style={styles.input}
              />

              {error && <ErrorLine text={error} />}
              {info && <InfoLine text={info} />}

              <Pressable
                testID="forgot-reset-submit"
                onPress={resetPassword}
                disabled={busy}
                style={[styles.primaryBtn, busy && { opacity: 0.5 }]}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>重設密碼 · 登入</Text>}
              </Pressable>

              <View style={styles.resendRow}>
                <Text style={styles.resendHint}>冇收到 email?</Text>
                <Pressable onPress={resendOtp} disabled={busy}>
                  <Text style={styles.resendLink}>重新寄送</Text>
                </Pressable>
                <Text style={styles.resendHint}>·</Text>
                <Pressable
                  onPress={() => {
                    setStep('request');
                    setOtp('');
                    setNewPw('');
                    setConfirmPw('');
                    setError(null);
                    setInfo(null);
                  }}
                  disabled={busy}
                >
                  <Text style={styles.resendLink}>改 email</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <View style={styles.errorBox}>
      <Feather name="alert-circle" size={12} color="#8A3F3F" />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}
function InfoLine({ text }: { text: string }) {
  return (
    <View style={styles.infoBox}>
      <Feather name="mail" size={12} color="#4E7962" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
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
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EAF2EE', borderRadius: RADIUS.sm, padding: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: '#4E7962', marginTop: SPACING.md,
  },
  infoText: { fontSize: 12, color: '#3F5A4D', flex: 1, lineHeight: 17 },
  primaryBtn: {
    backgroundColor: '#7B5B9F', borderRadius: RADIUS.pill,
    paddingVertical: 14, alignItems: 'center', marginTop: SPACING.lg,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  resendRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.lg, flexWrap: 'wrap',
  },
  resendHint: { fontSize: 12, color: COLORS.textSecondary },
  resendLink: { fontSize: 12, fontWeight: '700', color: '#7B5B9F', textDecorationLine: 'underline' },
});
