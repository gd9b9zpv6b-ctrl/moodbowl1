import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DIARY_BACKGROUNDS,
  DIARY_FONT_FAMILIES,
  DIARY_FONT_SIZES,
  DIARY_TEXT_COLORS,
} from '@/src/constants/diary-style';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, DiaryStyle, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

export default function DiaryStyleScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const initial: DiaryStyle = user?.diary_style || {};
  const [bg, setBg] = useState(initial.bg || DIARY_BACKGROUNDS[0].color);
  const [font, setFont] = useState<string | undefined>(initial.font_family);
  const [fontSize, setFontSize] = useState(initial.font_size || 15);
  const [textColor, setTextColor] = useState(initial.text_color || DIARY_TEXT_COLORS[0].color);

  const persist = async (next: DiaryStyle) => {
    try {
      await api.patch<User>('/premium/settings', { diary_style: next });
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const update = (patch: DiaryStyle) => {
    const next = { bg, font_family: font, font_size: fontSize, text_color: textColor, ...patch };
    if (patch.bg !== undefined) setBg(patch.bg);
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
        <View style={[styles.preview, { backgroundColor: bg }]} testID="style-preview">
          <Text
            style={{
              fontFamily: font,
              fontSize,
              color: textColor,
              lineHeight: fontSize * 1.55,
            }}
          >
            今日雖然行得慢啲{'\n'}但我都有向前走過{'\n'}為自己驕傲一下 🌿
          </Text>
        </View>

        <Text style={styles.section}>背景色</Text>
        <View style={styles.grid}>
          {DIARY_BACKGROUNDS.map((b) => (
            <Pressable
              key={b.key}
              testID={`bg-${b.key}`}
              onPress={() => update({ bg: b.color })}
              style={[
                styles.swatch,
                { backgroundColor: b.color },
                bg === b.color && styles.swatchActive,
              ]}
            >
              <Text style={styles.swatchLabel}>{b.label}</Text>
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
              <Text style={[styles.chipText, { fontFamily: f.family }]}>{f.label}</Text>
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
              <Text style={[styles.chipText, { fontSize: s }]}>Aa</Text>
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
              <Text style={[styles.chipText, { color: c.color === '#FFFFFF' ? COLORS.textPrimary : '#FFFFFF' }]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  preview: {
    minHeight: 140, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg,
    justifyContent: 'center',
  },
  section: {
    marginTop: SPACING.md, marginBottom: SPACING.sm,
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  swatch: {
    width: '30%', height: 60, borderRadius: RADIUS.md, padding: SPACING.sm,
    justifyContent: 'flex-end', borderWidth: 2, borderColor: 'transparent',
  },
  swatchActive: { borderColor: COLORS.textPrimary },
  swatchLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', minWidth: 60,
  },
  chipActive: { borderColor: COLORS.textPrimary },
  chipText: { fontWeight: '600', color: COLORS.textPrimary },
  chipSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
});
