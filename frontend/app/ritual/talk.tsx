import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
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
  typingTierHint,
} from '@/src/components/typing-rainbow-bowl';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

export default function RitualTalkScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const diaryText = useRitualStore((s) => s.diaryText);
  const setDiaryText = useRitualStore((s) => s.setDiaryText);
  const setCheckInType = useRitualStore((s) => s.setCheckInType);
  const w = wordingFor(ageGroup);

  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;
  const count = diaryText.trim().length;
  const hint = useMemo(() => typingTierHint(count), [count]);

  const goCustomize = () => router.push('/ritual/customize');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            testID="ritual-talk-back"
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
            <TypingRainbowBowl emotion={emotion} charCount={count} size={140} />
            <View style={styles.speech}>
              <Text style={styles.speechText}>{w.talk_speech}</Text>
            </View>
          </View>

          {emotion && (
            <Text style={styles.gotBowl} testID="talk-got-bowl">
              {w.talk_got_bowl(emotion.label)}
            </Text>
          )}

          <Text style={styles.title}>{w.talk_title(emotion?.label || '碗')}</Text>

          <TextInput
            testID="talk-textarea"
            value={diaryText}
            onChangeText={setDiaryText}
            placeholder={w.talk_placeholder}
            placeholderTextColor={COLORS.textDisabled}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <Text testID="talk-tier-progress" style={styles.progress}>
            🌈 已寫 {count} 字 · {hint}
          </Text>

          <Pressable
            testID="talk-submit-btn"
            onPress={() => {
              setCheckInType('full');
              goCustomize();
            }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{w.talk_submit}</Text>
          </Pressable>

          <Pressable
            testID="talk-hug-only-btn"
            onPress={() => {
              setCheckInType('hug_only');
              setDiaryText('');
              goCustomize();
            }}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{w.talk_hug}</Text>
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
  gotBowl: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
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
  progress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
