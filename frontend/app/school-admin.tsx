import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleHeader } from '@/src/components/role-header';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function SchoolAdmin() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="school_admin" title="校方管理 · 中心" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroSchool}>飯碗小學（示範）</Text>
          <Text style={styles.heroSub}>訂閱狀態 · Enterprise · 2025-08 至 2026-08</Text>
        </View>

        {/* Big stats */}
        <View style={styles.statsGrid}>
          {[
            { label: '註冊學生', v: '412', hint: '共 615 人', c: '#B9DBBC' },
            { label: '在職老師', v: '38', hint: '9 個班主任', c: '#F0AE64' },
            { label: '本週警示', v: '7', hint: '4 個未處理', c: '#F0A0A0' },
            { label: '打卡率', v: '78%', hint: '呢週', c: '#7DBEE8' },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: s.c + '30' }]}>
              <Text style={[styles.statV, { color: '#2D3142' }]}>{s.v}</Text>
              <Text style={styles.statL}>{s.label}</Text>
              <Text style={styles.statH}>{s.hint}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>學生管理</Text>

        <Pressable style={styles.actionCard} onPress={() => Alert.alert('CSV 上載', '示範版：將學生名單 CSV 上載 · 系統自動生成 invite code 派發俾家長。')}>
          <View style={[styles.actIcon, { backgroundColor: '#EEE0F0' }]}>
            <Feather name="upload" size={22} color="#7B5B9F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>上載學生名單 (CSV)</Text>
            <Text style={styles.actSub}>自動分班 · 一鍵生成 invite code</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => Alert.alert('Invite Code', '示範版：一次過生成／重印班級 QR code · 派發俾家長。')}>
          <View style={[styles.actIcon, { backgroundColor: '#FEE9CE' }]}>
            <Feather name="key" size={22} color="#B57D2A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>Invite Code 派發</Text>
            <Text style={styles.actSub}>QR code · 家長信 · 一鍵生成</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => Alert.alert('老師權限', '示範版：管理班主任、輔導老師嘅 access · 分配班別。')}>
          <View style={[styles.actIcon, { backgroundColor: '#E0EAFC' }]}>
            <Feather name="user-check" size={22} color="#5A7CB0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>老師權限管理</Text>
            <Text style={styles.actSub}>38 位老師 · 8 個班主任 · 2 個輔導</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Text style={styles.sectionTitle}>數據 · 報告</Text>

        <View style={styles.reportCard}>
          <View style={styles.reportRow}>
            <Feather name="trending-up" size={18} color="#7BA88C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>本月情緒總體趨勢</Text>
              <Text style={styles.reportSub}>正面 62% · 負面 24% · 中性 14%</Text>
            </View>
          </View>
          <View style={styles.reportRow}>
            <Feather name="alert-circle" size={18} color="#E86A6A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>高風險班別</Text>
              <Text style={styles.reportSub}>6C 班連續 2 週負面情緒偏高 · 建議跟進</Text>
            </View>
          </View>
          <View style={styles.reportRow}>
            <Feather name="users" size={18} color="#5A7CB0" />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>老師使用率</Text>
              <Text style={styles.reportSub}>85% 老師每週登入 · 22% 每日登入</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerNote}>
          <Feather name="shield" size={13} color="#7A5C3F" />
          <Text style={styles.footerText}>
            所有學生私隱資料加密儲存 · 符合《個人資料（私隱）條例》· 老師/家長 access 均有 audit trail。
          </Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5EFF7' },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  hero: { marginBottom: SPACING.md },
  heroSchool: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  heroSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stat: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  statV: { fontSize: 28, fontWeight: '800' },
  statL: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  statH: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  actIcon: {
    width: 44, height: 44, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  actTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  actSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reportCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reportTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  reportSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF5E6',
    marginTop: SPACING.lg,
  },
  footerText: { flex: 1, fontSize: 11, color: '#7A5C3F', lineHeight: 17 },
});
