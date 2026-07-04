/**
 * Admin subpage — bulk upload students via CSV-like text input · generate invite codes.
 *
 * Design goals:
 * - Zero external file-upload dependency: accept multi-line text `name, email, class`
 * - Preview parsed rows before submitting
 * - Show generated codes in a copyable list · admin distributes via school channels
 */
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api } from '@/src/lib/api';

type ParsedRow = { name: string; email: string; class_name: string };
type CreatedResult = { email: string; display_name: string; class_name: string | null; invite_code: string };
type ExistingRow = { email: string; display_name?: string; class_name?: string; activated: boolean; invite_code?: string | null };
type CodeRow = { email: string; display_name?: string; class_name?: string; role?: string; invite_code?: string; activated: boolean };

const SAMPLE_TEXT = `陳大文, tmchan01@school.hk, 6A
李小美, xmli02@school.hk, 6A
王大衛, dwwong03@school.hk, 6B`;

function parseCsv(raw: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const lines = raw.split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split(/[,、]\s*/).map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`第 ${i + 1} 行：格式不對（需要至少「姓名, Email」）`);
      return;
    }
    const [name, email, cls] = parts;
    if (!name || !email || !email.includes('@')) {
      errors.push(`第 ${i + 1} 行：姓名或 Email 有問題`);
      return;
    }
    rows.push({ name, email: email.toLowerCase(), class_name: (cls || '').toUpperCase() });
  });
  return { rows, errors };
}

