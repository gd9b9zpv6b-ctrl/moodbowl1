import { useFonts } from 'expo-font';

/**
 * Loads Chinese handwritten fonts for the diary detail view.
 * These add texture and personality when reading full stories.
 */
export const useDiaryFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    MaShanZheng: require('@/assets/fonts/MaShanZheng-Regular.ttf'),
    ZCOOLKuaiLe: require('@/assets/fonts/ZCOOLKuaiLe-Regular.ttf'),
    LongCang: require('@/assets/fonts/LongCang-Regular.ttf'),
  });

export const DIARY_FONTS = {
  brush: 'MaShanZheng',       // 毛筆手寫感 — 標題 / 短句
  chunky: 'ZCOOLKuaiLe',      // 圓潤粗手寫 — 主打閱讀
  cursive: 'LongCang',        // 行草 — 詩意 / 短篇
} as const;
