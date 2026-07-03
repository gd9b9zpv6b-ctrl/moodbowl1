import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

import { randomAffirmation } from '@/src/constants/affirmations';
import { EMOTIONS, Emotion, EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';
import { isDiaryUnlocked } from '@/src/lib/diary-lock';
import { EmotionVisual } from '@/src/components/emotion-visual';
import { PinUnlockModal } from '@/src/components/pin-unlock-modal';
import { EntryEditModal } from '@/src/components/entry-edit-modal';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(false);
  const [secret, setSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(randomAffirmation());
  const [unlocked, setUnlocked] = useState(isDiaryUnlocked());
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const today = useMemo(() => todayISO(), []);

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
      load();
    }, [load]),
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post<Entry>('/entries', {
        emotion: selected.key,
        note,
        is_public: share,
        is_secret: secret,
        entry_date: today,
      });
      setSelected(null);
      setNote('');
      setShare(false);
      setSecret(false);
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
  const bg = selected
    ? selected.color + '30'
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
              你好,{user?.display_name || '朋友'}
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

            <View style={styles.ctaRow}>
              <Pressable
                testID="cta-help"
                style={[styles.ctaCard, { backgroundColor: '#FFE4E4' }]}
                onPress={() => router.push('/help')}
              >
                <View style={[styles.ctaIcon, { backgroundColor: '#FFCECE' }]}>
                  <Feather name="life-buoy" size={20} color="#E86A6A" />
                </View>
                <Text style={styles.ctaTitle}>尋求幫助</Text>
                <Text style={styles.ctaSub}>熱線 · 專業人士</Text>
              </Pressable>
              <Pressable
                testID="cta-activities"
                style={[styles.ctaCard, { backgroundColor: COLORS.primaryLight }]}
                onPress={() => router.push('/activities')}
              >
                <View style={[styles.ctaIcon, { backgroundColor: COLORS.primary }]}>
                  <Feather name="sun" size={20} color={COLORS.textPrimary} />
                </View>
                <Text style={styles.ctaTitle}>行出去 · 探索</Text>
                <Text style={styles.ctaSub}>感受下呢個世界</Text>
              </Pressable>
            </View>

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

            <View style={styles.emotionPromptRow}>
              <Text style={styles.emotionPromptTitle}>你今日嘅感受點啊?</Text>
              <Text style={styles.emotionPromptHint}>撳一個飯碗 · 記低呢一刻</Text>
            </View>

            <View style={styles.grid} testID="emotion-grid">
              {EMOTIONS.map((e) => {
                const active = selected?.key === e.key;
                return (
                  <Pressable
                    key={e.key}
                    testID={`emotion-${e.key}-picker`}
                    onPress={() => setSelected(e)}
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
                  </Pressable>
                );
              })}
            </View>

            {selected && (
              <View style={styles.journalCard} testID="journal-card">
                <View style={styles.journalHeader}>
                  <EmotionVisual emotion={selected} size={60} radius={RADIUS.md} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.journalTitle}>而家覺得 {selected.label}</Text>
                    <Text style={styles.journalHint}>{selected.description}</Text>
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
                      <Text style={styles.shareLabel}>秘密日記 · 密碼保護</Text>
                      <Text style={styles.shareHint}>
                        {user?.is_premium
                          ? user?.has_secret_pin
                            ? '要輸入密碼先睇到內容'
                            : '未設定密碼 · 撳去設定'
                          : '會員專屬功能'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    testID="secret-toggle"
                    value={secret}
                    onValueChange={(v) => {
                      if (!user?.is_premium) {
                        router.push('/premium');
                        return;
                      }
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

            <View style={{ marginTop: SPACING.xl }}>
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
                  const em = EMOTION_BY_KEY[entry.emotion];
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
                        <EmotionVisual emotion={em} size={40} radius={RADIUS.sm} />
                        <Text style={styles.entryEmotion}>{em?.label || entry.emotion}</Text>
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
                            style={[
                              styles.entryNote,
                              user?.diary_style && {
                                fontFamily: user.diary_style.font_family,
                                fontSize: user.diary_style.font_size,
                                color: user.diary_style.text_color,
                              },
                            ]}
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
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
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
  },
  emotionBtnActive: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
