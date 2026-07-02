import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOTLINES, PROVIDERS, SAFETY_DISCLAIMER } from '@/src/constants/providers';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

function formatPhone(p: string): string {
  if (p.length === 8) return `${p.slice(0, 4)} ${p.slice(4)}`;
  return p;
}

export default function Help() {
  const router = useRouter();

  const call = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  const openLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable testID="help-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} testID="help-title">
          尋求幫助
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.disclaimer} testID="help-disclaimer">
          <Feather name="alert-circle" size={18} color="#D97757" />
          <Text style={styles.disclaimerText}>{SAFETY_DISCLAIMER}</Text>
        </View>

        <Text style={styles.sectionTitle}>24 小時緊急熱線</Text>
        <Text style={styles.sectionHint}>直接撳一下號碼就會撥出</Text>
        {HOTLINES.filter((h) => h.urgent).map((h) => (
          <Pressable
            key={h.key}
            testID={`hotline-${h.key}`}
            onPress={() => call(h.phone)}
            style={[styles.hotlineCard, styles.urgentCard]}
          >
            <View style={styles.hotlineHeader}>
              <View style={[styles.iconWrap, { backgroundColor: '#FFE4E4' }]}>
                <Feather name="phone" size={20} color="#E86A6A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hotlineName}>{h.name}</Text>
                <Text style={styles.hotlineDesc}>{h.desc}</Text>
              </View>
            </View>
            <View style={styles.phoneRow}>
              <Text style={styles.phoneNumber}>{formatPhone(h.phone)}</Text>
              <View style={styles.hoursBadge}>
                <Feather name="clock" size={12} color={COLORS.textSecondary} />
                <Text style={styles.hoursText}>{h.hours}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>其他支援熱線</Text>
        {HOTLINES.filter((h) => !h.urgent).map((h) => (
          <Pressable
            key={h.key}
            testID={`hotline-${h.key}`}
            onPress={() => call(h.phone)}
            style={styles.hotlineCard}
          >
            <View style={styles.hotlineHeader}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Feather name="phone" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hotlineName}>{h.name}</Text>
                <Text style={styles.hotlineDesc}>{h.desc}</Text>
              </View>
            </View>
            <View style={styles.phoneRow}>
              <Text style={[styles.phoneNumber, { color: COLORS.textPrimary }]}>{formatPhone(h.phone)}</Text>
              <View style={styles.hoursBadge}>
                <Feather name="clock" size={12} color={COLORS.textSecondary} />
                <Text style={styles.hoursText}>{h.hours}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>註冊專業人士 / 機構</Text>
        <Text style={styles.sectionHint}>連結去官方名冊或機構網站,搵合適嘅專業幫助</Text>
        {PROVIDERS.map((p) => (
          <Pressable
            key={p.key}
            testID={`provider-${p.key}`}
            onPress={() => (p.url ? openLink(p.url) : call(p.contact))}
            style={styles.providerCard}
          >
            <View style={styles.providerHeader}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Feather name={p.url ? 'external-link' : 'phone'} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerName}>{p.name}</Text>
                <Text style={styles.providerRole}>{p.role}</Text>
              </View>
            </View>
            <Text style={styles.providerDesc}>{p.desc}</Text>
            <View style={styles.providerFooter}>
              <View style={styles.feeBadge}>
                <Feather name="tag" size={11} color={COLORS.textSecondary} />
                <Text style={styles.feeText}>{p.fee}</Text>
              </View>
              <Text style={styles.contactText}>{p.contact}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.footer}>
          你唔孤單。願你今日對自己溫柔啲 🌿
        </Text>
        <View style={{ height: SPACING.xxl }} />
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.lg },
  disclaimer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: '#FFF3E4',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  disclaimerText: { flex: 1, color: '#8B4513', fontSize: 13, lineHeight: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  sectionHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  hotlineCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  urgentCard: {
    backgroundColor: '#FFF8F8',
    borderLeftWidth: 4,
    borderLeftColor: '#E86A6A',
  },
  hotlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  hotlineDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNumber: { fontSize: 22, fontWeight: '800', color: '#E86A6A', letterSpacing: 2 },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  hoursText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  providerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  providerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  providerRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  providerDesc: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, marginBottom: SPACING.sm },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    flexShrink: 1,
  },
  feeText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  contactText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  footer: {
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
});
