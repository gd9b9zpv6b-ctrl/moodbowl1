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
import { PostPolicy, DEFAULT_POST_POLICY, SchoolPostPolicy } from '@/src/lib/school-post-policy';
import { SchoolPolicies, DEFAULT_POLICIES } from '@/src/lib/school-policies';
import { AdultAnonymity, CommunityConfig, DEFAULT_CONFIG, SchoolCommunityConfig, StudentAnonymity } from '@/src/lib/school-community-config';
import { FamiliesSubpage } from '@/src/components/admin/families-subpage';
import { AuditSubpage } from '@/src/components/admin/audit-subpage';
import { EnergyMap, SchoolEnergyConfig } from '@/src/lib/school-energy-config';
import { api, Entry } from '@/src/lib/api';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const LEVEL_ORDER: EnergyLevel[] = ['high', 'steady', 'low'];

// 6-card grid navigation — home shows these cards, tap goes into a subpage.
type AdminView =
  | 'home'
  | 'dashboard'
  | 'accounts'
  | 'policy'
  | 'energy'
  | 'community'
  | 'history'
  | 'families'
  | 'audit';

const ADMIN_CARDS: {
  key: Exclude<AdminView, 'home'>;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  bg: string;
  iconColor: string;
}[] = [
  { key: 'dashboard', icon: 'bar-chart-2',  title: '📊 儀表板',     subtitle: '數據 · 警報 · 趨勢',      bg: '#DDE9F9', iconColor: '#5A7DA6' },
  { key: 'accounts',  icon: 'users',        title: '👥 學生 · 帳戶', subtitle: 'CSV · Invite · 家長配對', bg: '#EEE0F0', iconColor: '#7B5B9F' },
  { key: 'policy',    icon: 'shield',       title: '🚨 內容政策',    subtitle: '關鍵字 · 通知 · 閱讀權限', bg: '#FDECEC', iconColor: '#E86A6A' },
  { key: 'energy',    icon: 'zap',          title: '🎨 情緒能量',    subtitle: 'Icon 分類 · 客製化',       bg: '#FEE9CE', iconColor: '#B57D2A' },
  { key: 'community', icon: 'message-square', title: '💬 社群設定', subtitle: '匿名 · 可見度 · TTL',       bg: '#E4F0E8', iconColor: '#5A7A6C' },
  { key: 'history',   icon: 'archive',      title: '📜 社群歷史',    subtitle: '檢閱 · 刪除',              bg: '#E7EEF9', iconColor: '#3E5B7F' },
  { key: 'families',  icon: 'user-plus',    title: '👨‍👩‍👦 家長配對', subtitle: '建立 家長 ↔ 學生 pair',  bg: '#F5E5F0', iconColor: '#A64F8A' },
  { key: 'audit',     icon: 'clipboard',    title: '📋 Audit Log',   subtitle: '敏感操作紀錄 · 保留 7 年',   bg: '#F0EBE0', iconColor: '#7A5C3F' },
];


function nextLevel(level: EnergyLevel): EnergyLevel {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[(idx + 1) % LEVEL_ORDER.length];
}

