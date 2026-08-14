import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyScanFigure } from '@/src/components/body-scan-figure';
import { ProgressDots } from '@/src/components/progress-dots';
import {
  BODY_CHIPS,
  type BodyChipKey,
  type BodyRegionKey,
} from '@/src/constants/body-chips';
import { SOUP_BY_KEY } from '@/src/constants/soups';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/** Silly one-liners when the figure reacts to a pick. */
const GAG_LINES: Partial<Record<BodyChipKey, string>> = {
  face_flush: '嘩 · 面紅到可以蒸包!',
  jaw_clench: '牙關咬到出聲呀…',
  teary: '眼眶開始發酸啦…',
  eyelids_heavy: '眼皮掛住兩個小水桶!',
  eyes_bright: '眼睛亮到似星星!',
  head_heavy: '頭頂放咗塊大石頭?',
  brain_blank: '腦入面載入緊… 404',
  chest_warm: '胸口亮起一盞小燈!',
  chest_tight: '胸口像壓住磚頭…',
  heart_fast: '有隻小兔喺度砰砰跳!',
  breath_fast: '呼哧呼哧 · 像小牛!',
  heat_rising: '熱氣衝上腦門啦!',
  throat_tight: '喉嚨卡住粒小石頭…',
  belly_full: '肚仔有蝴蝶開派對!',
  no_appetite: '碗都暫時唔想見…',
  need_toilet: '突然想衝廁所!',
  fists_clench: '拳頭變咗小石頭!',
  sweaty_palms: '手心濕漉漉黏嗒嗒!',
  shaky: '手腳開始震震!',
  soft_hands: '手軟到似拉麵!',
  shoulders_heavy: '膊頭背住成個書包!',
  body_tense: '全身繃到似拉滿弓!',
  want_jump: '腳裝咗彈簧 · 跳!',
  smile_wide: '嘴角偷偷向上爬!',
  curled_up: '想縮成一隻小貝殼…',
  floaty: '輕飄飄 · 差啲飛起!',
};

const REGION_PROMPTS: Record<BodyRegionKey, string> = {
  head: '撳頭 · 面同腦而家點?',
  chest: '撳胸口 · 心跳定發熱?',
  belly: '撳肚仔 · 有蝴蝶定石頭?',
  hands: '撳手 · 出汗定捏拳?',
  whole: '撳腳 · 想跳定想縮?',
};

export default function RitualBodyScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const toggleChip = useRitualStore((s) => s.toggleChip);
  const skipChips = useRitualStore((s) => s.skipChips);
  const [toast, setToast] = useState<string | null>(null);
  const [focusRegion, setFocusRegion] = useState<BodyRegionKey | null>('head');
  const [gagLine, setGagLine] = useState<string | null>(null);
  const w = wordingFor(ageGroup);
  const drink = soup ? SOUP_BY_KEY[soup] : null;

  const visibleChips = useMemo(() => {
    if (!focusRegion) return BODY_CHIPS;
    return BODY_CHIPS.filter((c) => c.region === focusRegion);
  }, [focusRegion]);

  const idlePrompt =
    gagLine ||
    (focusRegion ? REGION_PROMPTS[focusRegion] : w.body_vessel);

  const onToggle = (key: BodyChipKey) => {
    const wasSelected = bodyChips.includes(key);
    if (!wasSelected && bodyChips.length >= 3) {
      setToast(w.body_hint);
      setTimeout(() => setToast(null), 1600);
      return;
    }
    toggleChip(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!wasSelected) {
      const line = GAG_LINES[key] || w.chip_labels[key];
      setGagLine(line);
      setTimeout(() => setGagLine(null), 2200);
    }
  };

  const goPick = () => router.push('/ritual/pick');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-body-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <ProgressDots total={3} active={2} />
        <Pressable
          testID="ritual-body-skip"
          onPress={() => {
            skipChips();
            goPick();
          }}
          hitSlop={8}
        >
          <Text style={styles.skip}>{w.body_skip}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{w.body_title}</Text>
        <Text style={styles.clarify}>{w.body_clarify}</Text>

        {drink && (
          <View style={styles.drinkChip} testID="body-drink-context">
            <Text style={styles.drinkEmoji}>{drink.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.drinkLabel}>
                呢杯「{drink.label}」入面 · 身體有咩反應?
              </Text>
              <Text style={styles.drinkHint}>{w.body_vessel}</Text>
            </View>
          </View>
        )}

        <BodyScanFigure
          selected={bodyChips}
          focusRegion={focusRegion}
          onSelectRegion={(region) => {
            setFocusRegion(region);
            setGagLine(REGION_PROMPTS[region]);
            Haptics.selectionAsync().catch(() => {});
          }}
          idlePrompt={idlePrompt}
        />

        <View style={styles.chipPanel}>
          <Text style={styles.chipPanelTitle}>
            {focusRegion
              ? `揀「${w.region_labels[focusRegion]}」嘅感覺`
              : '揀身體感覺'}
            <Text style={styles.chipCount}> · {bodyChips.length}/3</Text>
          </Text>
          <View style={styles.chipWrap}>
            {visibleChips.map((chip) => {
              const active = bodyChips.includes(chip.key);
              return (
                <Pressable
                  key={chip.key}
                  testID={`body-chip-${chip.key}`}
                  onPress={() => onToggle(chip.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  {active && (
                    <Feather name="check" size={14} color={COLORS.textPrimary} />
                  )}
                  <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {w.chip_labels[chip.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {bodyChips.length > 0 && (
          <View style={styles.pickedRow} testID="body-picked-summary">
            <Text style={styles.pickedLabel}>杯入面而家有：</Text>
            {bodyChips.map((key) => {
              const chip = BODY_CHIPS.find((c) => c.key === key);
              return (
                <Pressable
                  key={key}
                  onPress={() => onToggle(key)}
                  style={styles.pickedChip}
                >
                  <Text style={styles.pickedEmoji}>{chip?.emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <Pressable
          testID="ritual-body-next"
          disabled={bodyChips.length < 1}
          onPress={goPick}
          style={[styles.cta, bodyChips.length < 1 && { opacity: 0.6 }]}
        >
          <Text style={styles.ctaText}>{w.body_cta}</Text>
        </Pressable>
      </ScrollView>
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
  skip: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: SPACING.sm,
  },
  clarify: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  drinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  drinkEmoji: { fontSize: 28 },
  drinkLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  drinkHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chipPanel: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipPanelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  chipCount: { fontWeight: '600', color: COLORS.textSecondary },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: COLORS.primaryLight },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  chipLabelActive: { color: COLORS.textPrimary },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  pickedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pickedChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedEmoji: { fontSize: 18 },
  toast: {
    backgroundColor: '#FEF9E7',
    borderLeftWidth: 3,
    borderLeftColor: '#B57D2A',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  toastText: { fontSize: 12, color: '#8A5F1F' },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
