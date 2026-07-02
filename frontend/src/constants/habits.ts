// Small self-care habits users can quickly add to their day.
// Icons are Feather names. Colors are healing pastels.

export type Habit = {
  key: string;
  title: string;
  icon: string;
  color: string;
};

export const HABITS: Habit[] = [
  { key: 'water', title: '飲一杯水', icon: 'droplet', color: '#A2D2FF' },
  { key: 'breath', title: '深呼吸 3 次', icon: 'wind', color: '#D6E5D8' },
  { key: 'meditate', title: '靜坐 5 分鐘', icon: 'moon', color: '#CDB4DB' },
  { key: 'walk', title: '出去行下', icon: 'navigation', color: '#C8E6C9' },
  { key: 'stretch', title: '伸展一下身體', icon: 'maximize', color: '#FFDEAD' },
  { key: 'sun', title: '曬 5 分鐘太陽', icon: 'sun', color: '#FFF3B0' },
  { key: 'gratitude', title: '感恩 3 件事', icon: 'heart', color: '#FFC8DD' },
  { key: 'read', title: '讀 10 分鐘書', icon: 'book-open', color: '#E0EAFC' },
  { key: 'sleep', title: '早啲瞓', icon: 'cloud', color: '#BDE0FE' },
  { key: 'talk', title: '同人傾兩句', icon: 'message-circle', color: '#F4D0C9' },
  { key: 'music', title: '聽一首好聽嘅歌', icon: 'music', color: '#E0BBE4' },
  { key: 'kind-words', title: '對自己講句好話', icon: 'smile', color: '#FFB6C1' },
  { key: 'journal', title: '寫兩句日記', icon: 'edit-3', color: '#D1E2DE' },
  { key: 'shower', title: '沖個熱水涼', icon: 'cloud-drizzle', color: '#A3C4BC' },
  { key: 'no-phone', title: '15 分鐘唔碌手機', icon: 'smartphone', color: '#F0EFEB' },
  { key: 'tidy', title: '執下枱面', icon: 'grid', color: '#FFE4B5' },
];
