import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleHeader } from '@/src/components/role-header';
import { RoleSelfCareCard } from '@/src/components/role-selfcare-card';
import { api } from '@/src/lib/api';
import { SchoolPolicies } from '@/src/lib/school-policies';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type ApiAlert = {
  id: string;
  entry_id: string | null;
  student_id: string;
  student_email: string;
  student_display_name?: string | null;
  matched_keywords: string[];
  matched_ban?: string[];
  matched_crisis?: string[];
  entry_date?: string;
  created_at: string;
  status: 'open' | 'reviewed' | 'resolved';
  source?: 'diary' | 'community_post';
  alert_type?: 'crisis_keyword' | 'blocked_crisis_post' | 'blocked_profanity_post';
};

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
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  // Revealed note content, keyed by alert id (only present once counsellor confirms consent)
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  // In-flight consent modal for a specific alert id
  const [consentFor, setConsentFor] = useState<string | null>(null);
  const [consentReason, setConsentReason] = useState('');
  const [consentBusy, setConsentBusy] = useState(false);
  const [canRevealPolicy, setCanRevealPolicy] = useState(false);

  useEffect(() => {
    api.get<ApiAlert[]>('/alerts?status_filter=open')
      .then(setAlerts)
      .catch(() => setAlerts([]));
    SchoolPolicies.get(true)
      .then((p) => setCanRevealPolicy(p.counsellor_can_view_note_content))
      .catch(() => setCanRevealPolicy(false));
  }, []);

  const markReviewed = async (id: string) => {
    try {
      await api.patch<ApiAlert>(`/alerts/${id}`, {});
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      Alert.alert('更新失敗', e?.message || '請再試');
    }
  };

  const deleteAlert = (id: string) => {
    Alert.alert(
      '刪除呢條警示？',
      '刪除後無法還原 · 系統會留 audit log 記錄邊個幾時刪。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/alerts/${id}`);
              setAlerts((prev) => prev.filter((a) => a.id !== id));
              setRevealed((prev) => {
                const n = { ...prev };
                delete n[id];
                return n;
              });
            } catch (e: any) {
              Alert.alert('刪除失敗', e?.message || '請再試');
            }
          },
        },
      ],
    );
  };

  const openConsentModal = (id: string) => {
    if (!canRevealPolicy) {
      Alert.alert(
        '校方未開啟',
        '你嘅學校未允許「輔導查看內容」· 請聯絡 School Admin 開啟權限。',
      );
      return;
    }
    setConsentReason('');
    setConsentFor(id);
  };

  const confirmReveal = async () => {
    if (!consentFor) return;
    setConsentBusy(true);
    try {
      const res = await api.post<any>(`/alerts/${consentFor}/reveal`, {
        consent_confirmed: true,
        reason: consentReason.trim(),
      });
      setRevealed((prev) => ({ ...prev, [consentFor]: res.note_snippet || '(內容已冇儲存)' }));
      setConsentFor(null);
      setConsentReason('');
    } catch (e: any) {
      Alert.alert('查看失敗', e?.message || '請再試');
    } finally {
      setConsentBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="counsellor" title="輔導老師 · 專屬版" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroGreet}>李輔導 · 早晨</Text>
          <Text style={styles.heroSub}>
            {alerts.length > 0
              ? `⚠️ ${alerts.length} 個新關鍵字警示 · ${URGENT.length + FOLLOW_UP.length} 個追蹤 case`
              : `今日 ${URGENT.length + FOLLOW_UP.length} 個 case 等你 · 2 個緊急`}
          </Text>
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

        {/* Real keyword alerts */}
        {alerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🚨 關鍵字警示 · 即時觸發</Text>
            {alerts.map((a) => {
              const isBlockedCrisis = a.alert_type === 'blocked_crisis_post';
              const isBlockedProfanity = a.alert_type === 'blocked_profanity_post';
              // Distinct visual cue so counsellor immediately knows what happened.
              const sourceLabel = isBlockedCrisis
                ? '🚫 出 post 被攔截 · 含危機字眼'
                : isBlockedProfanity
                  ? '🚫 出 post 被攔截 · 含攻擊/粗口'
                  : '📔 日記出現危機字眼';
              const sourceColor = isBlockedCrisis
                ? '#8A3F3F'
                : isBlockedProfanity
                  ? '#3E5B7F'
                  : '#8A5F1F';
              return (
                <View key={a.id} style={styles.alertCard}>
                  <Text style={[styles.alertSource, { color: sourceColor }]}>
                    {sourceLabel}
                  </Text>
                  <View style={styles.alertHead}>
                    <Feather name="alert-octagon" size={16} color="#E86A6A" />
                    <Text style={styles.alertStudent}>
                      {a.student_display_name || '學生'}
                    </Text>
                    <View style={styles.kwPill}>
                      <Text style={styles.kwPillText}>
                        {a.matched_keywords.map((k) => `「${k}」`).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  {/* PRIVACY: we intentionally do NOT show the student's actual note text —
                      only the matched trigger word(s) above. Counsellors act on the signal,
                      not by reading the child's private diary. */}
                  {/* Revealed content (only after consent) */}
                  {revealed[a.id] && (
                    <View style={styles.revealedBox}>
                      <View style={styles.revealedHead}>
                        <Feather name="eye" size={12} color="#8A3F3F" />
                        <Text style={styles.revealedLabel}>已解鎖 · 尊重學生私隱</Text>
                      </View>
                      <Text style={styles.revealedText}>{revealed[a.id]}</Text>
                      <Text style={styles.revealedFoot}>
                        呢次查看已記入 audit log · 校長可以查邊個幾時睇過。
                      </Text>
                    </View>
                  )}
                  <View style={styles.alertActionRow}>
                    <Text style={styles.alertMeta}>
                      {new Date(a.created_at).toLocaleString('zh-HK')}
                    </Text>
                    <View style={styles.actionBtnRow}>
                      {!revealed[a.id] && canRevealPolicy && (
                        <Pressable
                          testID={`alert-reveal-${a.id}`}
                          onPress={() => openConsentModal(a.id)}
                          style={styles.revealBtn}
                        >
                          <Feather name="eye" size={12} color="#8A3F3F" />
                          <Text style={styles.revealBtnText}>查看內容</Text>
                        </Pressable>
                      )}
                      <Pressable
                        testID={`alert-delete-${a.id}`}
                        onPress={() => deleteAlert(a.id)}
                        style={styles.deleteBtn}
                      >
                        <Feather name="trash-2" size={12} color="#8A5F1F" />
                      </Pressable>
                      <Pressable
                        testID={`alert-review-${a.id}`}
                        onPress={() =>
                          Alert.alert(
                            '標記已跟進？',
                            '確認你已聯絡呢位同學仔或者已 escalate · 之後呢條警示會消失喺列表。',
                            [
                              { text: '取消', style: 'cancel' },
                              { text: '標記', onPress: () => markReviewed(a.id) },
                            ],
                          )
                        }
                        style={styles.reviewBtn}
                      >
                        <Feather name="check" size={12} color="#FFF" />
                        <Text style={styles.reviewBtnText}>已跟進</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Consent modal — bright red warnings · designed so counsellor pauses before acting */}
        <Modal
          visible={!!consentFor}
          animationType="fade"
          transparent
          onRequestClose={() => setConsentFor(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>⚠️ 你係咪已經取得學生同意？</Text>
              <Text style={styles.modalBody}>
                呢個學生嘅日記係佢嘅私人空間。查看之前 · 我哋希望你已經：{'\n\n'}
                • 聯絡過學生本人{'\n'}
                • 佢明白你要睇{'\n'}
                • 佢同意咗{'\n\n'}
                <Text style={{ fontWeight: '800' }}>呢次動作會留低紀錄 · 由校長審計。</Text>
              </Text>
              <TextInput
                testID="reveal-reason"
                placeholder="填寫理由（可選 · 例：學生 mentioned self-harm · 要跟進…）"
                placeholderTextColor={COLORS.textDisabled}
                value={consentReason}
                onChangeText={setConsentReason}
                style={styles.modalInput}
                multiline
              />
              <View style={styles.modalBtnRow}>
                <Pressable
                  testID="reveal-cancel"
                  onPress={() => setConsentFor(null)}
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                >
                  <Text style={styles.modalBtnGhostText}>取消</Text>
                </Pressable>
                <Pressable
                  testID="reveal-confirm"
                  onPress={confirmReveal}
                  disabled={consentBusy}
                  style={[styles.modalBtn, styles.modalBtnConfirm, consentBusy && { opacity: 0.5 }]}
                >
                  <Feather name="unlock" size={12} color="#FFF" />
                  <Text style={styles.modalBtnConfirmText}>
                    {consentBusy ? '解鎖中…' : '確認 · 我已取得同意'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
  alertCard: {
    backgroundColor: '#FDECEC',
    borderLeftWidth: 4,
    borderLeftColor: '#E86A6A',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  alertSource: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  alertHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  alertStudent: { fontSize: 14, fontWeight: '800', color: '#7A2E2E' },
  kwPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E86A6A',
  },
  kwPillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  alertSnippet: {
    fontSize: 13,
    color: '#5A3F3F',
    lineHeight: 18,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertMeta: { fontSize: 11, color: '#8A5A5A' },
  actionBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F5E1E1',
    borderWidth: 1,
    borderColor: '#8A3F3F',
  },
  revealBtnText: { fontSize: 12, fontWeight: '700', color: '#8A3F3F' },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FEE9CE',
  },
  revealedBox: {
    backgroundColor: '#F9EFEF',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#8A3F3F',
  },
  revealedHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  revealedLabel: { fontSize: 11, fontWeight: '800', color: '#8A3F3F', letterSpacing: 0.3 },
  revealedText: { fontSize: 13, color: '#4A3F3F', lineHeight: 19, fontStyle: 'italic' },
  revealedFoot: { fontSize: 10, color: '#8A6A6A', marginTop: 6 },

  // Consent modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderTopWidth: 5,
    borderTopColor: '#8A3F3F',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#8A3F3F',
    marginBottom: SPACING.sm,
  },
  modalBody: { fontSize: 13, color: '#4A3F3F', lineHeight: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: COLORS.bgApp,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalBtnGhost: {
    backgroundColor: COLORS.bgApp,
    borderWidth: 1,
    borderColor: COLORS.bgInput,
  },
  modalBtnGhostText: { fontWeight: '700', color: COLORS.textPrimary },
  modalBtnConfirm: { backgroundColor: '#8A3F3F' },
  modalBtnConfirmText: { fontWeight: '800', color: '#FFF', fontSize: 12 },

  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#7BA88C',
  },
  reviewBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

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
