import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  /**
   * Optional title shown above the two cards.
   */
  title?: string;
  /**
   * Optional inline style so this can also render inside padded containers.
   */
  compact?: boolean;
};

/**
 * Two side-by-side CTA cards: 尋求幫助 · 行出去.
 * Extracted so it can appear on both the Home tab (below emotions) and
 * the Calendar tab (below the day summary).
 */
export function SupportCtaRow({ title, compact }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.wrap, compact && { marginTop: SPACING.md }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.row}>
        <Pressable
          testID="cta-help"
          style={[styles.card, { backgroundColor: '#FFE4E4' }]}
          onPress={() => router.push('/help')}
        >
          <View style={[styles.icon, { backgroundColor: '#FFCECE' }]}>
            <Feather name="life-buoy" size={20} color="#E86A6A" />
          </View>
          <Text style={styles.cardTitle}>尋求幫助</Text>
          <Text style={styles.cardSub}>熱線 · 專業人士</Text>
        </Pressable>
        <Pressable
          testID="cta-activities"
          style={[styles.card, { backgroundColor: COLORS.primaryLight }]}
          onPress={() => router.push('/activities')}
        >
          <View style={[styles.icon, { backgroundColor: COLORS.primary }]}>
            <Feather name="sun" size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.cardTitle}>行出去 · 探索</Text>
          <Text style={styles.cardSub}>感受下呢個世界</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  card: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
