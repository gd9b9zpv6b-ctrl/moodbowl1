import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTIONS, EMOTION_BY_KEY } from '@/src/constants/emotions';
import { ENERGY_META, EnergyLevel } from '@/src/constants/energy';
import { RoleHeader } from '@/src/components/role-header';
import { RoleSelfCareCard } from '@/src/components/role-selfcare-card';
import { AlertPolicy, DEFAULT_POLICY, SchoolAlertPolicy } from '@/src/lib/school-alert-policy';
import { AdultAnonymity, CommunityConfig, DEFAULT_CONFIG, SchoolCommunityConfig, StudentAnonymity } from '@/src/lib/school-community-config';
import { EnergyMap, SchoolEnergyConfig } from '@/src/lib/school-energy-config';
import { api, Entry } from '@/src/lib/api';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const LEVEL_ORDER: EnergyLevel[] = ['high', 'steady', 'low'];

function nextLevel(level: EnergyLevel): EnergyLevel {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[(idx + 1) % LEVEL_ORDER.length];
}

export default function SchoolAdmin() {
  const [policy, setPolicy] = useState<AlertPolicy>(DEFAULT_POLICY);
  const [newKeyword, setNewKeyword] = useState('');
  const [energyMap, setEnergyMap] = useState<EnergyMap>(SchoolEnergyConfig.DEFAULT_MAP);
  const [communityConfig, setCommunityConfig] = useState<CommunityConfig>(DEFAULT_CONFIG);
  const [historyScope, setHistoryScope] = useState<'student' | 'adult'>('student');
  const [history, setHistory] = useState<Entry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    SchoolAlertPolicy.get().then(setPolicy);
    SchoolEnergyConfig.get().then(setEnergyMap);
    SchoolCommunityConfig.get().then(setCommunityConfig);
  }, []);

  const loadHistory = async (scope: 'student' | 'adult') => {
    setHistoryLoading(true);
    setHistoryScope(scope);
    try {
      const res = await api.get<Entry[]>(`/admin/community-history?scope=${scope}&limit=50`);
      setHistory(res);
    } catch (e: any) {
      Alert.alert('載入唔到歷史', e?.message || '請確認你係校方/輔導身份');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistoryEntry = (entry: Entry) => {
    Alert.alert(
      '刪除呢個 post？',
      `${entry.note?.slice(0, 80) || '(冇文字內容)'}${(entry.note || '').length > 80 ? '…' : ''}\n\n刪除後對方會睇唔到 · 系統會保留 audit log。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/entries/${entry.id}`);
              setHistory((prev) => prev.filter((e) => e.id !== entry.id));
            } catch (e: any) {
              Alert.alert('刪除失敗', e?.message || '請再試');
            }
          },
        },
      ],
    );
  };

  const saveCommunity = async (next: CommunityConfig) => {
    setCommunityConfig(next);
    await SchoolCommunityConfig.set(next);
  };

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

  const cycleEmotionLevel = async (emotionKey: string) => {
    const current = energyMap[emotionKey] || 'steady';
    const next = nextLevel(current);
    const newMap = await SchoolEnergyConfig.setOverride(emotionKey, next);
    setEnergyMap(newMap);
  };

  const resetEnergyMap = () => {
    Alert.alert(
      '重設能量分類？',
      '會將所有 icon 分類還原到 app 預設。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重設',
          style: 'destructive',
          onPress: async () => {
            const fresh = await SchoolEnergyConfig.reset();
            setEnergyMap(fresh);
          },
        },
      ],
    );
  };

  // Group emotions by their currently-configured energy level
  const bucketed: Record<EnergyLevel, typeof EMOTIONS> = { high: [], steady: [], low: [] };
  EMOTIONS.forEach((e) => {
    const level = (energyMap[e.key] || 'steady') as EnergyLevel;
    bucketed[level].push(e);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="school_admin" title="校方管理 · 中心" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroSchool}>飯碗小學（示範）</Text>
          <Text style={styles.heroSub}>訂閱狀態 · Enterprise · 2025-08 至 2026-08</Text>
        </View>

        {/* Self-care CTA — school leaders also carry emotional weight */}
        <RoleSelfCareCard
          bg="#F0E6F5"
          border="#D7BEE8"
          bowlBg="#FFF"
          bowlKey="peaceful"
          title="校長 · 主任都用得到"
          subtitle="決策壓力大 · 撳我體驗學生嘅版面 · 幫自己 recharge"
        />

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

        {/* Emotion → Energy mapping · school customizable */}
        <Text style={styles.sectionTitle}>情緒能量分類</Text>
        <View style={styles.energyIntro}>
          <Feather name="info" size={13} color={COLORS.textSecondary} />
          <Text style={styles.energyIntroText}>
            撳一撳飯團 · 就會切換去下一個 bucket（高 → 平穩 → 低 → 高）· 每間學校可以自己決定分類。
          </Text>
        </View>

        {LEVEL_ORDER.map((level) => {
          const meta = ENERGY_META[level];
          const items = bucketed[level];
          return (
            <View key={level} style={[styles.energyBucket, { borderLeftColor: meta.color }]}>
              <View style={styles.energyBucketHeader}>
                <View style={[styles.energyDot, { backgroundColor: meta.color }]} />
                <Text style={styles.energyBucketLabel}>{meta.label}</Text>
                <Text style={styles.energyBucketCount}>{items.length} 個</Text>
              </View>
              {items.length === 0 ? (
                <Text style={styles.energyEmpty}>（呢個 bucket 冇 icon）</Text>
              ) : (
                <View style={styles.energyChipRow}>
                  {items.map((e) => (
                    <Pressable
                      key={e.key}
                      onPress={() => cycleEmotionLevel(e.key)}
                      style={styles.energyChip}
                    >
                      <EmotionVisual emotion={e} size={26} radius={13} />
                      <Text style={styles.energyChipLabel}>{e.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          testID="reset-energy-map"
          style={styles.resetBtn}
          onPress={resetEnergyMap}
        >
          <Feather name="rotate-ccw" size={14} color={COLORS.textSecondary} />
          <Text style={styles.resetBtnText}>還原預設分類</Text>
        </Pressable>

        {/* Community settings — school-configurable */}
        <Text style={styles.sectionTitle}>社群權限設定</Text>

        <View style={styles.commCard}>
          {/* Toggle 1: student community enabled */}
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#DFF0DE' }]}>
              <Feather name="users" size={20} color="#5A7A6C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>學生社群</Text>
              <Text style={styles.actSub}>學生同學生之間匿名分享心情</Text>
            </View>
            <Switch
              testID="comm-student-enabled"
              value={communityConfig.studentCommunityEnabled}
              onValueChange={(v) => saveCommunity({ ...communityConfig, studentCommunityEnabled: v })}
              trackColor={{ true: '#7BA88C', false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>

          <View style={styles.policyDivider} />

          {/* Toggle 2: adult community enabled */}
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#E0EAFC' }]}>
              <Feather name="briefcase" size={20} color="#5A7A8C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>大人社群</Text>
              <Text style={styles.actSub}>老師 · 家長 · 輔導之間分享（學生一定睇唔到）</Text>
            </View>
            <Switch
              testID="comm-adult-enabled"
              value={communityConfig.adultCommunityEnabled}
              onValueChange={(v) => saveCommunity({ ...communityConfig, adultCommunityEnabled: v })}
              trackColor={{ true: '#7DBEE8', false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>

          <View style={styles.policyDivider} />

          {/* Toggle 3: adults can view student community */}
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#FFEAC2' }]}>
              <Feather name="eye" size={20} color="#DDB86A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>大人可睇學生社群</Text>
              <Text style={styles.actSub}>
                打開 → 老師/家長可以匿名瀏覽學生 post（監察用）{'\n'}
                關咗 → 大人完全睇唔到學生講咩（更保護細路）
              </Text>
            </View>
            <Switch
              testID="comm-adult-view-student"
              value={communityConfig.adultCanViewStudentCommunity}
              onValueChange={(v) => saveCommunity({ ...communityConfig, adultCanViewStudentCommunity: v })}
              trackColor={{ true: '#DDB86A', false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>

          <View style={styles.policyDivider} />

          {/* Anonymity level for student community */}
          <Text style={styles.policyLabel}>學生社群 · 顯示方式</Text>
          <View style={styles.chipRow}>
            {(['full', 'nickname'] as StudentAnonymity[]).map((level) => {
              const active = communityConfig.studentAnonymity === level;
              const label = level === 'full' ? '完全匿名（顯示「同學」）' : '顯示暱稱';
              return (
                <Pressable
                  key={level}
                  testID={`comm-anon-${level}`}
                  onPress={() => saveCommunity({ ...communityConfig, studentAnonymity: level })}
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
          <Text style={styles.anonHint}>
            推薦「完全匿名」· 細路仔講心事時更放心
          </Text>

          <View style={styles.policyDivider} />

          {/* Adult community anonymity — controls how adult posts display identity */}
          <Text style={styles.policyLabel}>大人社群 · 顯示方式</Text>
          <View style={styles.chipRow}>
            {([
              { level: 'role_and_name' as AdultAnonymity, label: '角色 + 名（推薦）' },
              { level: 'role_only'     as AdultAnonymity, label: '只顯示角色' },
              { level: 'full'          as AdultAnonymity, label: '完全匿名' },
            ]).map(({ level, label }) => {
              const active = communityConfig.adultAnonymity === level;
              return (
                <Pressable
                  key={level}
                  testID={`comm-adult-anon-${level}`}
                  onPress={() => saveCommunity({ ...communityConfig, adultAnonymity: level })}
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
          <Text style={styles.anonHint}>
            大人之間 peer support · 通常「角色 + 名」有助建立關係。學校可以按文化調整。
          </Text>

          <View style={styles.policyDivider} />

          {/* Post TTL — auto expiry from public feed */}
          <Text style={styles.policyLabel}>Post 自動消失時限</Text>
          <View style={styles.chipRow}>
            {[
              { d: 7,  label: '7 日' },
              { d: 30, label: '30 日（推薦）' },
              { d: 90, label: '90 日' },
              { d: 0,  label: '永久保留' },
            ].map(({ d, label }) => {
              const active = communityConfig.postTtlDays === d;
              return (
                <Pressable
                  key={d}
                  testID={`comm-ttl-${d}`}
                  onPress={() => saveCommunity({ ...communityConfig, postTtlDays: d })}
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
          <Text style={styles.anonHint}>
            超過時限嘅 post 唔會再喺 feed 見到 · 但校方/輔導可以喺下面「歷史檢閱」睇返
          </Text>
        </View>

        <View style={styles.policyHint}>
          <Feather name="shield" size={12} color="#7A5C3F" />
          <Text style={styles.policyHintText}>
            硬性規則：學生**永遠**唔會見到大人社群 · 呢個係 backend 級別鎖死 · 家長/校方冇權限可以 override。
          </Text>
        </View>

        {/* Community history (admin-only · includes expired posts) */}
        <Text style={styles.sectionTitle}>社群歷史檢閱</Text>

        <View style={styles.commCard}>
          <Text style={styles.historyIntro}>
            檢閱所有公開 post（包括已過期嘅）· 可以刪除唔恰當內容 · 每次刪除都有 audit log。
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              testID="history-load-student"
              onPress={() => loadHistory('student')}
              style={[styles.roleChip, historyScope === 'student' && history.length > 0 && styles.roleChipActive]}
            >
              <Feather name="users" size={11} color={historyScope === 'student' && history.length > 0 ? '#FFF' : COLORS.textPrimary} />
              <Text style={[styles.roleChipText, historyScope === 'student' && history.length > 0 && { color: '#FFF' }]}>
                學生社群 post
              </Text>
            </Pressable>
            <Pressable
              testID="history-load-adult"
              onPress={() => loadHistory('adult')}
              style={[styles.roleChip, historyScope === 'adult' && history.length > 0 && styles.roleChipActive]}
            >
              <Feather name="briefcase" size={11} color={historyScope === 'adult' && history.length > 0 ? '#FFF' : COLORS.textPrimary} />
              <Text style={[styles.roleChipText, historyScope === 'adult' && history.length > 0 && { color: '#FFF' }]}>
                大人社群 post
              </Text>
            </Pressable>
          </View>

          {historyLoading && (
            <Text style={styles.historyLoading}>載入緊…</Text>
          )}

          {!historyLoading && history.length === 0 && (
            <Text style={styles.historyEmpty}>撳上面 button 揀要睇邊個社群嘅歷史</Text>
          )}

          {history.map((e) => {
            const emKey = e.emotions?.[0] || e.emotion;
            const em = EMOTION_BY_KEY[emKey];
            const daysAgo = Math.floor(
              (Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24),
            );
            const isExpired = daysAgo > communityConfig.postTtlDays && communityConfig.postTtlDays > 0;
            return (
              <View key={e.id} style={[styles.historyItem, isExpired && styles.historyItemExpired]}>
                <View style={styles.historyItemHead}>
                  {em && <EmotionVisual emotion={em} size={26} radius={13} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyItemAuthor}>
                      {e.author_role_label || '同學'}
                      {isExpired && <Text style={styles.expiredBadge}>  已過期</Text>}
                    </Text>
                    <Text style={styles.historyItemDate}>
                      {e.entry_date} · {daysAgo === 0 ? '今日' : `${daysAgo} 日前`}
                    </Text>
                  </View>
                  <Pressable
                    testID={`history-delete-${e.id}`}
                    onPress={() => deleteHistoryEntry(e)}
                    hitSlop={8}
                    style={styles.historyDelete}
                  >
                    <Feather name="trash-2" size={14} color="#B44" />
                  </Pressable>
                </View>
                {e.note ? <Text style={styles.historyItemNote}>{e.note}</Text> : null}
              </View>
            );
          })}
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

  // Energy bucket config
  energyIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  energyIntroText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  energyBucket: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  energyBucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  energyDot: { width: 10, height: 10, borderRadius: 5 },
  energyBucketLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  energyBucketCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  energyEmpty: {
    fontSize: 12,
    color: COLORS.textDisabled,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  energyChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  energyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
  },
  energyChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  resetBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Community config card
  commCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  anonHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },

  // History section
  historyIntro: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  historyLoading: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  historyEmpty: {
    fontSize: 12,
    color: COLORS.textDisabled,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  historyItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  historyItemExpired: { opacity: 0.55 },
  historyItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  historyItemAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  expiredBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B44',
    fontStyle: 'italic',
  },
  historyItemDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  historyItemNote: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
    marginTop: 4,
    paddingLeft: 34,
  },
  historyDelete: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FDE0E0',
  },
});
