import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1533158388470-9a56699990c6?crop=entropy&cs=srgb&fm=jpg&w=800&q=70',
        }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={30}
      />
      <LinearGradient
        colors={['rgba(249,248,246,0.4)', 'rgba(249,248,246,0.95)']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Feather name="heart" size={40} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.title} testID="welcome-title">
            MoodBowl
          </Text>
          <Text style={styles.subtitle} testID="welcome-subtitle">
            一個溫柔嘅小空間{'\n'}一日一日 慢慢感受自己
          </Text>

          <View style={styles.actions}>
            <Pressable
              testID="welcome-signup-btn"
              style={styles.primaryBtn}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.primaryBtnText}>開始</Text>
            </Pressable>
            <Pressable
              testID="welcome-login-btn"
              style={styles.secondaryBtn}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.secondaryBtnText}>我已經有帳戶</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgMain },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  actions: { marginTop: SPACING.xxl, gap: SPACING.sm },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '500' },
});
