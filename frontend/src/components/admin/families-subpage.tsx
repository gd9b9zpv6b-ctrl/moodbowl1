/**
 * Admin subpage — build a new student ↔ parent family pair.
 * Uses the /api/admin/families endpoint · idempotent on existing emails.
 * Autofills passwords from email prefix as a convenience for the school admin.
 */
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api } from '@/src/lib/api';

type DirectoryUser = {
  id: string;
  email: string;
  display_name?: string | null;
  role: string;
  class_name?: string | null;
  parent_email?: string | null;
  parent_emails?: string[];
  child_emails?: string[];
};

const emailPrefix = (email: string) => (email || '').split('@')[0] || '';

export function FamiliesSubpage() {
  // Form state — kept local · admin fills manually · we suggest passwords from email prefix.
  const [stuEmail, setStuEmail] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuClass, setStuClass] = useState('6A');
  const [parEmail, setParEmail] = useState('');
  const [parName, setParName] = useState('');
  const [parPassword, setParPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [students, setStudents] = useState<DirectoryUser[]>([]);
  // Note: we currently only render students+their linked parents · the raw parent
  // list would be useful for future autocomplete when picking an existing parent.
  const [, setParents] = useState<DirectoryUser[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        api.get<DirectoryUser[]>('/admin/users?role=student'),
        api.get<DirectoryUser[]>('/admin/users?role=parent'),
      ]);
      setStudents(s);
      setParents(p);
    } catch {
      // silent — the directory is optional
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Suggest password from email prefix — admin can override
  const onStuEmailBlur = () => {
    if (!stuPassword && stuEmail) setStuPassword(emailPrefix(stuEmail));
  };
  const onParEmailBlur = () => {
    if (!parPassword && parEmail) setParPassword(emailPrefix(parEmail));
  };

  const reset = () => {
    setStuEmail(''); setStuName(''); setStuPassword(''); setStuClass('6A');
    setParEmail(''); setParName(''); setParPassword('');
  };

  const submit = async () => {
    if (!stuEmail.trim() || !parEmail.trim() || !stuName.trim() || !parName.trim() ||
        !stuPassword.trim() || !parPassword.trim()) {
      Alert.alert('資料未填齊', '學生 + 家長嘅 email · 姓名同密碼都要填。');
      return;
    }
    if (stuEmail.trim().toLowerCase() === parEmail.trim().toLowerCase()) {
      Alert.alert('Email 唔可以一樣', '學生同家長要用兩個唔同嘅 email。');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<any>('/admin/families', {
        student_email: stuEmail.trim(),
        student_name: stuName.trim(),
        student_password: stuPassword,
        student_class: stuClass.trim() || null,
        parent_email: parEmail.trim(),
        parent_name: parName.trim(),
        parent_password: parPassword,
      });
      Alert.alert(
        '配對成功 ✅',
        `${res.student.display_name} ↔ ${res.parent.display_name} 已配對。\n\n記得將初始密碼安全咁交俾家長／學生 · 佢哋首次登入應該改密碼。`,
        [{ text: '知道', onPress: () => { reset(); load(); } }],
      );
    } catch (e: any) {
      Alert.alert('配對失敗', e?.message || '請再試');
    } finally {
      setSaving(false);
    }
  };

  const unlink = async (stu: string, par: string) => {
    try {
      await api.post('/admin/families/unlink', { student_email: stu, parent_email: par });
      Alert.alert('已解除配對', `${stu} ↔ ${par}`);
      load();
    } catch (e: any) {
      Alert.alert('解除失敗', e?.message || '請再試');
    }
  };

  return (
    <>
      <Text style={styles.title}>👥 家長 · 學生 配對</Text>

      <View style={styles.hint}>
        <Feather name="info" size={12} color="#5A7A6C" />
        <Text style={styles.hintText}>
          Admin 建立新學生 + 家長帳戶並自動配對 · 若 email 已存在 · 只會加 link · 不會覆寫密碼。{'\n'}
          初始密碼建議：email 前綴（例：`tmchan01@school.hk` → 密碼 `tmchan01`）· 首次登入應改密碼。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>學生資料</Text>
        <TextInput
          testID="fam-stu-name"
          style={styles.input}
          placeholder="學生姓名（例：陳大文）"
          placeholderTextColor={COLORS.textDisabled}
          value={stuName}
          onChangeText={setStuName}
        />
        <TextInput
          testID="fam-stu-email"
          style={styles.input}
          placeholder="學生 Email（例：tmchan01@school.hk）"
          placeholderTextColor={COLORS.textDisabled}
          value={stuEmail}
          onChangeText={setStuEmail}
          onBlur={onStuEmailBlur}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.rowFlex}>
          <TextInput
            testID="fam-stu-class"
            style={[styles.input, { flex: 1 }]}
            placeholder="班別（例：6A）"
            placeholderTextColor={COLORS.textDisabled}
            value={stuClass}
            onChangeText={setStuClass}
          />
          <TextInput
            testID="fam-stu-password"
            style={[styles.input, { flex: 2 }]}
            placeholder="初始密碼"
            placeholderTextColor={COLORS.textDisabled}
            value={stuPassword}
            onChangeText={setStuPassword}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>家長資料</Text>
        <TextInput
          testID="fam-par-name"
          style={styles.input}
          placeholder="家長姓名（例：蕭太）"
          placeholderTextColor={COLORS.textDisabled}
          value={parName}
          onChangeText={setParName}
        />
        <TextInput
          testID="fam-par-email"
          style={styles.input}
          placeholder="家長 Email"
          placeholderTextColor={COLORS.textDisabled}
          value={parEmail}
          onChangeText={setParEmail}
          onBlur={onParEmailBlur}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          testID="fam-par-password"
          style={styles.input}
          placeholder="初始密碼"
          placeholderTextColor={COLORS.textDisabled}
          value={parPassword}
          onChangeText={setParPassword}
          autoCapitalize="none"
        />
      </View>

      <Pressable
        testID="fam-submit"
        onPress={submit}
        disabled={saving}
        style={[styles.submitBtn, saving && { opacity: 0.5 }]}
      >
        <Feather name="user-plus" size={16} color="#FFF" />
        <Text style={styles.submitText}>{saving ? '配對中…' : '建立配對'}</Text>
      </Pressable>

      {/* Existing families quick-view */}
      <Text style={[styles.title, { marginTop: SPACING.xl, fontSize: 16 }]}>
        現有配對（{students.filter((s) => (s.parent_emails || []).length || s.parent_email).length}）
      </Text>
      <ScrollView horizontal={false} style={{ maxHeight: 300 }}>
        {students
          .filter((s) => (s.parent_emails || []).length || s.parent_email)
          .map((s) => {
            const links = Array.from(new Set([
              ...(s.parent_emails || []),
              ...(s.parent_email ? [s.parent_email] : []),
            ]));
            return (
              <View key={s.id} style={styles.pairCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pairStu}>{s.display_name} · {s.class_name || '未分班'}</Text>
                  <Text style={styles.pairStuEmail}>{s.email}</Text>
                  {links.map((pe) => (
                    <View key={pe} style={styles.pairLinkRow}>
                      <Feather name="link" size={11} color="#7B5B9F" />
                      <Text style={styles.pairPar}>{pe}</Text>
                      <Pressable
                        onPress={() => Alert.alert(
                          '解除配對？',
                          `${s.email} ↔ ${pe}`,
                          [
                            { text: '取消', style: 'cancel' },
                            { text: '解除', style: 'destructive', onPress: () => unlink(s.email, pe) },
                          ],
                        )}
                        style={styles.unlinkBtn}
                      >
                        <Feather name="x" size={10} color="#8A3F3F" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        {students.filter((s) => (s.parent_emails || []).length || s.parent_email).length === 0 && (
          <Text style={styles.empty}>暫時未有配對 · 用上面表格建立第一對。</Text>
        )}
      </ScrollView>

      <View style={{ height: SPACING.xxl }} />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF5F1',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#7BA88C',
    marginBottom: SPACING.md,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: '#3F5A4D',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.bgInput,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgApp,
  },
  rowFlex: { flexDirection: 'row', gap: SPACING.sm },
  submitBtn: {
    backgroundColor: '#7B5B9F',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  pairCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
  },
  pairStu: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  pairStuEmail: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  pairLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pairPar: { fontSize: 12, color: '#5B4A7C', flex: 1 },
  unlinkBtn: {
    padding: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FDECEC',
  },
  empty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    padding: SPACING.md,
  },
});