export default function SchoolAdmin() {
  const [view, setView] = useState<AdminView>('home');
  const [policy, setPolicy] = useState<AlertPolicy>(DEFAULT_POLICY);
  const [newKeyword, setNewKeyword] = useState('');
  const [postPolicy, setPostPolicy] = useState<PostPolicy>(DEFAULT_POST_POLICY);
  const [newBanWord, setNewBanWord] = useState('');
  // Backend-backed source of truth for keyword arrays + parent-notify toggle.
  // Local `policy` / `postPolicy` above still owns UI-only flags (enable/notifyRoles/etc.).
  const [remotePolicies, setRemotePolicies] = useState<SchoolPolicies>(DEFAULT_POLICIES);
  const [energyMap, setEnergyMap] = useState<EnergyMap>(SchoolEnergyConfig.DEFAULT_MAP);
  const [communityConfig, setCommunityConfig] = useState<CommunityConfig>(DEFAULT_CONFIG);
  const [historyScope, setHistoryScope] = useState<'student' | 'adult'>('student');
  const [history, setHistory] = useState<Entry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    SchoolAlertPolicy.get().then(setPolicy);
    SchoolPostPolicy.get().then(setPostPolicy);
    SchoolEnergyConfig.get().then(setEnergyMap);
    SchoolCommunityConfig.get().then(setCommunityConfig);
    SchoolPolicies.get(true).then(setRemotePolicies).catch(() => {
      // network glitch — keep defaults · admin can retry when they save
    });
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

  const addKeyword = async () => {
    const k = newKeyword.trim();
    if (!k) return;
    if (remotePolicies.diary_keywords.includes(k)) {
      Alert.alert('已經有呢個字', `「${k}」已經喺監察名單。`);
      return;
    }
    try {
      const next = await SchoolPolicies.update({
        diary_keywords: [...remotePolicies.diary_keywords, k],
      });
      setRemotePolicies(next);
      savePolicy({ ...policy, keywords: next.diary_keywords });
      setNewKeyword('');
      // Item 7: 提示 admin — 新關鍵字唔會 retroactively scan 舊日記
      Alert.alert(
        '加咗「' + k + '」',
        'ℹ️ 呢個字只對之後嘅新日記生效 · 唔會回溯掃描之前已寫嘅日記。\n\n如果需要處理歷史 case · 請直接聯絡輔導老師。',
      );
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
  };

  const removeKeyword = async (k: string) => {
    try {
      const next = await SchoolPolicies.update({
        diary_keywords: remotePolicies.diary_keywords.filter((x) => x !== k),
      });
      setRemotePolicies(next);
      savePolicy({ ...policy, keywords: next.diary_keywords });
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
  };

  // === Community POST content policy ===
  const savePostPolicy = async (next: PostPolicy) => {
    setPostPolicy(next);
    await SchoolPostPolicy.set(next);
  };

  const togglePostFilter = (v: boolean) =>
    savePostPolicy({ ...postPolicy, postFilterEnabled: v });
  const toggleBlockCrisis = async (v: boolean) => {
    try {
      const next = await SchoolPolicies.update({ block_crisis_in_posts: v });
      setRemotePolicies(next);
      savePostPolicy({ ...postPolicy, blockCrisisInPosts: v });
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
  };

  const toggleNotifyParents = async (v: boolean) => {
    try {
      const next = await SchoolPolicies.update({ notify_parents_on_alert: v });
      setRemotePolicies(next);
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
  };

  const addBanWord = async () => {
    const k = newBanWord.trim();
    if (!k) return;
    if (remotePolicies.post_ban_keywords.includes(k)) {
      Alert.alert('已經有呢個字', `「${k}」已經喺 post 禁用清單。`);
      return;
    }
    try {
      const next = await SchoolPolicies.update({
        post_ban_keywords: [...remotePolicies.post_ban_keywords, k],
      });
      setRemotePolicies(next);
      savePostPolicy({ ...postPolicy, banKeywords: next.post_ban_keywords });
      setNewBanWord('');
      Alert.alert(
        '加咗「' + k + '」',
        'ℹ️ 只對之後嘅新 post 生效 · 唔會回溯處理之前 post 過嘅內容（因為社群 post 30 日內會自動刪 · 短期內舊 post 都會自動清走）。',
      );
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
  };

  const removeBanWord = async (k: string) => {
    try {
      const next = await SchoolPolicies.update({
        post_ban_keywords: remotePolicies.post_ban_keywords.filter((x) => x !== k),
      });
      setRemotePolicies(next);
      savePostPolicy({ ...postPolicy, banKeywords: next.post_ban_keywords });
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試');
    }
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
        {/* School hero — always visible so admin knows where they are */}
        <View style={styles.hero}>
          <Text style={styles.heroSchool}>飯碗小學（示範）</Text>
          <Text style={styles.heroSub}>訂閱狀態 · Enterprise · 2025-08 至 2026-08</Text>
        </View>

        {view !== 'home' && (
          <Pressable
            testID="admin-back-home"
            onPress={() => setView('home')}
            style={styles.backRow}
          >
            <Feather name="chevron-left" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backText}>返回中心</Text>
          </Pressable>
        )}

        {view === 'home' && (
          <>
            {/* Self-care CTA — school leaders also carry emotional weight */}
            <RoleSelfCareCard
              bg="#F0E6F5"
              border="#D7BEE8"
              bowlBg="#FFF"
              bowlKey="peaceful"
              title="校長 · 主任都用得到"
              subtitle="決策壓力大 · 撳我體驗學生嘅版面 · 幫自己 recharge"
            />

            <View style={styles.gridWrap}>
              {ADMIN_CARDS.map((card) => (
                <Pressable
                  key={card.key}
                  testID={`admin-nav-${card.key}`}
                  onPress={() => setView(card.key)}
                  style={[styles.gridCard, { backgroundColor: card.bg }]}
                >
                  <View style={[styles.gridIcon, { backgroundColor: '#FFF' }]}>
                    <Feather name={card.icon} size={22} color={card.iconColor} />
                  </View>
                  <Text style={styles.gridTitle}>{card.title}</Text>
                  <Text style={styles.gridSub}>{card.subtitle}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.footerNote}>
              <Feather name="shield" size={13} color="#7A5C3F" />
              <Text style={styles.footerText}>
                所有學生私隱資料加密儲存 · 符合《個人資料（私隱）條例》· 老師/家長 access 均有 audit trail。
              </Text>
            </View>
          </>
        )}

        {view === 'dashboard' && (
          <>
            <Text style={styles.subpageTitle}>📊 儀表板 · 數據概覽</Text>
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
          </>
        )}

        {view === 'accounts' && (
          <>
            <Text style={styles.subpageTitle}>👥 學生 · 帳戶管理</Text>

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

        <Pressable style={styles.actionCard} onPress={() => setView('families')}>
          <View style={[styles.actIcon, { backgroundColor: '#FDECEC' }]}>
            <Feather name="user-plus" size={22} color="#E86A6A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>家長 · 學生 配對</Text>
            <Text style={styles.actSub}>Admin 建立新配對 · 一次搞掂兩個帳戶</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => setView('audit')}>
          <View style={[styles.actIcon, { backgroundColor: '#E7EEF9' }]}>
            <Feather name="clipboard" size={22} color="#3E5B7F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>Audit Log · 敏感操作紀錄</Text>
            <Text style={styles.actSub}>邊個 · 幾時 · 做過乜（保留 7 年）</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
        </Pressable>
          </>
        )}

        {view === 'families' && <FamiliesSubpage />}
        {view === 'audit' && <AuditSubpage />}

        {view === 'policy' && (
          <>
            <Text style={styles.subpageTitle}>🚨 內容政策</Text>

        <View style={styles.policyIntro}>
          <Feather name="info" size={12} color="#5A7A6C" />
          <Text style={styles.policyIntroText}>
            分開兩套字：{'\n'}
            🚨 <Text style={{ fontWeight: '700' }}>日記警示字</Text> — 學生喺 private 日記寫呢啲字 · 會通知輔導老師。{'\n'}
            🛡️ <Text style={{ fontWeight: '700' }}>Post 禁用字</Text> — 出街 post 唔可以有嘅字（粗口等）· 系統會阻止出 post。日記可以講任何說話。
          </Text>
        </View>

        {/* Master toggle: keyword monitoring */}
        <View style={styles.policyCard}>
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#FDE0E0' }]}>
              <Feather name="alert-octagon" size={20} color="#E86A6A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>🚨 日記警示字 · 緊急通報</Text>
              <Text style={styles.actSub}>
                當學生日記出現呢啲字 · 系統自動通知揀好嘅老師（日記係 private · 只作安全警示用）
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

              <Text style={styles.policyLabel}>監察嘅字詞（{remotePolicies.diary_keywords.length} 個）</Text>
              <View style={styles.chipRow}>
                {remotePolicies.diary_keywords.map((k) => (
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
                {remotePolicies.diary_keywords.length === 0 && (
                  <Text style={styles.emptyChipText}>暫時冇監察字 · 加多個試下</Text>
                )}
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

        {/* ==== Community POST content filter · separate from diary alerts ==== */}
        <View style={styles.policyCard}>
          <View style={styles.policyRow}>
            <View style={[styles.actIcon, { backgroundColor: '#E7EEF9' }]}>
              <Feather name="shield" size={20} color="#5A7DA6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>🛡️ Post 禁用字 · 內容審查</Text>
              <Text style={styles.actSub}>
                學生出社群 post 如含呢啲字 · 會被阻止出街（日記唔會受影響）
              </Text>
            </View>
            <Switch
              testID="post-filter-toggle"
              value={postPolicy.postFilterEnabled}
              onValueChange={togglePostFilter}
              trackColor={{ true: '#5A7DA6', false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>

          {postPolicy.postFilterEnabled && (
            <>
              <View style={styles.policyDivider} />

              <Text style={styles.policyLabel}>
                禁用字（{remotePolicies.post_ban_keywords.length} 個）· 撳一撳可以移除
              </Text>
              <View style={styles.chipRow}>
                {remotePolicies.post_ban_keywords.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => Alert.alert(
                      `移除「${k}」？`,
                      '之後學生 post 可以有呢個字。',
                      [
                        { text: '取消', style: 'cancel' },
                        { text: '移除', style: 'destructive', onPress: () => removeBanWord(k) },
                      ],
                    )}
                    style={[styles.chip, { backgroundColor: '#E7EEF9' }]}
                  >
                    <Text style={[styles.chipText, { color: '#3E5B7F' }]}>{k}</Text>
                    <Feather name="x" size={11} color="#3E5B7F" />
                  </Pressable>
                ))}
                {remotePolicies.post_ban_keywords.length === 0 && (
                  <Text style={styles.emptyChipText}>暫時冇禁用字 · 加多個試下</Text>
                )}
              </View>

              <View style={styles.addRow}>
                <TextInput
                  testID="post-new-banword"
                  value={newBanWord}
                  onChangeText={setNewBanWord}
                  placeholder="加多一個禁用字…（例：粗口）"
                  placeholderTextColor={COLORS.textDisabled}
                  style={styles.addInput}
                  onSubmitEditing={addBanWord}
                  returnKeyType="done"
                />
                <Pressable
                  testID="post-add-banword"
                  onPress={addBanWord}
                  disabled={!newBanWord.trim()}
                  style={[styles.addBtn, { backgroundColor: '#5A7DA6' }, !newBanWord.trim() && { opacity: 0.4 }]}
                >
                  <Feather name="plus" size={16} color="#FFF" />
                </Pressable>
              </View>

              <View style={styles.policyDivider} />

              <View style={styles.policyRow}>
                <View style={[styles.actIcon, { backgroundColor: '#FDE0E0' }]}>
                  <Feather name="alert-triangle" size={20} color="#E86A6A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>連危機字（跳樓/自殺等）都阻止出 post</Text>
                  <Text style={styles.actSub}>
                    保護其他同學避免被觸發 · 系統仍會通知輔導老師（推薦開）
                  </Text>
                </View>
                <Switch
                  value={remotePolicies.block_crisis_in_posts}
                  onValueChange={toggleBlockCrisis}
                  trackColor={{ true: '#E86A6A', false: COLORS.bgInput }}
                  thumbColor={COLORS.bgCard}
                />
              </View>

              <View style={styles.policyDivider} />

              <View style={styles.policyRow}>
                <View style={[styles.actIcon, { backgroundColor: '#F3E7F9' }]}>
                  <Feather name="users" size={20} color="#7D5AA6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>危機字警示通知家長</Text>
                  <Text style={styles.actSub}>
                    開咗之後 · 家長會喺 app 見到自己小朋友嘅危機警報（敏感 · 建議先同輔導老師夾好流程）
                  </Text>
                </View>
                <Switch
                  testID="notify-parents-toggle"
                  value={remotePolicies.notify_parents_on_alert}
                  onValueChange={toggleNotifyParents}
                  trackColor={{ true: '#7D5AA6', false: COLORS.bgInput }}
                  thumbColor={COLORS.bgCard}
                />
              </View>

              <View style={styles.policyDivider} />

              {/* 💛 High-sensitivity toggle · counsellor view note content */}
              <View style={styles.consentBox}>
                <Text style={styles.consentTitle}>💛 尊重學生私隱</Text>
                <Text style={styles.consentBody}>
                  日記係學生嘅私人空間 · 一般情況下老師淨係應該見到觸發嘅字眼。{'\n'}
                  開咗呢個權限之後 · 輔導老師可以逐條 alert 揀「查看內容」· 但我哋強烈建議：{'\n'}
                  1. 先聯絡學生 · 攞到佢同意先睇{'\n'}
                  2. 只有喺高風險／緊急情況先例外{'\n'}
                  3. 每次「查看內容」都會留 audit log · 校長可以查{'\n\n'}
                  <Text style={{ fontWeight: '800' }}>
                    學生嘅信任係好脆弱嘅 · 一次未經同意嘅偷睇 · 可能永遠打散佢對呢個平台嘅信賴。
                  </Text>
                </Text>
                <View style={[styles.policyRow, { marginTop: SPACING.sm }]}>
                  <View style={[styles.actIcon, { backgroundColor: '#F5E1E1' }]}>
                    <Feather name="eye" size={20} color="#8A3F3F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actTitle}>允許輔導老師「查看日記內容」</Text>
                    <Text style={styles.actSub}>
                      每次撳「查看」都要 confirm 同意 · 全部有 audit
                    </Text>
                  </View>
                  <Switch
                    testID="counsellor-view-toggle"
                    value={remotePolicies.counsellor_can_view_note_content}
                    onValueChange={async (v) => {
                      try {
                        const next = await SchoolPolicies.update({ counsellor_can_view_note_content: v });
                        setRemotePolicies(next);
                      } catch (e: any) {
                        Alert.alert('儲存失敗', e?.message || '請再試');
                      }
                    }}
                    trackColor={{ true: '#8A3F3F', false: COLORS.bgInput }}
                    thumbColor={COLORS.bgCard}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.policyHint}>
          <Feather name="info" size={12} color="#7A5C3F" />
          <Text style={styles.policyHintText}>
            日記可以自由發洩（包括粗口）· Post 則要適合公開俾其他同學睇。兩套字獨立設定。
          </Text>
        </View>
          </>
        )}

        {view === 'energy' && (
          <>
            <Text style={styles.subpageTitle}>🎨 情緒能量分類</Text>
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
          </>
        )}

        {view === 'community' && (
          <>
            <Text style={styles.subpageTitle}>💬 社群設定</Text>

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
          </>
        )}

        {view === 'history' && (
          <>
            <Text style={styles.subpageTitle}>📜 社群歷史檢閱</Text>

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
          </>
        )}

        {view === 'dashboard' && (
          <>
            <Text style={styles.sectionTitle}>報告</Text>

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
          </>
        )}

        {view !== 'home' && (
          <View style={styles.footerNote}>
            <Feather name="shield" size={13} color="#7A5C3F" />
            <Text style={styles.footerText}>
              所有學生私隱資料加密儲存 · 符合《個人資料（私隱）條例》· 老師/家長 access 均有 audit trail。
            </Text>
          </View>
        )}

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

  // Home grid — 2-col card layout
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  gridCard: {
    width: '47%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  gridSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },

  // Back button + subpage title (visible in subpages only)
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subpageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

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
  consentBox: {
    backgroundColor: '#F9EFEF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#8A3F3F',
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A3F3F',
    marginBottom: SPACING.sm,
  },
  consentBody: {
    fontSize: 12,
    color: '#5A3F3F',
    lineHeight: 19,
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
  policyIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: '#EEF5F1',
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: '#7BA88C',
  },
  policyIntroText: {
    flex: 1,
    fontSize: 12,
    color: '#3F5A4D',
    lineHeight: 18,
  },
  emptyChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 4,
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
