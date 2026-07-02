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

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('密碼至少要 6 個字元');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim() || undefined);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable testID="register-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </Pressable>

          <Text style={styles.title} testID="register-title">
            建立你嘅小天地
          </Text>
          <Text style={styles.subtitle}>
            一個屬於你嘅小小角落{'\n'}只有你睇到,除非你主動分享。
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>你嘅名 (可以唔填)</Text>
            <TextInput
              testID="register-name-input"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="點稱呼你好呢?"
              placeholderTextColor={COLORS.textDisabled}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>電郵</Text>
            <TextInput
              testID="register-email-input"
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
              testID="register-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="至少 6 個字元"
              placeholderTextColor={COLORS.textDisabled}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error && (
            <Text testID="register-error" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable
            testID="register-submit-btn"
            disabled={loading || !email || !password}
            style={[styles.primaryBtn, (loading || !email || !password) && { opacity: 0.6 }]}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>建立帳戶</Text>
            )}
          </Pressable>

          <Pressable
            testID="register-goto-login-btn"
            onPress={() => router.replace('/auth/login')}
            style={{ marginTop: SPACING.md, alignSelf: 'center' }}
          >
            <Text style={styles.link}>
              已經有帳戶?<Text style={{ fontWeight: '700' }}> 登入</Text>
            </Text>
          </Pressable>
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
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
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
});
