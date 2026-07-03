import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiaryPaper } from '@/src/components/diary-paper';
import {
  DIARY_FONT_FAMILIES,
  DIARY_FONT_SIZES,
  DIARY_TEXT_COLORS,
  PAPER_KINDS,
  PAPER_TINTS,
} from '@/src/constants/diary-style';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, DiaryStyle, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

export default function DiaryStyleScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const initial: DiaryStyle = user?.diary_style || {};

  const [tintKey, setTintKey] = useState(initial.paper_tint || 'cream');
  const [paperKind, setPaperKind] = useState(initial.paper_kind || 'ruled');
  const [font, setFont] = useState<string | undefined>(initial.font_family);
  const [fontSize, setFontSize] = useState(initial.font_size || 20);
  const [textColor, setTextColor] = useState(initial.text_color);

  const tint = PAPER_TINTS.find((t) => t.key === tintKey) || PAPER_TINTS[0];
  const previewTextColor = textColor || (tintKey === 'night' ? '#F0EEE7' : '#2D3142');

  const persist = async (next: DiaryStyle) => {
    try {
      await api.patch<User>('/premium/settings', { diary_style: next });
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const update = (patch: DiaryStyle) => {
    const current: DiaryStyle = {
      paper_tint: tintKey,
      paper_kind: paperKind,
      font_family: font,
      font_size: fontSize,
      text_color: textColor,
    };
    const next = { ...current, ...patch };
    if (patch.paper_tint !== undefined) setTintKey(patch.paper_tint);
    if (patch.paper_kind !== undefined) setPaperKind(patch.paper_kind);
    if (patch.font_family !== undefined) setFont(patch.font_family);
    if (patch.font_size !== undefined) setFontSize(patch.font_size);
    if (patch.text_color !== undefined) setTextColor(patch.text_color);
    persist(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable testID="style-back" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>自訂日記風格</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Big diary preview */}
        <View style={[styles.previewFrame, { backgroundColor: tint.bg }]} testID="style-preview">
          {paperKind !== 'none' ? (
            <DiaryPaper
              kind={paperKind as 'ruled' | 'grid' | 'dot'}
              color={tint.line}
              spacing={34}
            >
              <View style={styles.previewInner}>
                <Text
                  style={{
                    fontFamily: font,
                    fontSize,
                    color: previewTextColor,
                    lineHeight: 34,
                  }}
                >
                  今日雖然行得慢啲{'\n'}但我都有向前行過{'\n'}讚吓自己啦 🌿
                </Text>
              </View>
            </DiaryPaper>
          ) : (
            <View style={styles.previewInner}>
              <Text
                style={{
                  fontFamily: font,
                  fontSize,
                  color: previewTextColor,
                  lineHeight: 34,
                }}
              >
                今日雖然行得慢啲{'\n'}但我都有向前行過{'\n'}讚吓自己啦 🌿
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>紙張色調</Text>
        <View style={styles.grid}>
          {PAPER_TINTS.map((t) => (
            <Pressable
              key={t.key}
              testID={`tint-${t.key}`}
              onPress={() => update({ paper_tint: t.key })}
              style={[
                styles.swatch,
                { backgroundColor: t.bg },
                tintKey === t.key && styles.swatchActive,
              ]}
            >
              <Text style={[styles.swatchLabel, { color: t.key === 'night' ? '#F0EEE7' : COLORS.textPrimary }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>紙張款式</Text>
        <View style={styles.rowGrid}>
          {PAPER_KINDS.map((k) => (
            <Pressable
              key={k.key}
              testID={`paper-${k.key}`}
              onPress={() => update({ paper_kind: k.key })}
              style={[styles.paperChip, paperKind === k.key && styles.chipActive]}
            >
              <Feather name={k.icon as any} size={18} color={COLORS.textPrimary} />
              <Text style={styles.paperChipText}>{k.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>字型</Text>
        <View style={styles.rowGrid}>
          {DIARY_FONT_FAMILIES.map((f) => (
            <Pressable
              key={f.key}
              testID={`font-${f.key}`}
              onPress={() => update({ font_family: f.family })}
              style={[styles.chip, font === f.family && styles.chipActive]}
            >
              <Text style={[styles.chipText, { fontFamily: f.family, fontSize: 16 }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>字體大細</Text>
        <View style={styles.rowGrid}>
          {DIARY_FONT_SIZES.map((s) => (
            <Pressable
              key={s}
              testID={`size-${s}`}
              onPress={() => update({ font_size: s })}
              style={[styles.chip, fontSize === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, { fontSize: s }]}>字</Text>
              <Text style={styles.chipSub}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>字體顏色</Text>
        <View style={styles.rowGrid}>
          {DIARY_TEXT_COLORS.map((c) => (
            <Pressable
              key={c.key}
              testID={`text-${c.key}`}
              onPress={() => update({ text_color: c.color })}
              style={[
                styles.chip,
                { backgroundColor: c.color },
                textColor === c.color && styles.chipActive,
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: c.color === '#F0EEE7' ? COLORS.textPrimary : '#FFFFFF' },
              ]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
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
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  previewFrame: {
    minHeight: 220,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  previewInner: {
    padding: SPACING.lg,
    justifyContent: 'center',
    minHeight: 220,
  },
  section: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  swatch: {
    width: '30%',
    height: 60,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: COLORS.primary, borderWidth: 3 },
  swatchLabel: { fontSize: 11, fontWeight: '700' },
  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  paperChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paperChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minWidth: 60,
  },
  chipActive: { borderColor: COLORS.primary },
  chipText: { fontWeight: '600', color: COLORS.textPrimary },
  chipSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
});
