import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { RitualDiaryFooter } from '@/src/components/ritual-diary-escape';
import { EMOTIONS } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualAllScreen() {
  const router = useRouter();
  const setBowl = useRitualStore((s) => s.setBowl);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-all-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>全部心情碗</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {EMOTIONS.map((emotion) => (
            <Pressable
              key={emotion.key}
              testID={`bowl-all-${emotion.key}`}
              onPress={() => {
                setBowl(emotion.key);
                router.push('/ritual/talk');
              }}
              style={[styles.card, { backgroundColor: emotion.color + '4D' }]}
            >
              <EmotionVisual emotion={emotion} size={64} radius={RADIUS.md} />
              <Text style={styles.label} numberOfLines={1}>
                {emotion.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <RitualDiaryFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  card: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    gap: 4,
  },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
});
