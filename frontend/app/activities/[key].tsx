import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTIVITY_BY_KEY } from '@/src/constants/activities';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function ActivityDetail() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const activity = key ? ACTIVITY_BY_KEY[key] : undefined;

  if (!activity) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>搵唔到呢個活動</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    );
  }

  const openRegister = async () => {
    if (!activity.register_url) return;
    try {
      const canOpen = await Linking.canOpenURL(activity.register_url);
      if (canOpen) {
        await Linking.openURL(activity.register_url);
      } else if (Platform.OS === 'web') {
        // eslint-disable-next-line no-restricted-globals
        window.open(activity.register_url, '_blank');
      } else {
        Alert.alert('打唔開連結', '請稍後再試');
      }
    } catch {
      Alert.alert('打唔開連結', '請稍後再試');
    }
  };

  const bg = activity.color + '55';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            testID="activity-detail-back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: activity.color + '99' }]}>
            <Text style={styles.heroEmoji}>{activity.emoji || '✨'}</Text>
            <Text style={styles.heroTitle}>{activity.title}</Text>
            {activity.subtitle && (
              <Text style={styles.heroSubtitle}>{activity.subtitle}</Text>
            )}
          </View>

          {/* Long description */}
          {activity.long_desc && (
            <View style={styles.card}>
              <Text style={styles.body}>{activity.long_desc}</Text>
            </View>
          )}

          {/* Highlights */}
          {activity.bullets && activity.bullets.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>課程亮點</Text>
              {activity.bullets.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather name="check-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dates + Time */}
          {(activity.dates || activity.time) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>課訊</Text>
              {activity.dates && (
                <View style={styles.dateGrid}>
                  {activity.dates.map((d, i) => (
                    <View key={i} style={styles.datePill}>
                      <Feather name="calendar" size={12} color={COLORS.primary} />
                      <Text style={styles.datePillText}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
              {activity.time && (
                <View style={styles.metaRow}>
                  <Feather name="clock" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{activity.time}</Text>
                </View>
              )}
              {activity.location && (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{activity.location}</Text>
                </View>
              )}
            </View>
          )}

          {/* Prices */}
          {activity.prices && activity.prices.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>學費優惠</Text>
              {activity.prices.map((p, i) => (
                <View key={i} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{p.label}</Text>
                  <Text style={styles.priceAmount}>{p.amount}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {activity.notes && activity.notes.length > 0 && (
            <View style={[styles.card, styles.notesCard]}>
              <View style={styles.notesHeader}>
                <Feather name="info" size={14} color="#B8825B" />
                <Text style={styles.notesTitle}>重要須知</Text>
              </View>
              {activity.notes.map((n, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.noteBullet}>·</Text>
                  <Text style={styles.notesText}>{n}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer quote */}
          {activity.footer_quote && (
            <Text style={styles.footerQuote}>「{activity.footer_quote}」</Text>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky CTA */}
        {activity.register_url && (
          <View style={styles.ctaBar}>
            <Pressable
              testID="activity-register-btn"
              onPress={openRegister}
              style={styles.ctaBtn}
            >
              <Feather name="external-link" size={18} color={COLORS.textPrimary} />
              <Text style={styles.ctaText}>{activity.cta_label || '立即登記'}</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.sm,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  datePillText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgInput,
  },
  priceLabel: { fontSize: 14, color: COLORS.textPrimary },
  priceAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  notesCard: {
    backgroundColor: '#FEF5E6',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#B8825B', letterSpacing: 0.5 },
  noteBullet: { fontSize: 16, color: '#B8825B', fontWeight: '700' },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#7A5C3F',
    lineHeight: 20,
  },
  footerQuote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: RADIUS.pill,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
