import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
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

import {
  TypingRainbowBowl,
  TypingRainbowProgress,
} from '@/src/components/typing-rainbow-bowl';
import { emotionForBowlKey } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/**
 * Same as ritual talk · skipped pick uses 樹洞 so write + decorate still have a bowl.
 */
export default function QuickDiaryScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const diaryText = useRitualStore((s) => s.diaryText);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const setDiaryText = useRitualStore((s) => s.setDiaryText);
  const setCheckInType = useRitualStore((s) => s.setCheckInType);
  const ensureStarted = useRitualStore((s) => s.ensureStarted);
  const ensureBowl = useRitualStore((s) => s.ensureBowl);
  const w = wordingFor(ageGroup);

  const count = diaryText.trim().length;
  const emotion = emotionForBowlKey(selectedBowlKey);

  useEffect(() => {
    ensureBowl();
  }, [ensureBowl]);

  const goCustomize = () => {
    ensureStarted();
    ensureBowl();
    router.push('/ritual/customize');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            testID="quick-diary-back"
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="返去"
          >
            <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bowlBlock}>
            <View testID="quick-diary-bowl">
              <TypingRainbowBowl emotion={emotion} charCount={count} size={140} />
            </View>
            <View style={styles.speech}>
              <Text style={styles.speechText}>{w.talk_solo_speech}</Text>
            </View>
          </View>

          <Text style={styles.title}>{w.talk_solo_title}</Text>

          <TextInput
            testID="quick-diary-note"
            value={diaryText}
            onChangeText={setDiaryText}
            placeholder={w.talk_placeholder}
            placeholderTextColor={COLORS.textDisabled}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <TypingRainbowProgress charCount={count} testID="quick-diary-tier-progress" />

          <Pressable
            testID="quick-diary-continue"
            onPress={() => {
              setCheckInType('full');
              goCustomize();
            }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{w.talk_solo_submit}</Text>
          </Pressable>

          <Pressable
            testID="quick-diary-hug"
            onPress={() => {
              setCheckInType('hug_only');
              setDiaryText('');
              goCustomize();
            }}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{w.talk_solo_hug}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  bowlBlock: { alignItems: 'center', marginBottom: SPACING.md },
  speech: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  speechText: { fontSize: 13, color: COLORS.textSecondary },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  input: {
    minHeight: 160,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  secondary: {
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
});
