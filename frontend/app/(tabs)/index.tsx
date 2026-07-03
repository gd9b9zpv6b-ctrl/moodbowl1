import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { randomAdjective, randomAffirmation } from '@/src/constants/affirmations';
import { EMOTIONS, Emotion, EMOTION_BY_KEY, EMOTION_CATEGORIES, EmotionCategory } from '@/src/constants/emotions';
import { ENERGY_BY_KEY, EnergyLevel } from '@/src/constants/energy';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';
import { isDiaryUnlocked } from '@/src/lib/diary-lock';
import { EmotionVisual } from '@/src/components/emotion-visual';
import { EnergySlider } from '@/src/components/energy-slider';
import { PinUnlockModal } from '@/src/components/pin-unlock-modal';
import { EntryEditModal } from '@/src/components/entry-edit-modal';
import { SupportCtaRow } from '@/src/components/support-cta-row';
import { useRecentEmotions } from '@/src/hooks/use-recent-emotions';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Session-scoped flag: reset when app fully closes & reopens.
// This means onboarding shows once per app launch, not every navigation.
let onboardingShownThisSession = false;
export const resetOnboardingSession = () => {
  onboardingShownThisSession = false;
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(false);
  const [secret, setSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(randomAffirmation());
  const [adjective, setAdjective] = useState(randomAdjective());
  const [unlocked, setUnlocked] = useState(isDiaryUnlocked());
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmotionCategory | 'all'>('all');
  const { recent, track } = useRecentEmotions();

  // Show onboarding on EVERY app launch (once per session — not on every navigation)
  // - Non-student REAL roles (user.role !== 'student'): skip onboarding entirely
  //   AND if their local RoleStorage still points to their role, redirect to dashboard.
  //   If RoleStorage was set to 'student' (via self-care card), just stay on student home.
  useEffect(() => {
    (async () => {
      const { RoleStorage, ROLE_META } = await import('@/src/lib/role-storage');
      const localRole = await RoleStorage.get();
      const realRole = (user?.role || 'student') as typeof localRole;

      // If non-student user hasn't opted into student mode (RoleStorage still their role),
      // redirect them to their dashboard.
      if (realRole !== 'student' && localRole === realRole) {
        router.replace(ROLE_META[realRole].homePath as never);
        return;
      }

      // Skip onboarding entirely for non-students (even if they're temporarily in student mode)
      if (realRole !== 'student') return;

      // Student: show onboarding once per session
      if (!onboardingShownThisSession) {
        onboardingShownThisSession = true;
        router.replace('/onboarding');
      }
    })();
  }, [router, user?.role]);

  const selectedEmotions = useMemo(
    () => selectedKeys.map((k) => EMOTION_BY_KEY[k]).filter(Boolean) as Emotion[],
    [selectedKeys],
  );
  const primarySelected = selectedEmotions[0];

  // Dominant energy level among selected emotions — used for peer-normalization tip.
  // Priority: low > high > steady (we surface low first because that's when reassurance matters most).
  const dominantEnergy: EnergyLevel | null = useMemo(() => {
    if (selectedEmotions.length === 0) return null;
    const levels = selectedEmotions.map((e): EnergyLevel => (ENERGY_BY_KEY[e.key] as EnergyLevel) || 'steady');
    if (levels.includes('low')) return 'low';
    if (levels.includes('high')) return 'high';
    return 'steady';
  }, [selectedEmotions]);

  const today = useMemo(() => todayISO(), []);

  const toggleSelect = (e: Emotion) => {
    setSelectedKeys((prev) => {
      const next = prev.includes(e.key) ? prev.filter((k) => k !== e.key) : [...prev, e.key];
      // 揀咗樹洞 · 自動 turn on 密碼保護（如果已設密碼）
      if (e.key === 'hollow' && !prev.includes('hollow') && user?.has_secret_pin) {
        setSecret(true);
        setShare(false);
      }
      return next;
    });
  };

  const renderEmotionBtn = (e: Emotion) => {
    const active = selectedKeys.includes(e.key);
    const orderIdx = selectedKeys.indexOf(e.key);
    return (
      <Pressable
        key={e.key}
        testID={`emotion-${e.key}-picker`}
        onPress={() => toggleSelect(e)}
        style={[
          styles.emotionBtn,
          { backgroundColor: e.color + '80' },
          active && styles.emotionBtnActive,
        ]}
      >
        <View style={styles.emotionImgWrap}>
          <EmotionVisual emotion={e} size={90} radius={RADIUS.md} />
        </View>
        <Text style={styles.emotionLabel}>{e.label}</Text>
        {active && (
          <View style={styles.emotionCheckBadge}>
            <Text style={styles.emotionCheckText}>{orderIdx + 1}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Entry[]>('/entries');
      setTodayEntries(list.filter((e) => e.entry_date === today));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      setAffirmation(randomAffirmation());
      setAdjective(randomAdjective());
      load();
    }, [load]),
  );

  const save = async () => {
    if (selectedKeys.length === 0) return;
    setSaving(true);
    try {
      await api.post<Entry>('/entries', {
        emotions: selectedKeys,
        note,
        is_public: share,
        is_secret: secret,
        energy_level: energy,
        entry_date: today,
      });
      // remember recent picks locally
      await track(selectedKeys);
      setSelectedKeys([]);
      setNote('');
      setShare(false);
      setSecret(false);
      setEnergy(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const promptUnlock = () => {
    setPinModalVisible(true);
  };

  const styleBg = user?.diary_style?.bg;
  const bg = primarySelected
    ? primarySelected.color + '30'
    : (styleBg || COLORS.bgMain);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.greeting} testID="home-greeting">
              你好,
              <Text style={styles.greetingAdj}>{adjective}</Text>
              {user?.display_name || '朋友'}
            </Text>
            <Text style={styles.prompt}>而家你有咩感受?</Text>

            <Pressable
              testID="affirmation-card"
              onPress={() => setAffirmation(randomAffirmation())}
              style={styles.affirmationCard}
            >
              <View style={styles.affirmationHeader}>
                <Feather name="feather" size={14} color={COLORS.primary} />
                <Text style={styles.affirmationHeaderText}>少少溫柔時光</Text>
              </View>
              <Text style={styles.affirmationText}>「{affirmation}」</Text>
              <View style={styles.affirmationFooter}>
                <Feather name="refresh-cw" size={12} color={COLORS.primary} />
                <Text style={styles.affirmationFooterText}>撳一下 · 換一句俾自己聽</Text>
              </View>
            </Pressable>

            <Pressable
              testID="sos-calm-card"
              onPress={() => router.push('/calm')}
              style={styles.sosCard}
            >
              <View style={styles.sosIcon}>
                <Feather name="wind" size={22} color={COLORS.bgCard} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosTitle}>情緒好激動？</Text>
                <Text style={styles.sosSub}>試吓平復情緒嘅小錦囊 · 5 個溫柔方法</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
            </Pressable>

            <View style={styles.emotionPromptRow}>
              <Text style={styles.emotionPromptTitle}>你今日嘅感受點啊?</Text>
              <Text style={styles.emotionPromptHint}>
                撳一個或多個飯碗 · 記低呢一刻 (可以揀幾個一齊)
              </Text>
            </View>

            {/* Search + category chips */}
            <View style={styles.searchWrap}>
              <Feather name="search" size={16} color={COLORS.textSecondary} />
              <TextInput
                testID="emotion-search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜尋心情 (例如：焦慮 / 感恩)"
                placeholderTextColor={COLORS.textDisabled}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Feather name="x-circle" size={16} color={COLORS.textSecondary} />
                </Pressable>
              )}
            </View>

            {!searchQuery && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsRow}
              >
                <Pressable
                  testID="cat-chip-all"
                  onPress={() => setActiveCategory('all')}
                  style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
                >
                  <Text style={styles.catChipText}>全部</Text>
                </Pressable>
                {EMOTION_CATEGORIES.map((c) => (
                  <Pressable
                    key={c.key}
                    testID={`cat-chip-${c.key}`}
                    onPress={() => setActiveCategory(c.key)}
                    style={[
                      styles.catChip,
                      { backgroundColor: c.color + '80' },
                      activeCategory === c.key && styles.catChipActive,
                    ]}
                  >
                    <Text style={styles.catChipText}>{c.short}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Recent emotions quick row */}
            {!searchQuery && activeCategory === 'all' && recent.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Feather name="clock" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.recentLabel}>你最近用過</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {recent
                    .map((k) => EMOTION_BY_KEY[k])
                    .filter(Boolean)
                    .map((e) => {
                      const active = selectedKeys.includes(e.key);
                      return (
                        <Pressable
                          key={`recent-${e.key}`}
                          testID={`recent-${e.key}`}
                          onPress={() => toggleSelect(e)}
                          style={[
                            styles.recentChip,
                            { backgroundColor: e.color + '80' },
                            active && styles.emotionBtnActive,
                          ]}
                        >
                          <EmotionVisual emotion={e} size={44} radius={RADIUS.sm} />
                          <Text style={styles.recentChipLabel}>{e.label}</Text>
                        </Pressable>
                      );
                    })}
                </ScrollView>
              </View>
            )}

            {/* Emotion grid grouped by category (or filtered by search) */}
            <View testID="emotion-grid">
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = q
                  ? EMOTIONS.filter(
                      (e) =>
                        e.label.toLowerCase().includes(q) ||
                        e.description.toLowerCase().includes(q),
                    )
                  : activeCategory === 'all'
                  ? EMOTIONS
                  : EMOTIONS.filter((e) => e.category === activeCategory);

                if (filtered.length === 0) {
                  return (
                    <Text style={styles.emptyText}>冇對應嘅心情...試下其他字?</Text>
                  );
                }

                // Group by category when 'all' & no search — else flat.
                if (q || activeCategory !== 'all') {
                  return (
                    <View style={styles.grid}>
                      {filtered.map((e) => renderEmotionBtn(e))}
                    </View>
                  );
                }

                return EMOTION_CATEGORIES.map((cat) => {
                  const items = filtered.filter((e) => e.category === cat.key);
                  if (items.length === 0) return null;
                  return (
                    <View key={cat.key} style={{ marginBottom: SPACING.md }}>
                      <View style={styles.groupHeader}>
                        <View style={[styles.groupDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.groupHeaderText}>{cat.label}</Text>
                        <Text style={styles.groupHeaderCount}>{items.length}</Text>
                      </View>
                      <View style={styles.grid}>{items.map(renderEmotionBtn)}</View>
                    </View>
                  );
                });
              })()}
            </View>

            {primarySelected && (
              <View style={styles.journalCard} testID="journal-card">
                <View style={styles.journalHeader}>
                  <View style={styles.selectedRow}>
                    {selectedEmotions.slice(0, 5).map((e) => (
                      <Pressable
                        key={e.key}
                        testID={`selected-chip-${e.key}`}
                        onPress={() => toggleSelect(e)}
                        style={styles.selectedChip}
                      >
                        <EmotionVisual emotion={e} size={44} radius={RADIUS.sm} />
                        <Feather
                          name="x-circle"
                          size={14}
                          color={COLORS.textSecondary}
                          style={styles.selectedChipRemove}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ marginTop: SPACING.sm }}>
                    <Text style={styles.journalTitle}>
                      而家覺得 {selectedEmotions.map((e) => e.label).join(' · ')}
                    </Text>
                    <Text style={styles.journalHint}>
                      {selectedEmotions.length === 1
                        ? primarySelected.description
                        : `一次過記低 ${selectedEmotions.length} 種心情`}
                    </Text>
                  </View>
                </View>
                <TextInput
                  testID="journal-note-input"
                  placeholder="諗緊乜嘢?想寫啲咩都可以..."
                  placeholderTextColor={COLORS.textDisabled}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                  style={styles.journalInput}
                />

                {/* Peer normalization — reassure kid that low/high energy is normal & shared */}
                {dominantEnergy === 'low' && (
                  <View testID="peer-tip-low" style={styles.peerTip}>
                    <Text style={styles.peerTipEmoji}>💛</Text>
                    <Text style={styles.peerTipText}>
                      <Text style={styles.peerTipBold}>你唔係一個人 · </Text>
                      今日全校差唔多 35% 同學仔都揀咗低能量情緒。
                    </Text>
                  </View>
                )}
                {dominantEnergy === 'high' && selectedEmotions.some((e) => ['angry', 'furious', 'anxious', 'irritable', 'scared'].includes(e.key)) && (
                  <View testID="peer-tip-high" style={styles.peerTip}>
                    <Text style={styles.peerTipEmoji}>🧡</Text>
                    <Text style={styles.peerTipText}>
                      <Text style={styles.peerTipBold}>好激動嘅感覺都好正常 · </Text>
                      唔洗擔心 · 慢慢寫低發生咗咩事。
                    </Text>
                  </View>
                )}

                {/* Battery slider — energy dimension (independent of emotion label) */}
                <EnergySlider value={energy} onChange={setEnergy} />

                {/* Privacy reassurance banner — always visible */}
                <View style={styles.privacyBanner}>
                  <Feather name="eye-off" size={13} color="#7BA88C" />
                  <Text style={styles.privacyBannerText}>
                    <Text style={styles.privacyBannerBold}>只有你自己睇到 · </Text>
                    老師 · 家長 · 冇任何人可以偷睇你嘅日記
                  </Text>
                </View>

                <View style={styles.shareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareLabel}>匿名分享俾社群</Text>
                    <Text style={styles.shareHint}>
                      其他朋友可能會送你一個心心
                    </Text>
                  </View>
                  <Switch
                    testID="share-toggle"
                    value={share}
                    onValueChange={(v) => { setShare(v); if (v) setSecret(false); }}
                    trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
                    thumbColor={COLORS.bgCard}
                  />
                </View>
                <View style={styles.shareRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="lock" size={14} color="#E86A6A" />
                    <View>
                      <Text style={styles.shareLabel}>加多層密碼保護</Text>
                      <Text style={styles.shareHint}>
                        {user?.has_secret_pin
                          ? '要輸入 4 位密碼先睇到呢篇'
                          : '未設定密碼 · 撳去設定 4 位密碼'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    testID="secret-toggle"
                    value={secret}
                    onValueChange={(v) => {
                      if (v && !user?.has_secret_pin) {
                        router.push('/premium/pin');
                        return;
                      }
                      setSecret(v);
                      if (v) setShare(false);
                    }}
                    trackColor={{ true: '#E86A6A', false: COLORS.bgInput }}
                    thumbColor={COLORS.bgCard}
                  />
                </View>
                <Pressable
                  testID="save-entry-btn"
                  disabled={saving}
                  onPress={save}
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.textPrimary} />
                  ) : (
                    <Text style={styles.saveBtnText}>記錄呢一刻</Text>
                  )}
                </Pressable>
              </View>
            )}

            {saved && (
              <View style={styles.savedBanner} testID="saved-banner">
                <Feather name="check-circle" size={18} color={COLORS.primary} />
                <Text style={styles.savedText}>記低咗喇。對自己溫柔啲。</Text>
              </View>
            )}

            <Pressable
              testID="garden-card"
              onPress={() => router.push('/garden')}
              style={styles.gardenCard}
            >
              <View style={styles.gardenEmojiWrap}>
                <Text style={styles.gardenEmoji}>🌾</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gardenTitle}>我嘅稻田</Text>
                <Text style={styles.gardenSub}>用 ❤️ 種一粒米 · 收成一碗新心情</Text>
              </View>
              <View style={styles.gardenBadge}>
                <Text style={styles.gardenBadgeText}>新</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textPrimary} />
            </Pressable>

            <View style={{ marginTop: SPACING.xl }}>
              <SupportCtaRow title="需要陪伴嘅時候" />
              <Pressable
                testID="cta-explore"
                style={styles.exploreCard}
                onPress={() => router.push('/explore')}
              >
                <View style={styles.exploreIcon}>
                  <Feather name="book-open" size={22} color={COLORS.textPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exploreTitle}>探索自己 · 回望</Text>
                  <Text style={styles.exploreSub}>
                    溫柔咁記起過去 · 認識自己多啲
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <View style={{ marginTop: SPACING.lg }}>
              <View style={styles.todayHeaderRow}>
                <Text style={styles.sectionTitle}>今日故事</Text>
                {todayEntries.length > 0 && (
                  <View style={styles.todayHint}>
                    <Feather name="edit-2" size={11} color={COLORS.primary} />
                    <Text style={styles.todayHintText}>撳一下 · 編輯</Text>
                  </View>
                )}
              </View>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
              ) : todayEntries.length === 0 ? (
                <Text style={styles.emptyText} testID="today-empty">
                  今日仲未有故事。撳上面揀下你嘅感受,開始寫。
                </Text>
              ) : (
                todayEntries.map((entry) => {
                  const emList = (entry.emotions?.length ? entry.emotions : [entry.emotion])
                    .map((k) => EMOTION_BY_KEY[k])
                    .filter(Boolean);
                  const em = emList[0];
                  const locked = entry.is_secret && !unlocked;
                  return (
                    <Pressable
                      key={entry.id}
                      testID={`today-entry-${entry.id}`}
                      onPress={() => {
                        if (locked) {
                          promptUnlock();
                        } else {
                          setEditingEntry(entry);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.entryCard,
                        { backgroundColor: (em?.color || COLORS.primaryLight) + '40' },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.entryHeader}>
                        <View style={styles.entryEmotionStack}>
                          {emList.slice(0, 3).map((e, i) => (
                            <View
                              key={e.key}
                              style={[
                                styles.entryEmotionStackItem,
                                { marginLeft: i === 0 ? 0 : -14, zIndex: 3 - i },
                              ]}
                            >
                              <EmotionVisual emotion={e} size={40} radius={RADIUS.sm} />
                            </View>
                          ))}
                          {emList.length > 3 && (
                            <View style={styles.entryMoreBadge}>
                              <Text style={styles.entryMoreText}>+{emList.length - 3}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.entryEmotion} numberOfLines={1}>
                          {emList.map((e) => e.label).join(' · ')}
                        </Text>
                        {entry.is_secret && (
                          <View style={[styles.publicBadge, { backgroundColor: '#FFE4E4' }]}>
                            <Feather name="lock" size={12} color="#E86A6A" />
                            <Text style={[styles.publicText, { color: '#E86A6A' }]}>秘密</Text>
                          </View>
                        )}
                        {entry.is_public && (
                          <View style={styles.publicBadge}>
                            <Feather name="users" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.publicText}>已分享</Text>
                          </View>
                        )}
                        {!locked && (
                          <Feather
                            name="edit-2"
                            size={14}
                            color={COLORS.textSecondary}
                            style={{ opacity: 0.6 }}
                          />
                        )}
                      </View>
                      {locked ? (
                        <View style={styles.lockedBox}>
                          <Feather name="lock" size={16} color="#E86A6A" />
                          <Text style={styles.lockedText}>撳一下 輸入密碼解鎖</Text>
                        </View>
                      ) : entry.note ? (
                        <>
                          <Text
                            numberOfLines={3}
                            style={styles.entryNote}
                          >
                            {entry.note}
                          </Text>
                          {entry.note.length > 60 && (
                            <Text style={styles.readMore}>撳一下 · 睇全部 / 編輯</Text>
                          )}
                        </>
                      ) : (
                        <Text style={styles.entryEmptyNote}>
                          仲未寫故事 · 撳我加返
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={{ height: SPACING.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <PinUnlockModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onUnlocked={() => setUnlocked(true)}
      />
      <EntryEditModal
        visible={!!editingEntry}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={(updated) => {
          setTodayEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        }}
        onDeleted={(id) => {
          setTodayEntries((prev) => prev.filter((e) => e.id !== id));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  greeting: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 34 },
  greetingAdj: { color: COLORS.primary },
  prompt: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  affirmationCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  affirmationHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  affirmationText: {
    fontSize: 18,
    lineHeight: 30,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  affirmationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgInput,
  },
  affirmationFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#EEE0F0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sosIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: '#C7A6D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sosSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  gardenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#DFF3E4',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: 0,
  },
  gardenEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: '#B9DBBC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenEmoji: { fontSize: 26 },
  gardenTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  gardenSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  gardenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#7BA88C',
  },
  gardenBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.bgCard },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#E4F0E8',
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#4A6B54',
    lineHeight: 15,
  },
  privacyBannerBold: {
    fontWeight: '800',
    color: '#3A5545',
  },
  peerTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFF6E5',
    borderWidth: 1,
    borderColor: '#F0D8A8',
    marginTop: SPACING.sm,
  },
  peerTipEmoji: { fontSize: 18 },
  peerTipText: {
    flex: 1,
    fontSize: 12,
    color: '#7A5C3F',
    lineHeight: 17,
  },
  peerTipBold: {
    fontWeight: '800',
    color: '#5A3F1F',
  },
  ctaRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  ctaCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  ctaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#FFC8DD',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  exploreIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFB3D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  exploreSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emotionBtn: {
    width: '31%',
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    position: 'relative',
  },
  emotionBtnActive: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  emotionCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  emotionCheckText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  selectedChip: {
    position: 'relative',
  },
  selectedChipRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
  },
  emotionImgWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  emotionLabel: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  journalCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  journalHeader: {
    marginBottom: SPACING.md,
  },
  journalHeaderImg: { width: 60, height: 60, borderRadius: RADIUS.md },
  journalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  journalHint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  journalInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 120,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  shareLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  shareHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  saveBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  savedBanner: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  savedText: { color: COLORS.textPrimary, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  todayHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  todayHintText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  emotionPromptRow: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  emotionPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emotionPromptHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  categoryChipsRow: {
    gap: SPACING.xs,
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catChipActive: {
    borderColor: COLORS.primary,
  },
  catChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  recentSection: {
    marginBottom: SPACING.md,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  recentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  recentRow: { gap: SPACING.sm, paddingRight: SPACING.md, paddingBottom: SPACING.xs },
  recentChip: {
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    alignItems: 'center',
    minWidth: 68,
  },
  recentChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  groupHeaderCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
  },
  entryEmptyNote: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  readMore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  entryCard: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  entryEmotionStack: { flexDirection: 'row', alignItems: 'center' },
  entryEmotionStackItem: {
    borderWidth: 2,
    borderColor: COLORS.bgCard,
    borderRadius: RADIUS.sm + 2,
  },
  entryMoreBadge: {
    marginLeft: 4,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  entryMoreText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  entryImg: { width: 40, height: 40, borderRadius: RADIUS.sm },
  entryEmotion: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
  },
  publicText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  entryNote: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  lockedBox: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFE4E4',
  },
  lockedText: { color: '#E86A6A', fontWeight: '700', fontSize: 13 },
});
