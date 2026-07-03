// 情緒爆發 / 好激動嘅時候可以做嘅小動作
// 全部都係心理學同神經科學驗證過嘅 grounding / regulation techniques

export type CalmTechnique = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;      // card background tint
  accent: string;     // icon circle + accent
  duration: string;
  steps: string[];
  science: string;    // 一句解釋點解有效
};

export const CALM_TECHNIQUES: CalmTechnique[] = [
  {
    key: 'cold-water',
    emoji: '💧',
    title: '洗手 · 洗面',
    subtitle: '用凍水冷卻情緒',
    color: '#E0F2FE',
    accent: '#7DBEE8',
    duration: '1 分鐘',
    steps: [
      '去洗手盆企定',
      '開凍水 · 越凍越好',
      '用手掌接住水 · 慢慢洗手',
      '再輕輕拍面幾下',
      '深呼吸 · 感受個涼快',
    ],
    science: '凍水會觸發身體嘅「潛水反射 (Dive Reflex)」— 幫個心跳慢返、副交感神經上位。醫學驗證嘅減焦慮方法。',
  },
  {
    key: 'clean-up',
    emoji: '🧹',
    title: '郁動整理',
    subtitle: '用身體帶走情緒',
    color: '#DFF3E4',
    accent: '#84C99E',
    duration: '10 分鐘',
    steps: [
      '揀一件細小嘅嘢先 · 例如洗個杯 / 執張枱 / 摺件衫',
      '一邊做 · 一邊留意手腳嘅動作',
      '唔使諗完美 · 過程比結果重要',
      '做完之後 · 望吓自己整理咗嘅位置',
    ],
    science: '有目的嘅小動作可以將情緒能量轉化成「掌控感」· 做完仲會有種細細嘅成就感，可以逼退焦慮。',
  },
  {
    key: 'walk',
    emoji: '🚶',
    title: '出去行下',
    subtitle: '換個環境 · 換個節奏',
    color: '#FEE9CE',
    accent: '#F0AE64',
    duration: '10-20 分鐘',
    steps: [
      '著返舒服嘅鞋 · 唔使刻意打扮',
      '唔使目的地 · 隨心行',
      '留意腳掌落地嘅感覺',
      '望吓路邊嘅樹 / 天空 · 聽下雀仔聲',
      '返到屋企 · 飲杯溫水',
    ],
    science: '步伐嘅節奏（左右左右）會幫個腦「重新上返線」· 陽光同新鮮空氣可以直接提升血清素。',
  },
  {
    key: 'grounding',
    emoji: '🔢',
    title: '5·4·3·2·1 五感感受',
    subtitle: '將注意力帶返嚟現實',
    color: '#EDE0F5',
    accent: '#B08FD1',
    duration: '3 分鐘',
    steps: [
      '講出 5 樣你「睇」到嘅嘢',
      '講出 4 種你「聽」到嘅聲',
      '講出 3 樣你「摸」到嘅嘢（衫、枱、頭髮…）',
      '講出 2 種你「聞」到嘅味',
      '講出 1 種你「食 / 飲」到嘅味（飲啖水都得）',
    ],
    science: '呢個係心理治療常用嘅 grounding 技巧 · 專治「情緒失控」嗰種抽離感 · 將個腦由「戰或逃」拉返嚟現在。',
  },
  {
    key: 'heart-touch',
    emoji: '🤲',
    title: '摸吓自己心口',
    subtitle: '同自己講一聲',
    color: '#FBD9E4',
    accent: '#E499B4',
    duration: '1 分鐘',
    steps: [
      '搵個舒服嘅位置坐低（或者企定）',
      '一隻手輕輕放喺自己心口',
      '感受吓自己嘅心跳',
      '慢慢深呼吸 3 次',
      '同自己講一句：「我而家嘅感覺係真嘅 · 我值得溫柔」',
    ],
    science: '將手放喺心口會啟動催產素（Oxytocin）· 身體會慢慢冷靜落嚟 · 呢個叫「self-compassion touch」。',
  },
];
