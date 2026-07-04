/**
 * Admin subpage — Audit Log viewer.
 * Read-only for school_admin. Records ONLY metadata about privacy-sensitive actions.
 */
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api } from '@/src/lib/api';

type AuditEntry = {
  id: string;
  action: string;
  actor_email?: string | null;
  actor_role?: string | null;
  target_kind?: string | null;
  target_id?: string | null;
  meta?: Record<string, any>;
  created_at: string;
};

// User-friendly label + colour hint per action type.
const ACTION_META: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  alert_triggered:               { label: '學生觸發警報',       icon: 'alert-octagon', color: '#E86A6A' },
  alert_reviewed:                { label: '警報已跟進',         icon: 'check-circle',  color: '#7BA88C' },
  alert_deleted:                 { label: '警報被刪除',         icon: 'trash-2',       color: '#B57D2A' },
  counsellor_revealed_note:      { label: '⚠️ 輔導查看學生日記', icon: 'eye',           color: '#8A3F3F' },
  policy_counsellor_view_toggle: { label: '政策 · 輔導查看權限', icon: 'toggle-right',  color: '#7B5B9F' },
  policy_diary_keywords_updated: { label: '政策 · 日記警示字更新', icon: 'edit-3',       color: '#5A7DA6' },
  policy_post_ban_updated:       { label: '政策 · Post 禁用字更新', icon: 'edit-3',       color: '#5A7DA6' },
  policy_notify_parents_toggle:  { label: '政策 · 家長通知開關', icon: 'toggle-right',  color: '#7B5B9F' },
  family_created:                { label: '家長 · 學生 配對',   icon: 'user-plus',     color: '#7BA88C' },
  family_unlinked:               { label: '家長 · 學生 解除配對', icon: 'user-x',       color: '#B57D2A' },
  data_exported:                 { label: '用戶匯出自己資料',   icon: 'download',      color: '#5A7DA6' },
  account_self_deleted:          { label: '用戶自行刪除帳戶',   icon: 'user-x',        color: '#8A3F3F' },
};

const HIGH_RISK_ACTIONS = new Set(['counsellor_revealed_note', 'account_self_deleted', 'alert_deleted']);

export function AuditSubpage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'high_risk'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<AuditEntry[]>('/admin/audit?limit=200');
        setEntries(res);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = filter === 'high_risk'
    ? entries.filter((e) => HIGH_RISK_ACTIONS.has(e.action))
    : entries;

  return (
    <>
      <Text style={styles.title}>📋 Audit Log · 敏感操作紀錄</Text>

      <View style={styles.hint}>
        <Feather name="lock" size={12} color="#3E5B7F" />
        <Text style={styles.hintText}>
          呢個 log 淨係記載「動作」（邊個 · 幾時 · 做過乜）· 唔會儲存學生日記內容。{'\n'}
          保留 7 年（HK PDPO 建議）· 冇人可以刪除。
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          testID="audit-tab-all"
          onPress={() => setFilter('all')}
          style={[styles.tab, filter === 'all' && styles.tabActive]}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>全部（{entries.length}）</Text>
        </Pressable>
        <Pressable
          testID="audit-tab-high"
          onPress={() => setFilter('high_risk')}
          style={[styles.tab, filter === 'high_risk' && styles.tabActive]}
        >
          <Text style={[styles.tabText, filter === 'high_risk' && styles.tabTextActive]}>
            ⚠️ 高敏感（{entries.filter((e) => HIGH_RISK_ACTIONS.has(e.action)).length}）
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ maxHeight: 600 }}>
        {loading && <Text style={styles.empty}>載入中…</Text>}
        {!loading && visible.length === 0 && (
          <Text style={styles.empty}>暫時未有紀錄。</Text>
        )}
        {visible.map((e) => {
          const meta = ACTION_META[e.action] || { label: e.action, icon: 'circle', color: COLORS.textSecondary };
          const isHigh = HIGH_RISK_ACTIONS.has(e.action);
          return (
            <View key={e.id} style={[styles.row, isHigh && styles.rowHigh]}>
              <View style={[styles.iconBg, { backgroundColor: meta.color + '22' }]}>
                <Feather name={meta.icon} size={14} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{meta.label}</Text>
                <Text style={styles.rowMeta}>
                  {e.actor_email || '系統'} · {e.actor_role || '?'} · {new Date(e.created_at).toLocaleString('zh-HK')}
                </Text>
                {!!e.meta && Object.keys(e.meta).length > 0 && (
                  <Text style={styles.rowDetail} numberOfLines={2}>
                    {Object.entries(e.meta)
                      .filter(([, v]) => v !== null && v !== undefined && v !== '')
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : String(v).slice(0, 60)}`)
                      .join(' · ')}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ height: SPACING.xxl }} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E7EEF9',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#5A7DA6',
    marginBottom: SPACING.md,
  },
  hintText: { flex: 1, fontSize: 12, color: '#3E5B7F', lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgInput,
  },
  tabActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#FFF' },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: 6,
  },
  rowHigh: {
    borderLeftWidth: 3,
    borderLeftColor: '#8A3F3F',
    backgroundColor: '#FDECEC',
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  rowMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  rowDetail: { fontSize: 11, color: '#5A5A5A', marginTop: 3, fontStyle: 'italic' },
  empty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    padding: SPACING.md,
    textAlign: 'center',
  },
});
