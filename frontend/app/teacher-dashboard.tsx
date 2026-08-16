import { Feather } from '@expo/vector-icons';
import { useMemo, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { RoleSelfCareCard } from '@/src/components/role-selfcare-card';
import { EMOTIONS, EMOTION_BY_KEY } from '@/src/constants/emotions';
import { ENERGY_META, EnergyLevel } from '@/src/constants/energy';
import { RoleHeader } from '@/src/components/role-header';
import { useSchoolEnergyMap } from '@/src/hooks/use-school-energy-map';
import { api } from '@/src/lib/api';
import { TEACHER_FOLLOW_UP_COPY } from '@/src/lib/teacher-follow-up';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type ApiAlert = {
  id: string;
  student_display_name?: string | null;
  matched_keywords: string[];
  created_at: string;
  status: string;
  source?: 'diary' | 'community_post';
  alert_type?: 'crisis_keyword' | 'blocked_crisis_post' | 'blocked_profanity_post';
};

// 每班的能量分佈 (mock)
const CLASS_DATA = [
  { name: '6A · 我班', students: 28, high: 30, steady: 55, low: 15, alerts: 1 },
  { name: '5B',       students: 30, high: 45, steady: 30, low: 25, alerts: 2 },
  { name: '4C',       students: 26, high: 25, steady: 60, low: 15, alerts: 0 },
];

// 需要關注嘅學生 (mock) — 「想老師留意」只顯示可能要關注 · 冇其他資料
const ALERTS = [
  { name: '陳 * 文', className: '6A', reason: '可能要關注呢位學生', severity: 'high' as const, notifyOnly: true },
  { name: '李 * 美', className: '5B', reason: '負面感覺多咗', severity: 'mid' as const, notifyOnly: false },
  { name: '黃 * 晴', className: '6A', reason: '負面仲好強 · 暫時放低', severity: 'mid' as const, notifyOnly: false },
  { name: '王 * 明', className: '5B', reason: '日記出現關注字詞', severity: 'high' as const, notifyOnly: false },
];

// 行為異常偵測 (mock) — 呢啲比自報準
const BEHAVIOR_FLAGS = [
  { icon: 'trending-down', text: '5B 呢周 open app 少咗 40%', tone: 'warn' as const },
  { icon: 'moon', text: '3 位同學仔連續 3 晚凌晨 12 點後開 app', tone: 'warn' as const },
  { icon: 'zap', text: '6A 情緒波幅比上周高 · 可能有壓力事件', tone: 'info' as const },
];

// 負面情緒跟進摘要 (mock)
const NEGATIVE_FOLLOW_UP = [
  { cue: 'asks_help' as const, count: 2 },
  { cue: 'got_stronger' as const, count: 2 },
  { cue: 'still_strong' as const, count: 3 },
  { cue: 'holding_on' as const, count: 2 },
  { cue: 'parked' as const, count: 2 },
  { cue: 'got_lighter' as const, count: 1 },
];

// Fallback representative bowls (used before school config loads)
const FALLBACK = {
  high: EMOTION_BY_KEY['happy'],
  steady: EMOTION_BY_KEY['calm'],
  low: EMOTION_BY_KEY['sad'],
};

// 一班嘅能量 stat card
function ClassCard({ c, bowls }: { c: typeof CLASS_DATA[number]; bowls: typeof FALLBACK }) {
  const total = c.high + c.steady + c.low;
  return (
    <View style={styles.classCard}>
      <View style={styles.classHeader}>
        <Text style={styles.className}>{c.name}</Text>
        <Text style={styles.classCount}>{c.students} 位同學仔</Text>
      </View>

      <View style={styles.bar}>
        <View style={{ flex: c.high, backgroundColor: ENERGY_META.high.color }} />
        <View style={{ flex: c.steady, backgroundColor: ENERGY_META.steady.color }} />
        <View style={{ flex: c.low, backgroundColor: ENERGY_META.low.color }} />
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          {bowls.high && <EmotionVisual emotion={bowls.high} size={20} radius={10} />}
          <Text style={styles.legendText}>{Math.round((c.high / total) * 100)}%</Text>
        </View>
        <View style={styles.legendItem}>
          {bowls.steady && <EmotionVisual emotion={bowls.steady} size={20} radius={10} />}
          <Text style={styles.legendText}>{Math.round((c.steady / total) * 100)}%</Text>
        </View>
        <View style={styles.legendItem}>
          {bowls.low && <EmotionVisual emotion={bowls.low} size={20} radius={10} />}
          <Text style={styles.legendText}>{Math.round((c.low / total) * 100)}%</Text>
        </View>
        {c.alerts > 0 && (
          <View style={styles.miniAlert}>
            <Feather name="alert-circle" size={11} color="#E86A6A" />
            <Text style={styles.miniAlertText}>{c.alerts}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TeacherDashboard() {
  const { map: energyMap } = useSchoolEnergyMap();
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);

  useEffect(() => {
    api.get<ApiAlert[]>('/alerts?status_filter=open')
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  // Pick the FIRST emotion mapped to each bucket in EMOTIONS order — the "representative bowl".
  // Falls back to hardcoded happy/calm/sad if a bucket is empty in the school's config.
  const bowls = useMemo(() => {
    const findFirst = (level: EnergyLevel) =>
      EMOTIONS.find((e) => (energyMap[e.key] || 'steady') === level && e.image);
    return {
      high: findFirst('high') || FALLBACK.high,
      steady: findFirst('steady') || FALLBACK.steady,
      low: findFirst('low') || FALLBACK.low,
    };
  }, [energyMap]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="teacher" title="老師版面" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroGreet}>陳老師 · 早晨 ☀️</Text>
          <Text style={styles.heroSub}>
            負面仲好強／多咗／少咗 · 同埋學生想點處理 · 「想老師留意」只係通知
          </Text>
        </View>

        {/* Teacher self-care card */}
        {/* Self-care CTA — teachers also deserve to check in */}
        <RoleSelfCareCard
          testID="teacher-selfcare"
          bg="#FFF6E5"
          border="#F0D8A8"
          bowlKey="happy"
          title="老師都可以用呢個 App"
          subtitle="關心學生之前 · 先關心自己 · 開始今日心情"
        />

        {/* Real keyword alerts (only students in this teacher's class) */}
        {alerts.length > 0 && (
          <View style={styles.kwAlertBox}>
            <View style={styles.alertHeader}>
              <Feather name="alert-octagon" size={16} color="#E86A6A" />
              <Text style={styles.alertTitle}>🚨 你班學生嘅關鍵字警示</Text>
              <View style={[styles.alertCount, { backgroundColor: '#E86A6A' }]}>
                <Text style={styles.alertCountText}>{alerts.length}</Text>
              </View>
            </View>
            {alerts.map((a) => {
              const sourceLabel = a.alert_type === 'blocked_crisis_post'
                ? '🚫 出 post 被攔截 · 危機字'
                : a.alert_type === 'blocked_profanity_post'
                  ? '🚫 出 post 被攔截 · 攻擊/粗口'
                  : '📔 日記出現危機字';
              return (
                <View key={a.id} style={styles.kwAlertItem}>
                  <Text style={styles.kwSourceLabel}>{sourceLabel}</Text>
                  <Text style={styles.kwStudent}>{a.student_display_name || '學生'}</Text>
                  <View style={styles.kwPillRow}>
                    {a.matched_keywords.map((k) => (
                      <View key={k} style={styles.kwPill}>
                        <Text style={styles.kwPillText}>「{k}」</Text>
                      </View>
                    ))}
                  </View>
                  {/* PRIVACY: 唔顯示學生原文 · 老師只需要知道有邊個字被觸發 */}
                </View>
              );
            })}
            <Text style={styles.alertHint}>
              🔒 呢啲警示係關鍵字自動觸發 · 只顯示你班同學仔嘅內容。建議先聯絡輔導老師一齊跟進。
            </Text>
          </View>
        )}

        {/* 需要關注嘅學生 */}
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <Feather name="alert-triangle" size={18} color="#E86A6A" />
            <Text style={styles.alertTitle}>需要關注嘅學生</Text>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{ALERTS.length}</Text>
            </View>
          </View>
          {ALERTS.map((a, i) => (
            <Pressable
              key={i}
              onPress={() =>
                Alert.alert(
                  `${a.name} · ${a.className}`,
                  a.notifyOnly
                    ? '學生想你留意吓 · 系統唔會顯示情緒、碗大細、或者日記內容。\n\n可以自己安排關心一下。'
                    : `提示：${a.reason}\n\n日記原文仍然睇唔到 · 可以通知輔導老師跟進 · 或者自己安排單獨傾談。`,
                )
              }
              style={styles.alertItem}
            >
              <View style={[styles.alertDot, { backgroundColor: a.severity === 'high' ? '#E86A6A' : '#F0AE64' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{a.name} <Text style={styles.alertClass}>· {a.className}</Text></Text>
                <Text style={styles.alertReason}>{a.reason}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
            </Pressable>
          ))}
          <Text style={styles.alertHint}>
            🔒 「想老師留意」只顯示可能要關注 · 唔會有其他資料。每次查閱都會留底。
          </Text>
        </View>

        {/* 負面情緒跟進 · 強度 + 處理方式（「想老師留意」另計 · 只通知） */}
        <View style={styles.sizeReportBox} testID="teacher-bowl-size-report">
          <View style={styles.sizeReportHeader}>
            <Feather name="heart" size={16} color="#B57D2A" />
            <Text style={styles.sizeReportTitle}>負面情緒 · 要唔要跟進</Text>
          </View>
          <Text style={styles.sizeReportHint}>
            兩層提示：① 學生撳「想老師留意」→ 只顯示「可能要關注」。② 系統用碗大細／處理方式推斷（主動放下唔計）· 一樣唔顯示日記原文。屋企留意唔會當成老師通知。
          </Text>
          <View style={styles.followCueList}>
            {NEGATIVE_FOLLOW_UP.map((row) => {
              const copy = TEACHER_FOLLOW_UP_COPY[row.cue];
              return (
                <View
                  key={row.cue}
                  style={styles.followCueRow}
                  testID={`teacher-follow-${row.cue}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.followCueTitle}>{copy.title}</Text>
                    <Text style={styles.followCueHint}>{copy.hint}</Text>
                  </View>
                  <Text style={styles.followCueCount}>{row.count}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.sizeReportFooter}>
            今日合共{' '}
            {NEGATIVE_FOLLOW_UP.reduce((n, r) => n + r.count, 0)}{' '}
            位同學仔嘅負面情緒值得你留意一下。
          </Text>
        </View>

        {/* 行為異常偵測 — 用行為信號補自報唔準嘅盲點 */}
        <View style={styles.behaviorBox}>
          <View style={styles.behaviorHeader}>
            <Feather name="activity" size={16} color="#5A7A8C" />
            <Text style={styles.behaviorTitle}>行為異常偵測</Text>
            <Text style={styles.behaviorBadge}>Beta</Text>
          </View>
          <Text style={styles.behaviorHint}>
            細路仔可能會扮開心 · 但佢哋嘅行為模式好難扮 —— 呢度睇嘅係使用習慣異常。
          </Text>
          {BEHAVIOR_FLAGS.map((f, i) => (
            <View key={i} style={styles.behaviorItem}>
              <Feather
                name={f.icon as any}
                size={14}
                color={f.tone === 'warn' ? '#E86A6A' : '#5A7A8C'}
              />
              <Text style={styles.behaviorText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* 班氣氛圖 · 唔係跟進名單 */}
        <Text style={styles.sectionTitle}>班氣氛圖例（唔係跟進名單）</Text>
        <View style={styles.legendCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendBowl}>
              {bowls.high && <EmotionVisual emotion={bowls.high} size={44} radius={RADIUS.md} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.legendLabel, { color: ENERGY_META.high.color }]}>
                {ENERGY_META.high.label}
              </Text>
              <Text style={styles.legendDesc}>快樂 · 激動 · 憤怒 · 焦慮 — 情緒推佢向前</Text>
            </View>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendRow}>
            <View style={styles.legendBowl}>
              {bowls.steady && <EmotionVisual emotion={bowls.steady} size={44} radius={RADIUS.md} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.legendLabel, { color: ENERGY_META.steady.color }]}>
                {ENERGY_META.steady.label}
              </Text>
              <Text style={styles.legendDesc}>平靜 · 滿足 · 一般 — 情緒穩定嘅一日</Text>
            </View>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendRow}>
            <View style={styles.legendBowl}>
              {bowls.low && <EmotionVisual emotion={bowls.low} size={44} radius={RADIUS.md} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.legendLabel, { color: ENERGY_META.low.color }]}>
                {ENERGY_META.low.label}
              </Text>
              <Text style={styles.legendDesc}>傷心 · 疲累 · 無力 · 麻木 — 需要多啲關心</Text>
            </View>
          </View>
        </View>

        {/* 每班分佈 */}
        <Text style={styles.sectionTitle}>我教嘅班</Text>
        {CLASS_DATA.map((c) => (
          <ClassCard key={c.name} c={c} bowls={bowls} />
        ))}

        {/* 老師錦囊 */}
        <View style={styles.tipCard}>
          <Feather name="heart" size={14} color="#7BA88C" />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>老師錦囊：</Text>{' '}
            如果一個學生連續幾日負面情緒 · 唔一定要質問佢 · 用「我留意到你呢排少啲笑 · 有咩想同我講嗎」呢種開放式 approach。
          </Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF5E6' },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },

  hero: { marginBottom: SPACING.md },
  heroGreet: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  selfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#FFF6E5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#F0D8A8',
  },
  selfBowlWrap: {
    width: 56, height: 56, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  selfTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  selfSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 15 },

  alertBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#E86A6A',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  alertTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  alertCount: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E86A6A',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  alertCountText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  alertClass: { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
  alertReason: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  alertHint: {
    fontSize: 10, color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  // 負面情緒跟進報告
  sizeReportBox: {
    backgroundColor: '#FFF8EE',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0D8A8',
  },
  sizeReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sizeReportTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sizeReportHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  followCueList: { gap: 8 },
  followCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  followCueTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  followCueHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 15 },
  followCueCount: { fontSize: 22, fontWeight: '800', color: '#B57D2A', minWidth: 28, textAlign: 'right' },
  sizeReportFooter: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: SPACING.sm,
    lineHeight: 17,
  },

  // 行為異常偵測
  behaviorBox: {
    backgroundColor: '#EDF3F7',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  behaviorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  behaviorTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#3A5567' },
  behaviorBadge: {
    fontSize: 10, fontWeight: '700', color: '#5A7A8C',
    backgroundColor: '#D8E5EE',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  behaviorHint: {
    fontSize: 11, color: '#5A7A8C',
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  behaviorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
  },
  behaviorText: { flex: 1, fontSize: 12, color: '#3A5567', lineHeight: 17 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginTop: SPACING.sm, marginBottom: SPACING.sm, letterSpacing: 0.5,
  },

  // Legend card (能量分類圖例)
  legendCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 4,
  },
  legendBowl: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FBEFD4',
  },
  legendLabel: { fontSize: 13, fontWeight: '800' },
  legendDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 15 },
  legendDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 6 },

  // Class card
  classCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  className: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  classCount: { fontSize: 11, color: COLORS.textSecondary },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    backgroundColor: '#E9E4D4',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },

  miniAlert: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FDE0E0',
  },
  miniAlertText: { fontSize: 11, fontWeight: '800', color: '#E86A6A' },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#E4F0E8',
    marginTop: SPACING.md,
  },
  tipText: { flex: 1, fontSize: 12, color: '#4A6B54', lineHeight: 18 },
  tipBold: { fontWeight: '700' },
  // Keyword alert box (real backend data)
  kwAlertBox: {
    backgroundColor: '#FDECEC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#E86A6A',
  },
  kwAlertItem: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  kwStudent: { fontSize: 14, fontWeight: '800', color: '#7A2E2E', marginBottom: 4 },
  kwSourceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5F4A2E',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  kwPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  kwPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E86A6A',
  },
  kwPillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  kwSnippet: { fontSize: 12, color: '#5A3F3F', lineHeight: 17, fontStyle: 'italic' },
});
