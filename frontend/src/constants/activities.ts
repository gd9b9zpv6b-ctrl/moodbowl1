// 輕輕鼓勵用家出去 / 感受世界嘅小活動。以香港為背景嘅溫柔提議。

export type Activity = {
  key: string;
  title: string;
  desc: string;
  icon: string; // Feather icon
  color: string;
  category: 'outdoor' | 'social' | 'creative' | 'sensory' | 'micro' | 'partner';

  // Optional extended fields — used by featured / partner events with dedicated
  // detail screens (e.g. Yi Jin Jing course sign-up).
  featured?: boolean;
  emoji?: string;           // hero emoji
  subtitle?: string;        // small header
  long_desc?: string;       // multi-paragraph description
  bullets?: string[];       // highlights
  dates?: string[];         // date strings
  time?: string;            // e.g. "10:00–12:00"
  location?: string;
  prices?: { label: string; amount: string }[];
  notes?: string[];
  register_url?: string;    // Google Forms / external URL
  cta_label?: string;       // e.g. "立即登記"
  footer_quote?: string;    // closing line
};

export const ACTIVITIES: Activity[] = [
  // ===================== FEATURED / PARTNER EVENTS =====================
  {
    key: 'yijinjing',
    title: '易筋經 · 進階養生課程',
    desc: '如庫導師親授 · 五堂體驗 · 深研逾二十年',
    icon: 'wind',
    color: '#D6E5D8',
    category: 'partner',
    featured: true,
    emoji: '🌿',
    subtitle: '如庫導師 · 進階養生課程',
    long_desc:
      '逾二十年深研，如庫導師融通東方養生智慧與當代運動科學，以「筋骨調正、氣血活化、自主持續」為核心，引導學員於形體屈伸俯仰間，體現「伸筋拔骨」之要義——鬆而不懈，緊而不僵，動靜皆帶旋繞之力，力透筋骨，氣順自然。\n\n課程傳承易筋經「內外兼修」之道，強調「形神合一」：透過鼻吸鼻呼、意氣相隨，達至精神內守、心澄貌恭之境，終致身心和諧。學員反饋證實，踝膝關節穩定、韌帶修復等亞健康問題顯著改善。',
    bullets: [
      '系統化經絡拍打教學 · 易學易用',
      '獨家「每日 10 分鐘」居家練習 · 融入日常',
      '精緻小班 · 導師親授 · 確保品質',
    ],
    dates: [
      '8/10 週一',
      '8/17 週一',
      '8/24 週一',
      '9/7 週一',
      '9/14 週一',
    ],
    time: '共五課 · 每課 2 小時 (10:00–12:00)',
    location: '九龍太子太子道西 182–184 號金寶樓 1B',
    prices: [
      { label: '新學員', amount: 'HK$2,500' },
      { label: '復課', amount: 'HK$2,000' },
      { label: '勤練', amount: 'HK$1,500' },
    ],
    notes: [
      '名額極有限 · 本表單僅作預留登記 · WhatsApp 確認最終名額及繳費',
      '本課程屬傳統養生保健分享 · 不可替代醫療建議',
      '身體不適或存舊患 · 請先諮詢醫生 · 量力而為',
    ],
    register_url: 'https://forms.gle/tcZRp9ASwcoNNUWk8',
    cta_label: '立即登記 · 為健康踏出一步',
    footer_quote: '持之以恆 · 方法與心態並重 —— 呢個先係易筋經嘅真諦。',
  },

  // ===================== Micro — tiny things you can do right now =====================
  { key: 'window', title: '望出窗外 60 秒', desc: '睇下天空 · 深呼吸 · 感受依家', icon: 'sun', color: '#E0EAFC', category: 'micro' },
  { key: 'sky-photo', title: '影一張天空相', desc: '留意雲嘅形狀', icon: 'camera', color: '#BDE0FE', category: 'micro' },
  { key: 'plant', title: '摸下身邊嘅植物', desc: '感受葉嘅紋理', icon: 'feather', color: '#D6E5D8', category: 'micro' },

  // ===================== Outdoor / HK-specific =====================
  { key: 'park', title: '去附近嘅公園坐一陣', desc: '搵張長凳 · 望下小朋友玩', icon: 'map-pin', color: '#C8E6C9', category: 'outdoor' },
  { key: 'harbour', title: '去海邊行下', desc: '維港 / 尖沙咀 / 西環海濱', icon: 'anchor', color: '#A2D2FF', category: 'outdoor' },
  { key: 'hike', title: '行一條輕鬆嘅山', desc: '龍脊 / 家樂徑 / 大潭', icon: 'trending-up', color: '#A3C4BC', category: 'outdoor' },
  { key: 'ferry', title: '搭一程天星小輪', desc: '5 分鐘 · HK$5 · 心情大變', icon: 'navigation', color: '#B8C0FF', category: 'outdoor' },
  { key: 'island', title: '去離島半日遊', desc: '長洲 / 南丫 / 坪洲', icon: 'compass', color: '#BDE0FE', category: 'outdoor' },
  { key: 'peak', title: '搭纜車上太平山', desc: '睇香港嘅全景', icon: 'arrow-up-right', color: '#CDB4DB', category: 'outdoor' },
  { key: 'sunset', title: '追一次日落', desc: '記得帶埋耳機', icon: 'sunset', color: '#FFD6A5', category: 'outdoor' },
  { key: 'market', title: '行下街市 / 果欄', desc: '感受最真實嘅生活氣息', icon: 'shopping-bag', color: '#FFE4B5', category: 'outdoor' },

  // ===================== Sensory / creative =====================
  { key: 'library', title: '去圖書館坐半個鐘', desc: '揀本你完全冇聽過嘅書', icon: 'book-open', color: '#F0EFEB', category: 'sensory' },
  { key: 'museum', title: '參觀藝術館 / 博物館', desc: '好多都係免費入場', icon: 'aperture', color: '#E0BBE4', category: 'creative' },
  { key: 'cafe', title: '試一間新嘅 café', desc: '慢慢飲 · 唔玩手機', icon: 'coffee', color: '#F4D0C9', category: 'sensory' },
  { key: 'draw', title: '亂畫 5 分鐘', desc: '唔一定要靚 · 感受個過程', icon: 'edit-2', color: '#FFC8DD', category: 'creative' },
  { key: 'music-new', title: '聽一張全新專輯', desc: '由頭聽到尾 · 唔跳歌', icon: 'headphones', color: '#B8C0FF', category: 'creative' },

  // ===================== Social =====================
  { key: 'text-friend', title: '傳訊息俾好耐冇傾嘅朋友', desc: '一句「最近點呀」都得', icon: 'message-circle', color: '#FFB6C1', category: 'social' },
  { key: 'kind-word', title: '同陌生人講聲多謝', desc: '收銀員 / 巴士司機 / 保安', icon: 'smile', color: '#FFC8DD', category: 'social' },
  { key: 'volunteer', title: '搵一個義工活動', desc: 'HandsOn / 義工發展局', icon: 'users', color: '#D1E2DE', category: 'social' },
  { key: 'pet', title: '同動物玩下', desc: '朋友嘅貓 / 狗公園 / cat café', icon: 'heart', color: '#F4D0C9', category: 'social' },
];

export const ACTIVITY_BY_KEY: Record<string, Activity> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.key, a]),
);

export const ACTIVITY_CATEGORIES: Record<Activity['category'], string> = {
  micro: '而家就可以做',
  outdoor: '出去行走',
  sensory: '感官休息',
  creative: '創作放鬆',
  social: '與人連結',
  partner: '精選活動',
};
