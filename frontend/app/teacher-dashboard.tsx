import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { ENERGY_META } from '@/src/constants/energy';
import { RoleHeader } from '@/src/components/role-header';
import { RoleStorage } from '@/src/lib/role-storage';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const CLASS_DATA = [
  { name: '6A · 我班', students: 28, high: 30, steady: 55, low: 15, alerts: 1 },
  { name: '5B',       students: 30, high: 45, steady: 30, low: 25, alerts: 2 },
  { name: '4C',       students: 26, high: 25, steady: 60, low: 15, alerts: 0 },
];

const ALERTS = [
  { name: '陳 * 文', className: '6A', reason: '連續 5 日低能量情緒', severity: 'high' },
  { name: '李 * 美', className: '5B', reason: '7 日冇打卡', severity: 'mid' },
  { name: '王 * 明', className: '5B', reason: '日記出現關注字詞', severity: 'high' },
];

const BOWL_HIGH = EMOTION_BY_KEY['happy'];
const BOWL_STEADY = EMOTION_BY_KEY['calm'];
const BOWL_LOW = EMOTION_BY_KEY['sad'];

export default function TeacherDashboard() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="teacher" title="老師 · Dashboard" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroGreet}>陳老師 · 早晨</Text>
          <Text style={styles.heroSub}>你有 3 位學生需要關注 · 揀返嚟先睇下</Text>
        </View>

        {/* Teacher self-care card */}
        <Pressable
          testID="teacher-selfcare"
          onPress={async () => {
            await RoleStorage.set('student');
            router.replace('/');
          }}
          style={styles.selfCard}
        >
          <View style={styles.selfBowlWrap}>
            {BOWL_POS && <EmotionVisual emotion={BOWL_POS} size={54} radius={RADIUS.md} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selfTitle}>老師都可以用呢個 App</Text>
            <Text style={styles.selfSub}>
              關心學生之前 · 先關心自己 · 撳我打卡今日心情
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
        </Pressable>

        {/* Alerts section */}
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
              onPress={() => Alert.alert(`${a.name} · ${a.className}`, `原因：${a.reason}\n\n（示範版）撳「跟進」會通知輔導老師 · 或者你可以自己安排單獨傾談。`)}
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
            🔒 私隱注意：你只會見到姓氏 + 一個字 · 詳情要撳入去 · 每次 access 都有 audit trail。
          </Text>
        </View>

        <Text style={styles.sectionTitle}>我教嘅班</Text>

        {CLASS_DATA.map((c) => (
          <View key={c.name} style={styles.classCard}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{c.name}</Text>
              <Text style={styles.classCount}>{c.students} 位同學仔</Text>
            </View>
            <View style={styles.bar}>
              <View style={{ flex: c.positive, backgroundColor: '#7BA88C' }} />
              <View style={{ flex: c.neutral, backgroundColor: '#DDB86A' }} />
              <View style={{ flex: c.negative, backgroundColor: '#E499B4' }} />
            </View>
            <View style={styles.legend}>
              <Text style={styles.legendItem}>😊 {c.positive}%</Text>
              <Text style={styles.legendItem}>😐 {c.neutral}%</Text>
              <Text style={styles.legendItem}>😔 {c.negative}%</Text>
              {c.alerts > 0 && (
                <View style={styles.miniAlert}>
                  <Feather name="alert-circle" size={11} color="#E86A6A" />
                  <Text style={styles.miniAlertText}>{c.alerts}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

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
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginTop: SPACING.sm, marginBottom: SPACING.sm, letterSpacing: 0.5,
  },
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
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  legendItem: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
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
});
