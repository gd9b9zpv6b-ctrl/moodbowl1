// Small self-care habits users can quickly add to their day.
// Icons are Feather names. Colors are healing pastels.

export type HabitCategory = 'body' | 'mind' | 'social' | 'rest';

export type Habit = {
  key: string;
  title: string;
  icon: string;
  color: string;
  category: HabitCategory;
};

export const HABIT_CATEGORIES: { key: HabitCategory; label: string; emoji: string }[] = [
  { key: 'body',   label: '身體',       emoji: '💪' },
  { key: 'mind',   label: '心靈',       emoji: '🧠' },
  { key: 'social', label: '社交',       emoji: '💬' },
  { key: 'rest',   label: '休息 · 放鬆', emoji: '🌙' },
];

export const HABITS: Habit[] = [
  // 身體 · body
  { key: 'water',     title: '飲一杯水',       icon: 'droplet',        color: '#A2D2FF', category: 'body' },
  { key: 'walk',      title: '出去行下',       icon: 'navigation',     color: '#C8E6C9', category: 'body' },
  { key: 'stretch',   title: '伸展一下身體',    icon: 'maximize',       color: '#FFDEAD', category: 'body' },
  { key: 'sun',       title: '曬 5 分鐘太陽',   icon: 'sun',            color: '#FFF3B0', category: 'body' },
  { key: 'shower',    title: '沖個熱水涼',      icon: 'cloud-drizzle',  color: '#A3C4BC', category: 'body' },

  // 心靈 · mind
  { key: 'breath',    title: '深呼吸 3 次',     icon: 'wind',           color: '#D6E5D8', category: 'mind' },
  { key: 'meditate',  title: '靜坐 5 分鐘',     icon: 'moon',           color: '#CDB4DB', category: 'mind' },
  { key: 'gratitude', title: '感恩 3 件事',     icon: 'heart',          color: '#FFC8DD', category: 'mind' },
  { key: 'kind-words',title: '對自己講句好話',  icon: 'smile',          color: '#FFB6C1', category: 'mind' },
  { key: 'journal',   title: '寫兩句日記',      icon: 'edit-3',         color: '#D1E2DE', category: 'mind' },

  // 社交 · social
  { key: 'talk',      title: '同人傾兩句',      icon: 'message-circle', color: '#F4D0C9', category: 'social' },

  // 休息 · rest
  { key: 'read',      title: '讀 10 分鐘書',    icon: 'book-open',      color: '#E0EAFC', category: 'rest' },
  { key: 'sleep',     title: '早啲瞓',          icon: 'cloud',          color: '#BDE0FE', category: 'rest' },
  { key: 'music',     title: '聽一首好聽嘅歌',  icon: 'music',          color: '#E0BBE4', category: 'rest' },
  { key: 'no-phone',  title: '15 分鐘唔碌手機', icon: 'smartphone',     color: '#F0EFEB', category: 'rest' },
  { key: 'tidy',      title: '執下枱面',        icon: 'grid',           color: '#FFE4B5', category: 'rest' },
];
