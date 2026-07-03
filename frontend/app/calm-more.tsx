import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CALM_SITUATIONS,
  CalmSituation,
  CalmTechnique,
  TECHNIQUE_BY_KEY,
} from '@/src/constants/calm-techniques';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

function TechniqueMini({ t }: { t: CalmTechnique }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      testID={`more-tech-${t.key}`}
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [
        styles.mini,
        { backgroundColor: t.color },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.miniHeader}>
        <View style={[styles.miniEmojiWrap, { backgroundColor: t.accent + '55' }]}>
          <Text style={styles.miniEmoji}>{t.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniTitle}>{t.title}</Text>
          <Text style={styles.miniSubtitle}>{t.subtitle}</Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={10} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{t.duration}</Text>
          </View>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textSecondary}
        />
      </View>
      {open && (
        <View style={styles.miniBody}>
          {t.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: t.accent }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
          <View style={styles.scienceBox}>
            <Feather name="info" size={12} color={t.accent} />
            <Text style={styles.scienceText}>{t.science}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function SituationCard({ s }: { s: CalmSituation }) {
  const [open, setOpen] = useState(false);
  const techs = s.techniqueKeys.map((k) => TECHNIQUE_BY_KEY[k]).filter(Boolean);

  return (
    <View style={[styles.sitCard, { backgroundColor: s.color }]}>
      <Pressable
        testID={`sit-${s.key}`}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.sitHeader, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.sitEmoji}>{s.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.sitTitle}>{s.title}</Text>
          <Text style={styles.sitSubtitle}>{s.subtitle}</Text>
          <Text style={styles.sitCount}>
            {techs.length} 個建議 · 撳一下{open ? '收埋' : '睇'}
          </Text>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={COLORS.textPrimary}
        />
      </Pressable>
      {open && (
        <View style={styles.sitBody}>
          {techs.map((t) => (
            <TechniqueMini key={t.key} t={t} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function CalmMore() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="calm-more-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>分情況揀 · 錦囊</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>睇下邊個場合啱你</Text>
          <Text style={styles.heroSub}>
            唔同時間、唔同地方 · 適合嘅方法都唔一樣。{'\n'}
            揀返啱你嗰下處境 · 睇下有咩可以試。
          </Text>
        </View>

        {CALM_SITUATIONS.map((s) => (
          <SituationCard key={s.key} s={s} />
        ))}

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
  hero: { marginBottom: SPACING.lg },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  sitCard: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  sitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  sitEmoji: { fontSize: 34 },
  sitTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  sitSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sitCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    opacity: 0.6,
    marginTop: 4,
  },
  sitBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  mini: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    backgroundColor: COLORS.bgCard,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  miniEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniEmoji: { fontSize: 20 },
  miniTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  miniSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metaText: { fontSize: 10, color: COLORS.textSecondary },
  miniBody: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,49,66,0.06)',
    gap: SPACING.xs + 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bgCard,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  scienceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  scienceText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF5E6',
    marginTop: SPACING.md,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#7A5C3F',
    lineHeight: 18,
  },
  footerBold: { fontWeight: '700', color: '#8A7B6B' },
  phone: { fontWeight: '800', color: '#E86A6A' },
});
