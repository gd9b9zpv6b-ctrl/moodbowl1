import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export const ONBOARDING_KEY = '@onboarding/completed/v1';

type Slide = {
  key: string;
  bg: string;
  accent: string;
  visual: React.ReactNode;
  title: string;
  desc: string;
};

const { width: SCREEN_W } = Dimensions.get('window');

function BowlHero({ emotionKey, tint }: { emotionKey: string; tint: string }) {
  const e = EMOTION_BY_KEY[emotionKey];
  if (!e) return null;
  return (
    <View style={[styles.bowlHalo, { backgroundColor: tint }]}>
      <EmotionVisual emotion={e} size={140} radius={RADIUS.lg} />
    </View>
  );
}

function IconHero({ icon, color, bg }: { icon: 'calendar' | 'wind' | 'heart'; color: string; bg: string }) {
  return (
    <View style={[styles.bowlHalo, { backgroundColor: bg }]}>
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Feather name={icon} size={64} color="#FFF" />
      </View>
    </View>
  );
}

function RiceHero() {
  return (
    <View style={[styles.bowlHalo, { backgroundColor: '#DFF3E4' }]}>
      <Text style={styles.emojiHero}>🌾</Text>
      <View style={styles.riceRow}>
        <Text style={styles.emojiSmall}>🫘</Text>
        <Feather name="chevron-right" size={16} color="#7BA88C" />
        <Text style={styles.emojiSmall}>🌱</Text>
        <Feather name="chevron-right" size={16} color="#7BA88C" />
        <Text style={styles.emojiSmall}>🌾</Text>
        <Feather name="chevron-right" size={16} color="#7BA88C" />
        <Text style={styles.emojiSmall}>🍚</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const slides: Slide[] = [
    {
      key: 'welcome',
      bg: '#FFF6E8',
      accent: '#DDB86A',
      visual: <BowlHero emotionKey="happy" tint="#FFEAC2" />,
      title: '歡迎嚟到你嘅小空間 🌾',
      desc: '呢度係一個溫柔嘅角落 · 用嚟認識自己嘅心情 · 陪你慢慢療癒 · 冇壓力冇目標。',
    },
    {
      key: 'emotion',
      bg: '#FFEFF3',
      accent: '#E499B4',
      visual: <BowlHero emotionKey="grateful" tint="#FBD9E4" />,
      title: '揀返啱你今日嘅飯碗',
      desc: '我哋設計咗 47 隻手繪飯碗公仔 · 每一隻代表一種情緒 · 你可以揀多過一隻 · 記錄複雜嘅感受。',
    },
    {
      key: 'calendar',
      bg: '#EEF6FF',
      accent: '#7DBEE8',
      visual: <IconHero icon="calendar" color="#7DBEE8" bg="#E0F2FE" />,
      title: '心情曆 · 睇你嘅情緒地圖',
      desc: '每日記低嘅心情會出現喺月曆 · 幫你發現自己嘅情緒節奏 · 例如「原來我每逢星期日都焦慮」。',
    },
    {
      key: 'calm',
      bg: '#F5EDFF',
      accent: '#C7A6D1',
      visual: <IconHero icon="wind" color="#C7A6D1" bg="#EEE0F0" />,
      title: '情緒好激動？深呼吸錦囊',
      desc: '10 個心理學驗證方法 · 可以分情境揀（喺屋企/返工/訓唔到/人多）· 幫你即刻平復。',
    },
    {
      key: 'garden',
      bg: '#EEF6E8',
      accent: '#7BA88C',
      visual: <RiceHero />,
      title: '用小習慣 · 種一粒米',
      desc: '完成小習慣得 ❤️ · 用 3 ❤️ 種一粒米 · 3 日後收成解鎖新飯碗 · 儲入米倉 · 可以換頭像。',
    },
    {
      key: 'ready',
      bg: '#FFF6E8',
      accent: '#DDB86A',
      visual: <BowlHero emotionKey="peaceful" tint="#E4F0E8" />,
      title: '一切都可以慢慢嚟',
      desc: '冇壓力 · 冇目標 · 只要你今日有嚟 · 就已經好得啊。準備好未？我哋一齊行呢段路 🌸',
    },
  ];

  const isLast = index === slides.length - 1;
  const s = slides[index];

  const goNext = () => {
    if (isLast) return finish();
    Animated.timing(fade, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIndex((i) => i + 1);
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: s.bg }]} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {index + 1} / {slides.length}
          </Text>
        </View>
        {!isLast && (
          <Pressable testID="onboarding-skip" onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>跳過</Text>
          </Pressable>
        )}
      </View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.heroBox}>{s.visual}</View>

        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.desc}>{s.desc}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && { backgroundColor: s.accent, width: 22 },
              ]}
            />
          ))}
        </View>
        <Pressable
          testID="onboarding-next"
          onPress={goNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: s.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.nextText}>{isLast ? '開始我嘅旅程' : '下一頁'}</Text>
          <Feather
            name={isLast ? 'heart' : 'arrow-right'}
            size={18}
            color="#FFF"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  pageIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pageText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  skipBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  skipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  heroBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  bowlHalo: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiHero: { fontSize: 96 },
  riceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
  },
  emojiSmall: { fontSize: 22 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  desc: {
    marginTop: SPACING.md,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: SCREEN_W - 60,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.pill,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
