import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { useResponsiveLayout } from '@/src/hooks/use-responsive-layout';

type Props = {
  /**
   * Optional title shown above the cards.
   */
  title?: string;
  /**
   * Optional inline style so this can also render inside padded containers.
   */
  compact?: boolean;
  /**
   * Hide the 平復情緒 card (used on the calm tab itself so we don't loop back).
   */
  hideCalm?: boolean;
};

/**
 * Support CTA cards: 平復情緒 · 尋求幫助 · 行出去.
 * Mobile · single column. Tablet／desktop · side-by-side row.
 */
export function SupportCtaRow({ title, compact, hideCalm }: Props) {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const stacked = !layout.isTablet;

  return (
    <View style={[styles.wrap, compact && { marginTop: SPACING.md }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.row, stacked && styles.rowStacked]}>
        {!hideCalm && (
          <Pressable
            testID="cta-calm"
            style={[styles.card, stacked && styles.cardStacked, { backgroundColor: '#EEE0F0' }]}
            onPress={() => router.push('/calm')}
          >
            <View style={[styles.icon, stacked && styles.iconStacked, { backgroundColor: '#C7A6D1' }]}>
              <Feather name="wind" size={18} color={COLORS.bgCard} />
            </View>
            <View style={stacked ? styles.cardCopy : undefined}>
              <Text style={styles.cardTitle}>平復情緒</Text>
              <Text style={styles.cardSub}>激動嗰陣試吓</Text>
            </View>
            {stacked && <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />}
          </Pressable>
        )}
        <Pressable
          testID="cta-help"
          style={[styles.card, stacked && styles.cardStacked, { backgroundColor: '#FFE4E4' }]}
          onPress={() => router.push('/help')}
        >
          <View style={[styles.icon, stacked && styles.iconStacked, { backgroundColor: '#FFCECE' }]}>
            <Feather name="life-buoy" size={18} color="#E86A6A" />
          </View>
          <View style={stacked ? styles.cardCopy : undefined}>
            <Text style={styles.cardTitle}>尋求幫助</Text>
            <Text style={styles.cardSub}>熱線 · 專業</Text>
          </View>
          {stacked && <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />}
        </Pressable>
        <Pressable
          testID="cta-activities"
          style={[styles.card, stacked && styles.cardStacked, { backgroundColor: COLORS.primaryLight }]}
          onPress={() => router.push('/activities')}
        >
          <View style={[styles.icon, stacked && styles.iconStacked, { backgroundColor: COLORS.primary }]}>
            <Feather name="sun" size={18} color={COLORS.textPrimary} />
          </View>
          <View style={stacked ? styles.cardCopy : undefined}>
            <Text style={styles.cardTitle}>行出去</Text>
            <Text style={styles.cardSub}>感受世界</Text>
          </View>
          {stacked && <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />}
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
  rowStacked: { flexDirection: 'column' },
  card: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minWidth: 0,
  },
  cardStacked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: undefined,
  },
  cardCopy: { flex: 1 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  iconStacked: {
    marginBottom: 0,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});
