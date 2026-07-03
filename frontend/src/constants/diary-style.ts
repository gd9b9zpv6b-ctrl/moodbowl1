import { Platform } from 'react-native';

// Premium diary style presets.
// `bg` = raw color (used by home tab background & preview only).
// `paper_tint` + `paper` describe the full-screen diary detail look.

export const DIARY_BACKGROUNDS = [
  { key: 'classic', label: '溫柔米白', color: '#F9F8F6' },
  { key: 'sage', label: '柔和薄荷', color: '#E8F0EA' },
  { key: 'rose', label: '柔和粉紅', color: '#FBEAEA' },
  { key: 'lavender', label: '寧靜薰衣草', color: '#EFEAFB' },
  { key: 'sky', label: '晴朗天空', color: '#E7F1FB' },
  { key: 'sand', label: '暖沙米色', color: '#F3E9D8' },
  { key: 'night', label: '深夜寧靜', color: '#2C2D3A' },
];

// Full-screen diary detail paper tints (used with DiaryPaper component).
export const PAPER_TINTS = [
  { key: 'cream', label: '溫暖米白', bg: '#FBF6E9', line: '#B4A88A' },
  { key: 'mint', label: '薄荷抹茶', bg: '#EAF2E6', line: '#8FA88A' },
  { key: 'sky', label: '晴朗天空', bg: '#E9F0F8', line: '#8FA0BB' },
  { key: 'rose', label: '溫柔粉紅', bg: '#FBEBEB', line: '#C29999' },
  { key: 'sand', label: '沙灘暖啡', bg: '#F3E9D8', line: '#B79E75' },
  { key: 'night', label: '深夜寧靜', bg: '#2E2F3E', line: '#7B7C90' },
];

// Paper line style.
export const PAPER_KINDS = [
  { key: 'ruled', label: '橫線', icon: 'menu' },
  { key: 'grid', label: '方格', icon: 'grid' },
  { key: 'dot', label: '點陣', icon: 'more-horizontal' },
  { key: 'none', label: '空白', icon: 'square' },
];

// Handwritten / literary Chinese fonts loaded via useDiaryFonts hook (expo-font).
// Family names MUST match the useFonts keys in use-diary-fonts.ts.
export const DIARY_FONT_FAMILIES = [
  { key: 'default', label: '系統預設', family: undefined as string | undefined },
  { key: 'wenkai', label: '手寫明體 · 霞鶩文楷', family: 'LXGWWenKai' },
  { key: 'iansui', label: '文青一點明體', family: 'Iansui' },
  { key: 'huninn', label: '奶油粉圓體', family: 'HunInn' },
  { key: 'brush', label: '毛筆手寫', family: 'MaShanZheng' },
  { key: 'cursive', label: '行草流動', family: 'LongCang' },
  { key: 'chunky', label: '圓潤手寫', family: 'ZCOOLKuaiLe' },
  {
    key: 'serif',
    label: '書卷宋體',
    family: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
  },
];

export const DIARY_TEXT_COLORS = [
  { key: 'dark', label: '深墨', color: '#2D3142' },
  { key: 'brown', label: '暖啡', color: '#5D4037' },
  { key: 'navy', label: '海軍藍', color: '#1F3A5F' },
  { key: 'ivory', label: '象牙白', color: '#F0EEE7' },
];

export const DIARY_FONT_SIZES = [15, 17, 19, 22, 26];

export type IconPack = {
  key: string;
  label: string;
  desc: string;
  color: string;
  locked: boolean;
};

export const ICON_PACKS: IconPack[] = [
  { key: 'classic', label: '經典飯碗', desc: '39 款陪住你嘅飯碗心情', color: '#F4C2C2', locked: false },
  { key: 'sea', label: '海洋朋友', desc: '海豚 · 章魚 · 水母…', color: '#A2D2FF', locked: true },
  { key: 'forest', label: '森林小夥伴', desc: '狐狸 · 兔仔 · 松鼠…', color: '#D6E5D8', locked: true },
  { key: 'sky', label: '雲朵樂園', desc: '同雲仔一齊感受', color: '#E0EAFC', locked: true },
];
