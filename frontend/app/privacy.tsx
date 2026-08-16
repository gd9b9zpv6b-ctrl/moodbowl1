import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '關於 MoodBowl',
    body:
      'MoodBowl 係一個由用家自己控制嘅心情記錄空間。我哋深信你嘅感受係屬於你嘅，呢啲文字絕對唔係俾人分析、賣廣告或者訓練 AI 模型。',
  },
  {
    title: '我哋會收集啲乜',
    body:
      '• 電郵地址 + 密碼（加密後儲存）\n• 你選擇嘅心情圖示 + 日記文字\n• 你設定嘅任務 · 回憶記錄 · 提醒時間\n• 匿名分享嘅內容（只喺你自己撳「公開」先出現喺社群）\n• 若校方開啟危機字監察 · 系統可能產生安全警示（唔等於公開你嘅日記原文）',
  },
  {
    title: '我哋唔會做啲乜',
    body:
      '• 唔會賣你嘅資料俾第三方\n• 唔會用你嘅內容做廣告 target\n• 唔會用你嘅日記訓練 AI\n• 唔會強制你分享任何嘢',
  },
  {
    title: '你嘅權利（《個人資料（私隱）條例》）',
    body:
      '你可以喺 App「你嘅小空間 → 私隱權利」自行：\n• 查閱：月曆／相簿睇返自己嘅日記\n• 改正：開啟日記後編輯或刪除單篇\n• 可攜：匯出 JSON 資料副本到你嘅裝置\n• 刪除：要求清除日記等個人資料\n\n亦可以電郵 privacy@moodful.app 提出查閱／改正／刪除要求 · 我哋會喺合理時間內回覆（目標 30 日內）。',
  },
  {
    title: '資料儲存同保安',
    body:
      '資料經 HTTPS 傳送。帳戶認證同資料庫由雲端服務商代管。密碼唔會以明文儲存。自動登出等設定用嚟減低裝置被他人使用嘅風險。',
  },
  {
    title: '緊急情況',
    body:
      '如果你或者你認識嘅人有即時危險，MoodBowl 唔可以取代專業幫助。請即刻聯絡 24 小時緊急熱線（「尋求幫助」有電話），或者到最近嘅急症室。',
  },
  {
    title: '聯絡我哋',
    body:
      '私隱相關問題 · 或者需要校方協助完成帳戶徹底清除，請電郵：\n\nprivacy@moodful.app',
  },
];

export default function Privacy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable testID="privacy-back" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} testID="privacy-title">
          私隱政策
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Feather name="shield" size={22} color={COLORS.primary} />
          <Text style={styles.introText}>
            你嘅感受，值得被溫柔咁保護。{'\n'}
            以下係我哋點樣做 · 同你點樣行使權利。
          </Text>
        </View>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>最後更新：2026 年 8 月{'\n'}你嘅安全 · 我哋嘅責任</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  introText: { flex: 1, color: COLORS.textPrimary, lineHeight: 22, fontSize: 14 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  cardBody: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
  footer: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
  },
});
