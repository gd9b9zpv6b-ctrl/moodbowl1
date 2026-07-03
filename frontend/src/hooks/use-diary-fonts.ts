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

    // NEW: Taiwan-style diary fonts (免費開源)
    LXGWWenKai: require('@/assets/fonts/LXGWWenKaiTC-Regular.ttf'), // 霞鶩文楷 · 手寫明體
    Iansui: require('@/assets/fonts/Iansui-Regular.ttf'),           // 一點明體
    HunInn: require('@/assets/fonts/jf-openhuninn-Regular.ttf'),    // 粉圓 · 奶油體
  });

export const DIARY_FONTS = {
  wenkai: 'LXGWWenKai',       // 霞鶩文楷 · 手寫明體風 (預設)
  iansui: 'Iansui',           // 一點明體 · 文青風
  huninn: 'HunInn',           // 粉圓 · 奶油/饅頭體
  brush: 'MaShanZheng',       // 毛筆手寫感
  chunky: 'ZCOOLKuaiLe',      // 圓潤粗手寫
  cursive: 'LongCang',        // 行草 · 詩意
} as const;

// UI defaults — applied globally in root layout.
export const UI_FONT = {
  regular: 'NotoSansTC',
  bold: 'NotoSansTC-Bold',
} as const;
