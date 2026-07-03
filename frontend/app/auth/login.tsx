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
import { useAuth } from '@/src/lib/auth-context';

const DEMO_ACCOUNTS: { role: string; email: string; label: string; emoji: string; color: string }[] = [
  { role: 'student',      email: 'student@demo.moodful.app',    label: '學生', emoji: '🎒', color: '#B9DBBC' },
  { role: 'teacher',      email: 'teacher@demo.moodful.app',    label: '班主任', emoji: '👩‍🏫', color: '#F0AE64' },
  { role: 'counsellor',   email: 'counsellor@demo.moodful.app', label: '輔導老師', emoji: '💚', color: '#7DBEE8' },
  { role: 'parent',       email: 'parent@demo.moodful.app',     label: '家長', emoji: '👨‍👩‍👧', color: '#E499B4' },
  { role: 'school_admin', email: 'school@demo.moodful.app',     label: '校方管理', emoji: '🏫', color: '#C7A6D1' },
];
const DEMO_PASSWORD = 'demo1234';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setError(null);
    setDemoLoading(acc.role);
    try {
      await login(acc.email, DEMO_PASSWORD);
      // Route to the correct home path per role
      const routes: Record<string, string> = {
        student:      '/(tabs)',
        teacher:      '/teacher-dashboard',
        counsellor:   '/counsellor-panel',
        parent:       '/parent-home',
        school_admin: '/school-admin',
      };
      router.replace((routes[acc.role] || '/(tabs)') as never);
    } catch (e: any) {
      setError(e?.message || '示範帳戶登入失敗 · 請試下再啟動 backend');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable testID="login-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </Pressable>

          <Text style={styles.title} testID="login-title">
            歡迎返嚟
          </Text>
          <Text style={styles.subtitle}>深呼吸一下,好開心你返嚟。</Text>

          <View style={styles.field}>
            <Text style={styles.label}>電郵</Text>
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>密碼</Text>
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="你嘅密碼"
              placeholderTextColor={COLORS.textDisabled}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error && (
            <Text testID="login-error" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable
            testID="login-submit-btn"
            disabled={loading || !email || !password}
            style={[styles.primaryBtn, (loading || !email || !password) && { opacity: 0.6 }]}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>登入</Text>
            )}
          </Pressable>

          <Pressable
            testID="login-goto-register-btn"
            onPress={() => router.replace('/auth/register')}
            style={{ marginTop: SPACING.md, alignSelf: 'center' }}
          >
            <Text style={styles.link}>
              第一次嚟?<Text style={{ fontWeight: '700' }}> 開個帳戶</Text>
            </Text>
          </Pressable>

          {/* Demo account quick picker — 5 pre-seeded roles */}
          <View style={styles.demoDivider}>
            <View style={styles.demoDividerLine} />
            <Text style={styles.demoDividerText}>示範帳戶 · 一撳體驗</Text>
            <View style={styles.demoDividerLine} />
          </View>

          <Text style={styles.demoHint}>
            密碼統一為 <Text style={{ fontWeight: '800' }}>demo1234</Text> · 撳角色直接進入相關版面
          </Text>

          <View style={styles.demoGrid}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isLoading = demoLoading === acc.role;
              return (
                <Pressable
                  key={acc.role}
                  testID={`demo-login-${acc.role}`}
                  onPress={() => quickDemoLogin(acc)}
                  disabled={!!demoLoading}
                  style={[
                    styles.demoCard,
                    { backgroundColor: acc.color + '25', borderColor: acc.color },
                    demoLoading && demoLoading !== acc.role && { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.demoEmoji}>{acc.emoji}</Text>
                  <Text style={styles.demoLabel}>{acc.label}</Text>
                  {isLoading && <ActivityIndicator size="small" color={COLORS.textPrimary} style={{ marginTop: 4 }} />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  container: { padding: SPACING.lg, paddingTop: SPACING.md, flexGrow: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.xl },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm, letterSpacing: 0.4 },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 56,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  error: { color: COLORS.danger, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  primaryBtnText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  link: { color: COLORS.textSecondary, fontSize: 15 },

  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  demoDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  demoDividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  demoHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  demoCard: {
    width: '31%',
    minHeight: 84,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: 6,
    gap: 4,
  },
  demoEmoji: { fontSize: 22 },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