export function CsvUploadSubpage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [busy, setBusy] = useState(false);
  const [createdList, setCreatedList] = useState<CreatedResult[]>([]);
  const [alreadyList, setAlreadyList] = useState<ExistingRow[]>([]);
  const [inviteCodes, setInviteCodes] = useState<CodeRow[]>([]);

  const parsed = parseCsv(text);

  const loadCodes = async () => {
    try {
      const codes = await api.get<CodeRow[]>('/admin/invite-codes');
      setInviteCodes(codes);
    } catch {
      setInviteCodes([]);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const submit = async () => {
    if (parsed.rows.length === 0) {
      Alert.alert('冇學生資料', '請貼落至少 1 位學生 · 格式：姓名, Email, 班別');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<any>('/admin/students/bulk', {
        students: parsed.rows.map((r) => ({
          name: r.name,
          email: r.email,
          class_name: r.class_name || null,
        })),
      });
      setCreatedList(res.created || []);
      setAlreadyList(res.already_existing || []);
      const codes = res.created || [];
      Alert.alert(
        '成功 · 已建立 ' + codes.length + ' 位學生',
        (res.already_existing?.length
          ? `${res.already_existing.length} 位已經存在（skip）\n`
          : '') +
        (codes.length ? '請 copy 下面 invite code 派俾學生自助啟用。' : ''),
      );
      loadCodes();
    } catch (e: any) {
      Alert.alert('上載失敗', e?.message || '請再試');
    } finally {
      setBusy(false);
    }
  };

  const copyAllCodes = async () => {
    const text = createdList
      .map((c) => `${c.display_name} (${c.email}) · ${c.class_name || '—'} · 邀請碼：${c.invite_code}`)
      .join('\n');
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('已 copy', '全部邀請碼已 copy 落剪貼板 · 你可以 paste 落 Excel · Word · Email 派俾學生。');
    } catch {
      Alert.alert('Copy 失敗', '試下手動 select 內容 copy。');
    }
  };

  return (
    <>
      <Text style={styles.title}>📄 上載學生名單</Text>

      <View style={styles.hint}>
        <Feather name="info" size={12} color="#5A7A6C" />
        <Text style={styles.hintText}>
          每行一位學生 · 格式：<Text style={{ fontWeight: '800' }}>姓名, Email, 班別</Text>{'\n'}
          系統會自動生成邀請碼 · 派俾學生自己設密碼啟用帳戶。
        </Text>
      </View>

      <TextInput
        testID="csv-input"
        value={text}
        onChangeText={setText}
        multiline
        style={styles.textarea}
        placeholder="姓名, Email, 班別"
        placeholderTextColor={COLORS.textDisabled}
      />

      <View style={styles.previewRow}>
        <Text style={styles.previewText}>
          預覽：<Text style={{ fontWeight: '800', color: '#3F5A4D' }}>{parsed.rows.length}</Text> 位學生可上載
          {parsed.errors.length > 0 && (
            <Text style={{ color: '#8A3F3F' }}> · {parsed.errors.length} 行有問題</Text>
          )}
        </Text>
      </View>

      {parsed.errors.slice(0, 3).map((err) => (
        <Text key={err} style={styles.errText}>⚠️ {err}</Text>
      ))}

      <Pressable
        testID="csv-submit"
        onPress={submit}
        disabled={busy || parsed.rows.length === 0}
        style={[styles.submitBtn, (busy || parsed.rows.length === 0) && { opacity: 0.4 }]}
      >
        <Feather name="upload" size={16} color="#FFF" />
        <Text style={styles.submitText}>
          {busy ? '上載中…' : `上載 · 生成 ${parsed.rows.length} 個 invite code`}
        </Text>
      </Pressable>

      {createdList.length > 0 && (
        <View style={styles.resultBox}>
          <View style={styles.resultHead}>
            <Text style={styles.resultTitle}>🎉 剛生成嘅邀請碼</Text>
            <Pressable onPress={copyAllCodes} style={styles.copyBtn} testID="csv-copy-all">
              <Feather name="copy" size={12} color="#FFF" />
              <Text style={styles.copyText}>Copy 全部</Text>
            </Pressable>
          </View>
          {createdList.map((c) => (
            <View key={c.email} style={styles.codeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeName}>{c.display_name} · {c.class_name || '未分班'}</Text>
                <Text style={styles.codeEmail}>{c.email}</Text>
              </View>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{c.invite_code}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {alreadyList.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>ℹ️ 呢啲 email 已經存在 · skip 咗</Text>
          {alreadyList.map((a) => (
            <Text key={a.email} style={styles.warningItem}>
              · {a.display_name || a.email} · {a.activated ? '已啟用' : '未啟用（code: ' + (a.invite_code || '—') + '）'}
            </Text>
          ))}
        </View>
      )}

      <Text style={[styles.title, { marginTop: SPACING.xl, fontSize: 16 }]}>
        所有待啟用嘅邀請碼（{inviteCodes.filter((c) => !c.activated && c.invite_code).length}）
      </Text>
      <ScrollView style={{ maxHeight: 400 }}>
        {inviteCodes.filter((c) => !c.activated && c.invite_code).length === 0 && (
          <Text style={styles.emptyText}>暫時冇待啟用嘅邀請碼。上載完新學生就會出現。</Text>
        )}
        {inviteCodes.filter((c) => !c.activated && c.invite_code).map((c) => (
          <Pressable
            key={c.email}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(c.invite_code || '');
                Alert.alert('已 copy', `邀請碼 ${c.invite_code} 已放喺剪貼板`);
              } catch {}
            }}
            style={styles.codeRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.codeName}>{c.display_name || c.email} · {c.class_name || '未分班'}</Text>
              <Text style={styles.codeEmail}>{c.email}</Text>
            </View>
            <View style={styles.codePill}>
              <Text style={styles.codePillText}>{c.invite_code}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ height: SPACING.xxl }} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  hint: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EEF5F1',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#7BA88C',
    marginBottom: SPACING.md,
  },
  hintText: { flex: 1, fontSize: 12, color: '#3F5A4D', lineHeight: 18 },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    borderRadius: RADIUS.sm,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgApp,
    minHeight: 180,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  previewRow: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  previewText: { fontSize: 13, color: COLORS.textSecondary },
  errText: { fontSize: 12, color: '#8A3F3F', marginBottom: 3 },
  submitBtn: {
    backgroundColor: '#7B5B9F',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  resultBox: {
    backgroundColor: '#F0F7F1',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#7BA88C',
  },
  resultHead: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  resultTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#3F5A4D' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#7BA88C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill,
  },
  copyText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  codeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: 6, gap: SPACING.sm,
  },
  codeName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  codeEmail: { fontSize: 11, color: COLORS.textSecondary },
  codePill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill,
    backgroundColor: '#F0EBE0',
  },
  codePillText: { fontSize: 12, fontWeight: '800', color: '#5F4A2E', fontFamily: 'monospace' },
  warningBox: {
    backgroundColor: '#FEF9E7', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: '#B57D2A',
  },
  warningTitle: { fontSize: 12, fontWeight: '700', color: '#8A5F1F', marginBottom: 4 },
  warningItem: { fontSize: 11, color: '#7A5C3F', lineHeight: 16 },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', padding: SPACING.md, textAlign: 'center' },
});
