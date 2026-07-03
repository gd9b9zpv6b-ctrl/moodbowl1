import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleHeader } from '@/src/components/role-header';
import { RoleSelfCareCard } from '@/src/components/role-selfcare-card';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const URGENT = [
  { name: '陳 * 文', className: '6A', reason: '日記出現「唔想返學」等字詞', days: 1, sev: 'high' },
  { name: '王 * 明', className: '5B', reason: '連續 5 日負面情緒 + 心口口痛', days: 2, sev: 'high' },
];

const FOLLOW_UP = [
  { name: '李 * 美', className: '5B', reason: '7 日冇打卡 · 之前每日都打', days: 3, sev: 'mid' },
  { name: '張 * 玲', className: '4C', reason: '正面 → 負面情緒急轉', days: 4, sev: 'mid' },
  { name: '林 * 佳', className: '6B', reason: '打卡頻率下降 40%', days: 5, sev: 'low' },
];

function SEVColor(s: string) {
  return s === 'high' ? '#E86A6A' : s === 'mid' ? '#F0AE64' : '#DDB86A';
}

function CaseCard({ item }: { item: typeof URGENT[number] }) {
  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          `${item.name} · ${item.className}`,
          `Trigger: ${item.reason}\n\n（示範版）撳「開啟 case」會：\n1. 記錄 access audit\n2. 顯示學生情緒趨勢圖\n3. 提供介入建議\n4. 可以標記轉介校外專業支援`,
        )
      }
      style={styles.case}
    >
      <View style={[styles.caseDot, { backgroundColor: SEVColor(item.sev) }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.caseHeaderRow}>
          <Text style={styles.caseName}>{item.name}</Text>
          <Text style={styles.caseClass}>{item.className}</Text>
        </View>
        <Text style={styles.caseReason}>{item.reason}</Text>
        <Text style={styles.caseTime}>{item.days} 日前觸發</Text>
      </View>
      <View style={[styles.sevBadge, { backgroundColor: SEVColor(item.sev) + '30' }]}>
        <Text style={[styles.sevText, { color: SEVColor(item.sev) }]}>
          {item.sev === 'high' ? '緊急' : item.sev === 'mid' ? '關注' : '觀察'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CounsellorPanel() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="counsellor" title="輔導老師 · 專屬版" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroGreet}>李輔導 · 早晨</Text>
          <Text style={styles.heroSub}>今日 {URGENT.length + FOLLOW_UP.length} 個 case 等你 · 2 個緊急</Text>
        </View>

        {/* Self-care CTA — counsellor themselves also need to check in */}
        <RoleSelfCareCard
          bg="#DDE9F9"
          border="#B6CFEF"
          bowlBg="#EEF6FF"
          bowlKey="calm"
          title="幫人之前 · 記得幫自己"
          subtitle="輔導工作情緒負荷大 · 撳我用返呢個 App 為自己打卡"
        />

        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: '#FDE0E0' }]}>
            <Text style={[styles.statV, { color: '#8A3F3F' }]}>{URGENT.length}</Text>
            <Text style={styles.statL}>緊急</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FEE9CE' }]}>
            <Text style={[styles.statV, { color: '#8A5F1F' }]}>{FOLLOW_UP.length}</Text>
            <Text style={styles.statL}>要跟進</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#E4F0E8' }]}>
            <Text style={[styles.statV, { color: '#4A6B54' }]}>8</Text>
            <Text style={styles.statL}>本月已 close</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🔴 緊急 · 建議即刻介入</Text>
        {URGENT.map((c, i) => <CaseCard key={i} item={c} />)}

        <Text style={styles.sectionTitle}>🟡 需要跟進</Text>
        {FOLLOW_UP.map((c, i) => <CaseCard key={i} item={c} />)}

        <View style={styles.privacyCard}>
          <Feather name="shield" size={14} color="#5A7CB0" />
          <Text style={styles.privacyText}>
            <Text style={styles.privacyBold}>私隱保障：</Text>{' '}
            學生嘅日記內容 · 只有出現關注字詞時嘅 <Text style={styles.privacyBold}>摘要片段</Text> 先會顯示 · 而且每次 access 都會記錄。你係做 case management · 唔係監視。
          </Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF6FF' },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  hero: { marginBottom: SPACING.md },
  heroGreet: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stat: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statV: { fontSize: 26, fontWeight: '800' },
  statL: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginTop: SPACING.md, marginBottom: SPACING.sm, letterSpacing: 0.5,
  },
  case: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  caseDot: { width: 8, height: 8, borderRadius: 4 },
  caseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  caseName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  caseClass: { fontSize: 12, color: COLORS.textSecondary },
  caseReason: { fontSize: 12, color: COLORS.textPrimary, marginTop: 2 },
  caseTime: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  sevBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  sevText: { fontSize: 10, fontWeight: '800' },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#E0EAFC',
    marginTop: SPACING.md,
  },
  privacyText: { flex: 1, fontSize: 11, color: '#3E5075', lineHeight: 17 },
  privacyBold: { fontWeight: '800' },
});
