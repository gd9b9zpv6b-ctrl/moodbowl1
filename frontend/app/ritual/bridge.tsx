import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { saveRitualWithActivities } from '@/src/lib/diary';
import { detectState, type NSState } from '@/src/lib/ritual/state-detector';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

const BRIDGE_COPY: Record<NSState, string> = {
  sympathetic_fire: '而家平靜返啲啦嘛? 想同人講咩發生咗咩事嗎?',
  dorsal_sad: '而家 feel 冇咁重嗎? 想搵個朋友唞唞氣嗎?',
  sympathetic_anxious: '而家心跳慢返嗎? 如果想有人陪住 · 想搵邊個?',
  dorsal_freeze: '而家有啲返到自己嗎? 如果想同人講一句話 · 都得',
  ventral_regulated: '今日呢種靚感覺 · 想派俾人一齊分享嗎?',
  unspoken: '今日呢件事 · 留返俾自己都完全 OK',
};

export default function RitualBridgeScreen() {
  const router = useRouter();
  const soup = useRitualStore((s) => s.soup);
  const bodyChips = useRitualStore((s) => s.bodyChips);
  const selectedBowlKey = useRitualStore((s) => s.selectedBowlKey);
  const colorTint = useRitualStore((s) => s.colorTint);
  const bowlSize = useRitualStore((s) => s.bowlSize);
  const diaryText = useRitualStore((s) => s.diaryText);
  const checkInType = useRitualStore((s) => s.checkInType);
  const shareClass = useRitualStore((s) => s.shareClass);
  const shareFamily = useRitualStore((s) => s.shareFamily);
  const shareTimeline = useRitualStore((s) => s.shareTimeline);
  const startedAt = useRitualStore((s) => s.startedAt);
  const regulationUsed = useRitualStore((s) => s.regulationUsed);
  const setShares = useRitualStore((s) => s.setShares);

  const [saving, setSaving] = useState(false);
  const state = useMemo(() => detectState(soup, bodyChips), [soup, bodyChips]);
  const emotion = selectedBowlKey ? EMOTION_BY_KEY[selectedBowlKey] : null;

  const onComplete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const timeSpent =
        startedAt != null ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
      const entry = await saveRitualWithActivities(
        {
          soup,
          body_chips: bodyChips,
          bowl_emotion_key: selectedBowlKey,
          bowl_color_tint: colorTint,
          bowl_size: bowlSize,
          diary_text: checkInType === 'hug_only' ? null : diaryText || null,
          check_in_type: checkInType === 'hug_only' ? 'hug_only' : 'full',
          is_public: shareClass,
          shared_with_class: shareClass,
          shared_with_family: shareFamily,
          smile_completed: false,
          time_spent_sec: timeSpent,
        },
        regulationUsed,
      );
      router.push({
        pathname: '/ritual/complete',
        params: {
          entryId: entry.id,
          minutes: String(Math.max(1, Math.round((timeSpent || 60) / 60))),
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '過陣再試';
      Alert.alert('儲存唔到', msg, [{ text: '好' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-bridge-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.bowl}>
          <View>
            <EmotionVisual emotion={emotion} size={180} radius={RADIUS.lg} />
            {colorTint && colorTint !== '#FFFFFF' && (
              <View
                pointerEvents="none"
                style={[styles.tint, { backgroundColor: colorTint }]}
              />
            )}
          </View>
        </View>

        <Text style={styles.title}>{BRIDGE_COPY[state]}</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>想同人講嘢 · 派俾我班同學</Text>
          </View>
          <Switch
            testID="bridge-share-class"
            value={shareClass}
            onValueChange={(v) => setShares({ shareClass: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>派俾家人（如果連咗）</Text>
          </View>
          <Switch
            testID="bridge-share-family"
            value={shareFamily}
            onValueChange={(v) => setShares({ shareFamily: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>留返俾我自己 timeline</Text>
          </View>
          <Switch
            testID="bridge-share-timeline"
            value={shareTimeline}
            onValueChange={(v) => setShares({ shareTimeline: v })}
            trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
            thumbColor={COLORS.bgCard}
          />
        </View>

        <Pressable
          testID="bridge-complete-btn"
          disabled={saving}
          onPress={onComplete}
          style={[styles.cta, saving && { opacity: 0.6 }]}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.ctaText}>完成啦 · 搞掂</Text>
          )}
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
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  bowl: { alignItems: 'center', marginBottom: SPACING.lg },
  tint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    opacity: 0.35,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  cta: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
