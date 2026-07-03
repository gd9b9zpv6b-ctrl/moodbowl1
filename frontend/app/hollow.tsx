// 🌳 樹洞模式 · Secret Hollow
// A private safe space where entries are NEVER shared with anyone.
// Visual: darker forest-green theme to feel distinct from the main app.
// Only accessible with intent — the user opens this on purpose.

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RADIUS, SPACING } from '@/src/constants/theme';
import { api, Entry } from '@/src/lib/api';

// Hollow-specific palette (deep forest / night calm)
const HOLLOW = {
  bg: '#1E2E28',            // deep forest
  bgSoft: '#2A3E37',
  card: '#33473F',
  cardHi: '#3D5449',
  text: '#F5F0E4',
  textDim: '#B8C4BE',
  textSoft: '#8FA69D',
  accent: '#E8C97A',          // warm firefly gold
  divider: 'rgba(255,255,255,0.08)',
};

function shortDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} · ${hh}:${mm}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Hollow() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const all = await api.get<Entry[]>('/entries');
      // Only show hollow (is_secret) entries
      setEntries(all.filter((e) => e.is_secret));
    } catch (e: any) {
      Alert.alert('載入唔到', e?.message || '請再試一次');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert('寫少少嘢先', '樹洞想聽你講今日發生咩事');
      return;
    }
    setSaving(true);
    try {
      // Save as secret entry. No emotion required — hollow is text-only free-form.
      // Use a neutral emotion key by default (blank / foggy) so it fits the multi-select schema.
      await api.post('/entries', {
        emotions: ['blank'],
        note: note.trim(),
        is_public: false,
        is_secret: true,
        entry_date: todayISO(),
      });
      setNote('');
      setSaved(true);
      await loadEntries();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      Alert.alert('儲存失敗', e?.message || '請再試一次');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entryId: string) => {
    Alert.alert(
      '刪除呢個秘密？',
      '刪咗就冇喇 · 唔會有備份。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/entries/${entryId}`);
              await loadEntries();
            } catch (e: any) {
              Alert.alert('刪除失敗', e?.message || '請再試一次');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={22} color={HOLLOW.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>🌳 樹洞</Text>
          <Text style={styles.headerSub}>只有你自己睇到</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Privacy banner — this is the trust anchor */}
      <View style={styles.privacyBanner}>
        <Feather name="lock" size={14} color={HOLLOW.accent} />
        <Text style={styles.privacyText}>
          <Text style={styles.privacyBold}>絕對私隱：</Text>
          呢度寫嘅嘢 · 老師 · 家長 · 輔導 · 冇一個會見到 · 唔會出現喺日曆 · 唔會出現喺社群。
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Composer */}
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>寫俾自己聽</Text>
              <Text style={styles.composerSub}>可以嬲 · 可以喊 · 可以爛嘴 · 冇人會覺得你唔乖</Text>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={'今日有咩想講但唔想講畀人聽…\n\n（例：其實我今日冇乜心情返學 · 但係我扮咗開心）'}
              placeholderTextColor={HOLLOW.textSoft}
              multiline
              textAlignVertical="top"
              style={styles.composerInput}
            />
            <View style={styles.composerFooter}>
              <View style={styles.charCount}>
                <Text style={styles.charCountText}>{note.length} 字</Text>
              </View>
              <Pressable
                onPress={handleSave}
                disabled={saving || !note.trim()}
                style={({ pressed }) => [
                  styles.saveBtn,
                  (!note.trim() || saving) && styles.saveBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#1E2E28" />
                ) : saved ? (
                  <>
                    <Feather name="check" size={14} color="#1E2E28" />
                    <Text style={styles.saveBtnText}>收好咗</Text>
                  </>
                ) : (
                  <>
                    <Feather name="feather" size={14} color="#1E2E28" />
                    <Text style={styles.saveBtnText}>放入樹洞</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Past secrets */}
          <View style={styles.pastHeader}>
            <Feather name="archive" size={13} color={HOLLOW.textDim} />
            <Text style={styles.pastTitle}>之前收埋嘅說話</Text>
            {entries.length > 0 && (
              <Text style={styles.pastCount}>{entries.length}</Text>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={HOLLOW.accent} />
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>樹洞係空嘅</Text>
              <Text style={styles.emptySub}>
                你可以將唔想講畀人聽嘅嘢 · 放入呢個安全嘅空間。
              </Text>
            </View>
          ) : (
            entries.map((e) => (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Feather name="lock" size={11} color={HOLLOW.accent} />
                  <Text style={styles.entryDate}>{shortDate(e.created_at)}</Text>
                  <Pressable
                    onPress={() => handleDelete(e.id)}
                    hitSlop={10}
                    style={styles.deleteBtn}
                  >
                    <Feather name="x" size={14} color={HOLLOW.textSoft} />
                  </Pressable>
                </View>
                <Text style={styles.entryText}>{e.note}</Text>
              </View>
            ))
          )}

          {/* Reassurance footer */}
          <View style={styles.footer}>
            <Feather name="shield" size={12} color={HOLLOW.textSoft} />
            <Text style={styles.footerText}>
              樹洞只屬於你 · 冇任何人可以偷睇
            </Text>
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HOLLOW.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: HOLLOW.bgSoft,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: HOLLOW.text },
  headerSub: { fontSize: 11, color: HOLLOW.textDim, marginTop: 1 },

  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(232, 201, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.28)',
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: HOLLOW.textDim,
    lineHeight: 16,
  },
  privacyBold: { color: HOLLOW.accent, fontWeight: '800' },

  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },

  composerCard: {
    backgroundColor: HOLLOW.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  composerHeader: { marginBottom: SPACING.sm },
  composerTitle: { fontSize: 15, fontWeight: '800', color: HOLLOW.text },
  composerSub: { fontSize: 11, color: HOLLOW.textDim, marginTop: 3, lineHeight: 15 },
  composerInput: {
    minHeight: 140,
    backgroundColor: HOLLOW.bgSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    color: HOLLOW.text,
    fontSize: 15,
    lineHeight: 22,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  charCount: {},
  charCountText: { fontSize: 11, color: HOLLOW.textSoft },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HOLLOW.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#1E2E28' },

  pastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  pastTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: HOLLOW.textDim,
    letterSpacing: 0.5,
  },
  pastCount: {
    fontSize: 11,
    color: HOLLOW.textSoft,
    fontWeight: '700',
  },

  loadingWrap: { paddingVertical: SPACING.xl, alignItems: 'center' },
  emptyCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: HOLLOW.card,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: HOLLOW.text },
  emptySub: {
    fontSize: 11,
    color: HOLLOW.textDim,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: SPACING.md,
  },

  entryCard: {
    backgroundColor: HOLLOW.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  entryDate: { flex: 1, fontSize: 11, color: HOLLOW.textSoft, fontWeight: '600' },
  deleteBtn: {
    width: 24, height: 24,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: HOLLOW.bgSoft,
  },
  entryText: {
    fontSize: 14,
    color: HOLLOW.text,
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 11,
    color: HOLLOW.textSoft,
    fontStyle: 'italic',
  },
});
