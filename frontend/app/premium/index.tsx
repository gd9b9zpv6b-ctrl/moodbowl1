import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

const BENEFITS = [
  { icon: 'lock', title: '密碼保護嘅秘密日記', desc: '為個人日記加設 4 位數字密碼,只有你自己睇到' },
  { icon: 'grid', title: '解鎖更多飯碗系列', desc: '海洋朋友 · 森林夥伴 · 雲朵樂園… 隨時換心情' },
  { icon: 'droplet', title: '自訂日記風格', desc: '背景色 · 字型 · 字體大小 · 顏色,寫得舒服啲' },
];

export default function Premium() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const doUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.post<User>('/premium/upgrade', { plan: 'lifetime' });
      await refreshUser();
    } catch {
      // ignore
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="premium-back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} testID="premium-title">
          MoodBowl 溫柔會員
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="heart" size={32} color="#E86A6A" />
          </View>
          <Text style={styles.heroTitle}>俾自己一個更舒服嘅小天地</Text>
          <Text style={styles.heroSub}>
            加入溫柔會員 · 解鎖更多自我照顧嘅工具
          </Text>
          {user?.is_premium && (
            <View style={styles.badge} testID="premium-active">
              <Feather name="check-circle" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>你已經係溫柔會員 · 多謝支持</Text>
            </View>
          )}
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Feather name={b.icon as any} size={18} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {user?.is_premium ? (
          <>
            <Text style={styles.sectionTitle}>會員專屬設定</Text>
            <Pressable
              testID="premium-link-pin"
              style={styles.linkRow}
              onPress={() => router.push('/premium/pin')}
            >
              <View style={[styles.linkIcon, { backgroundColor: '#FFE4E4' }]}>
                <Feather name="lock" size={18} color="#E86A6A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>秘密日記密碼</Text>
                <Text style={styles.linkHint}>
                  {user.has_secret_pin ? '已設定 · 撳一下更改' : '設定 4 位數字密碼'}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
            </Pressable>
            <Pressable
              testID="premium-link-style"
              style={styles.linkRow}
              onPress={() => router.push('/premium/diary-style')}
            >
              <View style={[styles.linkIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Feather name="droplet" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>自訂日記風格</Text>
                <Text style={styles.linkHint}>背景 · 字型 · 顏色 · 大細</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
            </Pressable>
            <Pressable
              testID="premium-link-packs"
              style={styles.linkRow}
              onPress={() => router.push('/premium/icon-packs')}
            >
              <View style={[styles.linkIcon, { backgroundColor: '#FFC8DD' }]}>
                <Feather name="grid" size={18} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>飯碗系列</Text>
                <Text style={styles.linkHint}>
                  依家使用緊: {user.active_icon_pack === 'classic' ? '經典飯碗' : user.active_icon_pack}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
            </Pressable>
          </>
        ) : (
          <Pressable
            testID="premium-upgrade-btn"
            style={[styles.upgradeBtn, upgrading && { opacity: 0.6 }]}
            onPress={doUpgrade}
            disabled={upgrading}
          >
            {upgrading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Feather name="star" size={18} color={COLORS.textPrimary} />
                <Text style={styles.upgradeText}>解鎖溫柔會員</Text>
              </>
            )}
          </Pressable>
        )}

        <Text style={styles.footer}>
          {user?.is_premium
            ? '你嘅支持,幫我哋陪更多人。多謝 🌿'
            : '(而家係測試版 · 撳制即時解鎖 · 之後會加入真實付款)'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  hero: {
    backgroundColor: '#FFE4E4', borderRadius: RADIUS.lg, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  heroIcon: {
    width: 68, height: 68, borderRadius: RADIUS.pill, backgroundColor: '#FFCECE',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center', lineHeight: 20 },
  badge: {
    marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  badgeText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 12 },
  benefits: { gap: SPACING.md, marginBottom: SPACING.lg },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
  },
  benefitIcon: {
    width: 44, height: 44, borderRadius: RADIUS.pill, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  benefitDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, height: 56, borderRadius: RADIUS.pill, marginTop: SPACING.md,
  },
  upgradeText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.6, marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  linkRow: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.md,
  },
  linkIcon: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  linkTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  linkHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  footer: {
    marginTop: SPACING.lg, color: COLORS.textSecondary, textAlign: 'center',
    fontSize: 13, lineHeight: 20,
  },
});
