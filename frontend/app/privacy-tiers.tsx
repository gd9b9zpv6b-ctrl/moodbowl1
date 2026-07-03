import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const TIERS = [
  {
    layer: 5,
    role: '🏫 校方管理員',
    can: ['全校統計（人數 · 打卡率）'],
    cannot: ['個人資料', '任何日記內容', '個別學生情緒'],
    color: '#C7A6D1',
  },
  {
    layer: 4,
    role: '💚 輔導老師',
    can: ['警示觸發時 · 見到姓名 + 情緒趨勢', '關鍵字摘要片段（唔係全文）'],
    cannot: ['隨意 browse 學生資料', '完整日記內容'],
    color: '#7DBEE8',
  },
  {
    layer: 3,
    role: '👩‍🏫 班主任',
    can: ['班級整體氣氛（匿名 aggregated）', 'Class alerts 提示'],
    cannot: ['邊個學生寫咩', '個別學生詳情'],
    color: '#F0AE64',
  },
  {
    layer: 2,
    role: '👨‍👩‍👧 家長',
    can: ['自己小朋友嘅整體 vibe', '每週開心/低落比例', '打卡頻率'],
    cannot: ['小朋友寫嘅日記字', '揀咗邊隻公仔', '任何 detail'],
    color: '#E499B4',
  },
  {
    layer: 1,
    role: '🎒 學生本人',
    can: ['自己所有嘢 · 完全私密', '揀 sharing 分享畀 counsellor（自願）'],
    cannot: [],
    color: '#7BA88C',
  },
];

export default function Privacy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>私隱保護 · 邊個見到咩</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Feather name="shield" size={22} color="#5A7CB0" />
          <Text style={styles.heroText}>
            我哋用「5 層權限」系統 · 每個角色只見到佢職責需要嘅嘢 · 冇更多。
          </Text>
        </View>

        {TIERS.map((t) => (
          <View key={t.layer} style={[styles.tier, { borderLeftColor: t.color }]}>
            <View style={styles.tierHeader}>
              <View style={[styles.layerBadge, { backgroundColor: t.color }]}>
                <Text style={styles.layerText}>L{t.layer}</Text>
              </View>
              <Text style={styles.role}>{t.role}</Text>
            </View>
            <View style={styles.canBox}>
              <Feather name="check-circle" size={13} color="#7BA88C" />
              <View style={{ flex: 1 }}>
                {t.can.map((c, i) => (
                  <Text key={i} style={styles.can}>· {c}</Text>
                ))}
              </View>
            </View>
            {t.cannot.length > 0 && (
              <View style={styles.cannotBox}>
                <Feather name="x-circle" size={13} color="#E86A6A" />
                <View style={{ flex: 1 }}>
                  {t.cannot.map((c, i) => (
                    <Text key={i} style={styles.cannot}>· {c}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={styles.auditCard}>
          <Feather name="file-text" size={14} color="#5A7CB0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.auditTitle}>Audit Trail · 每次 access 都有紀錄</Text>
            <Text style={styles.auditText}>
              符合《個人資料（私隱）條例》· 你可以隨時申請睇邊個 access 過你嘅資料 · 幾時 · 因為咩。
            </Text>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#E0EAFC',
    marginBottom: SPACING.md,
  },
  heroText: { flex: 1, fontSize: 13, color: '#3E5075', lineHeight: 18 },
  tier: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  layerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  layerText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  role: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  canBox: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  cannotBox: {
    flexDirection: 'row',
    gap: 6,
  },
  can: { fontSize: 12, color: COLORS.textPrimary, lineHeight: 18 },
  cannot: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, textDecorationLine: 'line-through' },
  auditCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF5E6',
    marginTop: SPACING.md,
  },
  auditTitle: { fontSize: 13, fontWeight: '700', color: '#7A5C3F' },
  auditText: { fontSize: 12, color: '#7A5C3F', lineHeight: 17, marginTop: 2 },
});
