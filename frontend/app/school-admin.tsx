import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleHeader } from '@/src/components/role-header';
import { AlertPolicy, DEFAULT_POLICY, SchoolAlertPolicy } from '@/src/lib/school-alert-policy';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function SchoolAdmin() {
  const [policy, setPolicy] = useState<AlertPolicy>(DEFAULT_POLICY);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    SchoolAlertPolicy.get().then(setPolicy);
  }, []);

  const savePolicy = async (next: AlertPolicy) => {
    setPolicy(next);
    await SchoolAlertPolicy.set(next);
  };

  const toggleKeywordAlerts = (v: boolean) => savePolicy({ ...policy, keywordAlertsEnabled: v });
  const toggleDisclose = (v: boolean) => savePolicy({ ...policy, discloseToStudent: v });

  const toggleNotifyRole = (role: 'counsellor' | 'teacher' | 'admin') => {
    const has = policy.notifyRoles.includes(role);
    const next = has
      ? policy.notifyRoles.filter((r) => r !== role)
      : [...policy.notifyRoles, role];
    savePolicy({ ...policy, notifyRoles: next });
  };

  const addKeyword = () => {
    const k = newKeyword.trim();
    if (!k) return;
    if (policy.keywords.includes(k)) {
      Alert.alert('已經有呢個字', `「${k}」已經喺監察名單。`);
      return;
    }
    savePolicy({ ...policy, keywords: [...policy.keywords, k] });
    setNewKeyword('');
  };

  const removeKeyword = (k: string) => {
    savePolicy({ ...policy, keywords: policy.keywords.filter((x) => x !== k) });
  };

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

        <Text style={styles.sectionTitle}>私隱與警示政策</Text>

        {/* Master toggle: keyword monitoring */}
        <View style={styles.policyCard}>
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#FDE0E0' }]}>
              <Feather name="alert-octagon" size={20} color="#E86A6A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>關鍵字監察 · 緊急通報</Text>
              <Text style={styles.actSub}>
                當學生日記出現危險字詞 · 系統會自動通知揀好嘅老師
              </Text>
            </View>
            <Switch
              testID="policy-keyword-toggle"
              value={policy.keywordAlertsEnabled}
              onValueChange={toggleKeywordAlerts}
              trackColor={{ true: '#E86A6A', false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>

          {policy.keywordAlertsEnabled && (
            <>
              <View style={styles.policyDivider} />

              <Text style={styles.policyLabel}>監察嘅字詞（{policy.keywords.length} 個）</Text>
              <View style={styles.chipRow}>
                {policy.keywords.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => Alert.alert(
                      `移除「${k}」？`,
                      '之後日記出現呢個字 · 系統唔會再通報。',
                      [
                        { text: '取消', style: 'cancel' },
                        { text: '移除', style: 'destructive', onPress: () => removeKeyword(k) },
                      ],
                    )}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{k}</Text>
                    <Feather name="x" size={11} color="#8B4A4A" />
                  </Pressable>
                ))}
              </View>

              <View style={styles.addRow}>
                <TextInput
                  testID="policy-new-keyword"
                  value={newKeyword}
                  onChangeText={setNewKeyword}
                  placeholder="加多一個字…（例：跳樓）"
                  placeholderTextColor={COLORS.textDisabled}
                  style={styles.addInput}
                  onSubmitEditing={addKeyword}
                  returnKeyType="done"
                />
                <Pressable
                  testID="policy-add-keyword"
                  onPress={addKeyword}
                  disabled={!newKeyword.trim()}
                  style={[styles.addBtn, !newKeyword.trim() && { opacity: 0.4 }]}
                >
                  <Feather name="plus" size={16} color="#FFF" />
                </Pressable>
              </View>

              <View style={styles.policyDivider} />

              <Text style={styles.policyLabel}>觸發時通知邊個</Text>
              <View style={styles.chipRow}>
                {(['counsellor', 'teacher', 'admin'] as const).map((r) => {
                  const active = policy.notifyRoles.includes(r);
                  const label = r === 'counsellor' ? '輔導老師' : r === 'teacher' ? '班主任' : '校方';
                  return (
                    <Pressable
                      key={r}
                      onPress={() => toggleNotifyRole(r)}
                      style={[styles.roleChip, active && styles.roleChipActive]}
                    >
                      {active && <Feather name="check" size={11} color="#FFF" />}
                      <Text style={[styles.roleChipText, active && { color: '#FFF' }]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.policyDivider} />

              <View style={styles.policyRow}>
                <View style={[styles.actIcon, { backgroundColor: '#E4F0E8' }]}>
                  <Feather name="eye" size={20} color="#5A7A6C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>對學生透明公告</Text>
                  <Text style={styles.actSub}>
                    喺日記入面明明白白話畀學生知邊啲字會被監察（推薦開）
                  </Text>
                </View>
                <Switch
                  value={policy.discloseToStudent}
                  onValueChange={toggleDisclose}
                  trackColor={{ true: '#7BA88C', false: COLORS.bgInput }}
                  thumbColor={COLORS.bgCard}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.policyHint}>
          <Feather name="info" size={12} color="#7A5C3F" />
          <Text style={styles.policyHintText}>
            每間學校可以自己決定監察政策 · 冇強制 default · 亦可以完全關閉。
          </Text>
        </View>

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

  // Alert policy card
  policyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  policyDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: SPACING.md,
  },
  policyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FDE0E0',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#8B4A4A' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 34, height: 34, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E86A6A',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  roleChipActive: {
    backgroundColor: '#7BA88C',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  policyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  policyHintText: {
    flex: 1,
    fontSize: 11,
    color: '#7A5C3F',
    fontStyle: 'italic',
    lineHeight: 15,
  },
});
