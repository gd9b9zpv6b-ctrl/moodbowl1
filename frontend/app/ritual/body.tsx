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
import { RitualDiaryEscape } from '@/src/components/ritual-diary-escape';
import {
  BODY_CHIPS,
  type BodyChipKey,
  type BodyRegionKey,
} from '@/src/constants/body-chips';
import { SOUP_BY_KEY } from '@/src/constants/soups';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

/** Speech mirrors the chip description · same meaning as floating decor. */
const GAG_LINES: Partial<Record<BodyChipKey, string>> = {
  face_flush: '面紅紅 · 冒蒸氣好似蒸籠!',
  jaw_clench: '牙關咬緊緊…',
  teary: '眼濕濕 · 有水珠!',
  eyelids_heavy: '眼皮好重 · 想瞓!',
  eyes_bright: '眼睛發亮 · 閃閃!',
  head_heavy: '頭好重 · 壓住石頭!',
  brain_blank: '腦海空白 · 濛查查!',
  chest_warm: '胸口暖暖 · 亮起星!',
  chest_tight: '胸口悶悶 · 像壓住石!',
  heart_fast: '心跳好快 · 小兔砰砰跳!',
  breath_fast: '呼吸好急 · 呼哧呼哧!',
  heat_rising: '熱氣上湧 · 衝上腦!',
  throat_tight: '喉嚨哽哽 · 卡住石!',
  belly_full: '肚仔翻滾 · 蝴蝶亂飛!',
  no_appetite: '冇胃口 · 碗都唔想見!',
  need_toilet: '突然好想去廁所!',
  fists_clench: '拳頭硬邦邦 · 捏緊!',
  sweaty_palms: '手心濕漉漉 · 出汗!',
  shaky: '手腳震震!',
  soft_hands: '手軟軟 · 似拉麵!',
  shoulders_heavy: '膊頭好重 · 背住書包!',
  body_tense: '成身繃緊 · 像拉滿弓!',
  want_jump: '腳仔想跳跳紮!',
  smile_wide: '嘴角忍唔住笑!',
  curled_up: '想縮埋一團!',
  floaty: '輕飄飄 · 差啲飛起!',
};

const REGION_PROMPTS: Record<BodyRegionKey, string> = {
  head: '戳碗頭 · 面／眼／嘴／喉有咩感覺?',
  chest: '戳心口 · 心跳、呼吸定膊頭?',
  belly: '戳肚仔 · 肚有咩感覺?',
  hands: '戳小手 · 出汗定捏緊?',
  whole: '戳雙腳／全身 · 想跳定想縮?',
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
        <View style={styles.headerRight}>
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
          <RitualDiaryEscape />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{w.body_title}</Text>
        <Text style={styles.clarify}>{w.body_clarify}</Text>

        {drink && (
          <View style={styles.drinkChip} testID="body-drink-context">
            <Text style={styles.drinkEmoji}>{drink.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.drinkLabel}>
                呢杯「{drink.label}」入面 · 戳碗仔睇反應
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
            <Text style={styles.pickedLabel}>碗仔感覺到：</Text>
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
  skip: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'right' },
  headerRight: { alignItems: 'flex-end', gap: 2, maxWidth: 110 },
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
