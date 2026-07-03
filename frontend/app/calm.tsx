import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CALM_TECHNIQUES, CalmTechnique } from '@/src/constants/calm-techniques';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

// Breathing pulse: 4s in · 2s hold · 6s out (a soft 4-2-6 rhythm)
function BreathingDot() {
  const scale = useRef(new Animated.Value(0.5)).current;
  const [phase, setPhase] = useState<'吸氣' | '停' | '呼氣'>('吸氣');

  useEffect(() => {
    let mounted = true;
    const run = () => {
      // Inhale (4s)
      if (mounted) setPhase('吸氣');
      Animated.timing(scale, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        // Hold (2s)
        if (!mounted) return;
        setPhase('停');
        setTimeout(() => {
          if (!mounted) return;
          // Exhale (6s)
          setPhase('呼氣');
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 6000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            if (mounted) run();
          });
        }, 2000);
      });
    };
    run();
    return () => {
      mounted = false;
    };
  }, [scale]);

  return (
    <View style={styles.breathWrap}>
      <View style={styles.breathOuter}>
        <Animated.View
          style={[
            styles.breathInner,
            { transform: [{ scale }] },
          ]}
        />
      </View>
      <Text style={styles.breathLabel}>{phase}</Text>
      <Text style={styles.breathSub}>跟住個圈嘅節奏 · 呼吸慢慢就會定返</Text>
    </View>
  );
}

function TechniqueCard({ t }: { t: CalmTechnique }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      testID={`calm-${t.key}`}
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.color },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardEmojiWrap, { backgroundColor: t.accent + '55' }]}>
          <Text style={styles.cardEmoji}>{t.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t.title}</Text>
          <Text style={styles.cardSubtitle}>{t.subtitle}</Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={11} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{t.duration}</Text>
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={COLORS.textSecondary}
        />
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.stepsWrap}>
            {t.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: t.accent }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={styles.scienceBox}>
            <Feather name="info" size={13} color={t.accent} />
            <Text style={styles.scienceText}>{t.science}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function Calm() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="calm-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>平復情緒 · 小錦囊</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>深呼吸 · 慢慢嚟</Text>
          <Text style={styles.heroSub}>
            覺得情緒好激動、好想爆嗰陣，揀其中一樣試吓。{'\n'}
            冇一樣係「唔啱」嘅 —— 適合你嗰下就係啱嘅。
          </Text>
        </View>

        <BreathingDot />

        <Text style={styles.sectionTitle}>五個溫柔嘅小方法</Text>

        {CALM_TECHNIQUES.slice(0, 5).map((t) => (
          <TechniqueCard key={t.key} t={t} />
        ))}

        <Pressable
          testID="calm-more-btn"
          onPress={() => router.push('/calm-more')}
          style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.moreIcon}>
            <Feather name="grid" size={20} color={COLORS.bgCard} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.moreTitle}>睇多啲 · 分情況揀</Text>
            <Text style={styles.moreSub}>喺屋企 / 返工 / 訓唔到 · 唔同場合有唔同方法</Text>
          </View>
          <Feather name="chevron-right" size={22} color={COLORS.textPrimary} />
        </Pressable>

        <View style={styles.footerNote}>
          <Feather name="heart" size={13} color="#8A7B6B" />
          <Text style={styles.footerNoteText}>
            <Text style={styles.footerBold}>如果情緒真係好難捱 · </Text>
            打去「情緒通」熱線 <Text style={styles.phone}>18111</Text> 有人聽你講，24 小時免費。
          </Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF7F2' },
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
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  hero: {
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  breathWrap: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  breathOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#EEE0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#C7A6D1',
  },
  breathLabel: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  breathSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
  cardBody: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,49,66,0.08)',
  },
  stepsWrap: { gap: SPACING.sm },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.bgCard,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  scienceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  scienceText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF5E6',
    marginTop: SPACING.lg,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#7A5C3F',
    lineHeight: 18,
  },
  footerBold: { fontWeight: '700', color: '#8A7B6B' },
  phone: { fontWeight: '800', color: '#E86A6A' },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#E4E9F5',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  moreIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: '#8FA5D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  moreSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
