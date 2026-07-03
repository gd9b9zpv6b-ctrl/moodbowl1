import { Platform } from 'react-native';

// Premium diary style presets. Extendable — add new backgrounds/fonts here.

export const DIARY_BACKGROUNDS = [
  { key: 'classic', label: '溫柔米白', color: '#F9F8F6' },
  { key: 'sage', label: '柔和薄荷', color: '#E8F0EA' },
  { key: 'rose', label: '柔和粉紅', color: '#FBEAEA' },
  { key: 'lavender', label: '寧靜薰衣草', color: '#EFEAFB' },
  { key: 'sky', label: '晴朗天空', color: '#E7F1FB' },
  { key: 'sand', label: '暖沙米色', color: '#F3E9D8' },
  { key: 'night', label: '深夜寧靜', color: '#2C2D3A' },
];

// Use real platform font family names so each option is visually distinct.
export const DIARY_FONT_FAMILIES = [
  { key: 'default', label: '系統預設', family: undefined as string | undefined },
  {
    key: 'serif',
    label: '書卷宋體',
    family: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
  },
  {
    key: 'mono',
    label: '手寫機字',
    family: Platform.select({ ios: 'Courier New', android: 'monospace', default: '"Courier New", monospace' }),
  },
  {
    key: 'rounded',
    label: '柔和圓體',
    family: Platform.select({
      ios: 'Avenir Next Rounded',
      android: 'sans-serif-medium',
      default: '"Avenir Next Rounded", "Nunito", sans-serif',
    }),
  },
  {
    key: 'handwriting',
    label: '手寫感',
    family: Platform.select({
      ios: 'Snell Roundhand',
      android: 'casual',
      default: '"Snell Roundhand", "Brush Script MT", cursive',
    }),
  },
];

export const DIARY_TEXT_COLORS = [
  { key: 'dark', label: '深墨', color: '#2D3142' },
  { key: 'brown', label: '暖啡', color: '#5D4037' },
  { key: 'navy', label: '海軍藍', color: '#1F3A5F' },
  { key: 'ivory', label: '象牙白', color: '#FFFFFF' },
];

export const DIARY_FONT_SIZES = [13, 15, 17, 19, 22];

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
