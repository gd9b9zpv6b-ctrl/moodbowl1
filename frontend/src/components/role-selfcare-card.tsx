// Shared self-care CTA card for role dashboards (teacher/counsellor/parent/school-admin).
// Reminds adults using the app for others that they also deserve to check in with themselves.
// Tapping opens the adult's OWN personal diary space (their own account · not a student's).

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { RoleStorage } from '@/src/lib/role-storage';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  // Palette tint that matches the parent dashboard's overall color scheme.
  bg: string;
  border: string;
  bowlBg?: string;
  // Optional per-role copy override (fallback shown otherwise).
  title?: string;
  subtitle?: string;
  bowlKey?: string;
  testID?: string;
};

const DEFAULT_BOWL = 'happy';
const ADULT_COPY = wordingFor('adult');

export function RoleSelfCareCard({
  bg,
  border,
  bowlBg = '#FFFFFF',
  title = ADULT_COPY.selfcare_title,
  subtitle = ADULT_COPY.selfcare_subtitle,
  bowlKey = DEFAULT_BOWL,
  testID = 'role-selfcare',
}: Props) {
  const router = useRouter();
  const setAgeGroup = useRitualStore((s) => s.setAgeGroup);
  const ritualReset = useRitualStore((s) => s.reset);
  const bowl = EMOTION_BY_KEY[bowlKey] || EMOTION_BY_KEY[DEFAULT_BOWL];
  return (
    <Pressable
      testID={testID}
      onPress={async () => {
        await RoleStorage.set('student');
        ritualReset();
        setAgeGroup('adult');
        router.replace('/');
      }}
      style={[styles.card, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={[styles.bowlWrap, { backgroundColor: bowlBg }]}>
        {bowl && <EmotionVisual emotion={bowl} size={48} radius={RADIUS.md} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
  },
  bowlWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 15 },
});
