import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleHeader } from '@/src/components/role-header';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export default function ParentHome() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RoleHeader role="parent" title="家長版 · 陪伴小朋友" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.childCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>小</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>陳小明</Text>
            <Text style={styles.childClass}>飯碗小學 · 6A</Text>
          </View>
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>🔥 12 日</Text>
          </View>
        </View>

        <Text style={styles.privacyBanner}>
          🔒 你只會見到小朋友嘅整體 vibe · 睇唔到佢寫嘅內容 · 呢個係佢私人空間
        </Text>

        <Text style={styles.sectionTitle}>呢一週嘅心情氣氛</Text>

        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => {
              const emojis = ['😊', '😊', '😐', '😔', '😐', '😊', '😊'];
              return (
                <View key={d} style={styles.dayCol}>
                  <Text style={styles.dayEmoji}>{emojis[i]}</Text>
                  <Text style={styles.dayLabel}>{d}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.weekSummary}>
            5 日開心 · 2 日平淡 · 1 日低落 · 整體 <Text style={styles.weekBold}>穩定</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>你可以做嘅嘢</Text>

        <Pressable
          style={styles.actCard}
          onPress={() => Alert.alert('傾偈提示', '示範版：由心理專家撰寫嘅親子對話 tips · 幫你了解小朋友唔開心背後嘅原因。')}
        >
          <View style={[styles.actIcon, { backgroundColor: '#FFE9D6' }]}>
            <Feather name="message-circle" size={20} color="#F0AE64" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>今日傾偈提示</Text>
            <Text style={styles.actSub}>「小朋友呢排點呀？」開放式問法建議</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          style={styles.actCard}
          onPress={() => Alert.alert('聯絡老師', '示範版：直接 in-app message 班主任 · 保留對話紀錄。')}
        >
          <View style={[styles.actIcon, { backgroundColor: '#E0EAFC' }]}>
            <Feather name="mail" size={20} color="#5A7CB0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>聯絡陳老師（班主任）</Text>
            <Text style={styles.actSub}>如果你有擔心 · 直接寫俾佢</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
        </Pressable>

        <Pressable
          style={styles.actCard}
          onPress={() => Alert.alert('免費專家講座', '示範版：飯碗小學家長專屬 · 心理專家 workshop 通知。')}
        >
          <View style={[styles.actIcon, { backgroundColor: '#FBD9E4' }]}>
            <Feather name="book-open" size={20} color="#B67A99" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>親子成長工作坊</Text>
            <Text style={styles.actSub}>下次：8月15日 · 「同青春期小朋友傾偈」</Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textDisabled} />
        </Pressable>

        <View style={styles.emergencyCard}>
          <Feather name="phone" size={16} color="#E86A6A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>如果情況緊急</Text>
            <Text style={styles.emergencyText}>
              情緒通熱線 <Text style={styles.emergencyPhone}>18111</Text> · 24 小時免費
            </Text>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF0F3' },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 52, height: 52, borderRadius: RADIUS.pill,
    backgroundColor: '#FBD9E4',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#8B4A6B' },
  childName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  childClass: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  streakChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFEAC2',
  },
  streakText: { fontSize: 12, fontWeight: '800', color: '#B57D2A' },
  privacyBanner: {
    fontSize: 11,
    color: '#7A5C3F',
    fontStyle: 'italic',
    backgroundColor: '#FEF5E6',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginTop: SPACING.sm, marginBottom: SPACING.sm, letterSpacing: 0.5,
  },
  weekCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayCol: { alignItems: 'center' },
  dayEmoji: { fontSize: 24 },
  dayLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  weekSummary: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weekBold: { fontWeight: '800', color: '#7BA88C' },
  actCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  actIcon: {
    width: 42, height: 42, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  actTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  actSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FDE0E0',
    marginTop: SPACING.md,
  },
  emergencyTitle: { fontSize: 13, fontWeight: '700', color: '#8A3F3F' },
  emergencyText: { fontSize: 12, color: '#8A3F3F', marginTop: 1 },
  emergencyPhone: { fontWeight: '800' },
});
