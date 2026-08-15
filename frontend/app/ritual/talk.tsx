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

import { EmotionVisual } from '@/src/components/emotion-visual';
import { RitualDiaryFooter } from '@/src/components/ritual-diary-escape';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

function tierHint(n: number): string {
  if (n <= 0) return '慢慢講 · 一個字都得';
  if (n <= 10) return '開始啦 · 繼續都可以';
  if (n <= 30) return '講多咗少少 · 好好';
  if (n <= 60) return '傾得幾深 · 精靈聽緊';
  if (n <= 100) return '火花閃緊 · 你好叻';
  return '深度傾訴 · 精靈記住咗';
}

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
  const hint = useMemo(() => tierHint(count), [count]);

  const goRegulate = () => router.push('/ritual/regulate');

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
            <EmotionVisual emotion={emotion} size={140} radius={RADIUS.lg} />
            <View style={styles.speech}>
              <Text style={styles.speechText}>{w.talk_speech}</Text>
            </View>
          </View>

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

          <Text style={styles.progress}>
            🌈 已寫 {count} 字 · {hint}
          </Text>

          <Pressable
            testID="talk-submit-btn"
            onPress={() => {
              setCheckInType('full');
              goRegulate();
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
              goRegulate();
            }}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{w.talk_hug}</Text>
          </Pressable>
        </ScrollView>
        <RitualDiaryFooter />
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
