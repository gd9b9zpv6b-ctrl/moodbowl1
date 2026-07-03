import { useFonts } from 'expo-font';

/**
 * Loads Chinese handwritten fonts + a consistent CJK UI font (Noto Sans TC)
 * so the whole app renders Chinese identically across iOS/Android/Web.
 */
export const useDiaryFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    // UI font — applied globally to <Text>
    NotoSansTC: require('@/assets/fonts/NotoSansTC-Regular.ttf'),
    'NotoSansTC-Bold': require('@/assets/fonts/NotoSansTC-Bold.ttf'),

    // Diary-detail handwritten fonts
    MaShanZheng: require('@/assets/fonts/MaShanZheng-Regular.ttf'),
    ZCOOLKuaiLe: require('@/assets/fonts/ZCOOLKuaiLe-Regular.ttf'),
    LongCang: require('@/assets/fonts/LongCang-Regular.ttf'),
  });

export const DIARY_FONTS = {
  brush: 'MaShanZheng',       // 毛筆手寫感 — 標題 / 短句
  chunky: 'ZCOOLKuaiLe',      // 圓潤粗手寫 — 主打閱讀
  cursive: 'LongCang',        // 行草 — 詩意 / 短篇
} as const;

// UI defaults — applied globally in root layout.
export const UI_FONT = {
  regular: 'NotoSansTC',
  bold: 'NotoSansTC-Bold',
} as const;
