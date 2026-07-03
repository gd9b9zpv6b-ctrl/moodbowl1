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
  // ---- 情境專屬 · 額外技巧 ----
  {
    key: 'hot-shower',
    emoji: '🚿',
    title: '沖個熱水涼',
    subtitle: '用溫熱包住自己',
    color: '#FFE9D6',
    accent: '#F0A870',
    duration: '10 分鐘',
    steps: [
      '調到啱自己嘅溫水（唔一定要好熱）',
      '企喺水柱下 · 由頭頂沖到腳',
      '留意水拍打皮膚嘅感覺',
      '可以喺入面細細聲叫 · 或者流眼淚都得',
      '出嚟後用毛巾包住自己一陣',
    ],
    science: '熱水+單獨空間可以觸發副交感神經 · 個廁所係最容易「安全發洩」嘅私人空間。',
  },
  {
    key: 'pillow-scream',
    emoji: '🛌',
    title: '對住枕頭大叫',
    subtitle: '安全咁釋放個壓',
    color: '#FBE0E8',
    accent: '#E68AA8',
    duration: '2 分鐘',
    steps: [
      '搵個厚實嘅枕頭',
      '將面完全埋落枕頭度',
      '深深吸一啖氣 · 然後用力大叫',
      '想叫幾多次都得 · 想喊都可以',
      '叫完瞓喺床上休息一陣',
    ],
    science: '尖叫係本能嘅情緒釋放 · 枕頭可以吸音、避免嚇到人 · 生理上可以即時降低皮質醇。',
  },
  {
    key: 'desk-breathing',
    emoji: '🪑',
    title: '座位深呼吸',
    subtitle: '冇人會察覺到',
    color: '#E4E9F5',
    accent: '#8FA5D1',
    duration: '2 分鐘',
    steps: [
      '坐直身 · 雙腳平放地下',
      '望住電腦或者文件 · 好似專心睇緊嘢',
      '慢慢用鼻吸氣 · 心入面數 4 秒',
      '停 2 秒 · 再慢慢用鼻呼氣 6 秒',
      '重複 5-8 次',
    ],
    science: '鼻呼吸+延長呼氣可以啟動迷走神經 · 心跳會慢慢平復 · 完全隱形嘅急救。',
  },
  {
    key: 'jaw-release',
    emoji: '😌',
    title: '放鬆下巴同肩膀',
    subtitle: '偷偷解開身體嘅結',
    color: '#E8F4E4',
    accent: '#8FBF84',
    duration: '2 分鐘',
    steps: [
      '留意吓自己咬緊牙關無？',
      '輕輕張開嘴 · 舌頭放鬆貼落下顎',
      '慢慢轉動下巴左右幾下',
      '聳吓肩膀 · 停 3 秒 · 突然放低',
      '重複幾次',
    ],
    science: '焦慮時我哋潛意識咬緊牙關同縮肩 · 主動釋放呢啲部位 · 大腦會收到「安全」信號。',
  },
  {
    key: 'safe-music',
    emoji: '🎧',
    title: '聽首「安全歌」',
    subtitle: '一首你聽極都唔厭嘅',
    color: '#E0EAFC',
    accent: '#7DA8DC',
    duration: '3-5 分鐘',
    steps: [
      '揀一首你熟到爆嘅歌（唔使新歌）',
      '戴耳機 · 音量調到剛剛好',
      '閉埋眼 · 或者望住一個定點',
      '跟住歌詞哼 / 或者只係聽',
      '感受個聲音包住自己',
    ],
    science: '熟悉嘅音樂會激活大腦嘅獎賞系統 · 產生多巴胺 · 有安全感 · 出街時最方便嘅工具。',
  },
  {
    key: '478-breath',
    emoji: '🌬️',
    title: '4-7-8 呼吸法',
    subtitle: '訓唔到嗰陣特別有效',
    color: '#EDE4F5',
    accent: '#B08FD1',
    duration: '2 分鐘',
    steps: [
      '瞓喺床上 · 舌尖輕輕頂住上顎',
      '完全呼出所有空氣（用口）',
      '用鼻吸氣 4 秒',
      '停住個氣 7 秒',
      '用口慢慢呼出 8 秒（會有咻嘅聲）',
      '重複 4 個循環',
    ],
    science: '呢個係 Dr. Andrew Weil 開創嘅方法 · 被稱為「天然嘅鎮靜劑」· 特別適合失眠、恐慌發作。',
  },
  {
    key: 'body-scan',
    emoji: '🧘',
    title: '身體掃描',
    subtitle: '由頭到腳放鬆',
    color: '#E4F0E8',
    accent: '#7BA88C',
    duration: '5-10 分鐘',
    steps: [
      '瞓平 · 手腳自然放鬆',
      '注意力放喺頭頂 · 感受吓',
      '慢慢向下移：面 → 頸 → 膊頭 → 手 → 胸口 → 肚 → 腰 → 臀 → 大腿 → 小腿 → 腳',
      '每去到一個位 · 停 5-10 秒 · 有意識咁放鬆嗰個位',
      '如果覺得有邊度緊 · 深呼吸幾次去嗰度',
    ],
    science: '正念（Mindfulness）核心練習 · 將注意力由「思考」轉去「感受」· 慢慢會訓著。',
  },
  {
    key: 'brain-dump',
    emoji: '📝',
    title: '腦入面所有嘢寫落紙',
    subtitle: '倒空個腦',
    color: '#F5EBD9',
    accent: '#C9A265',
    duration: '10 分鐘',
    steps: [
      '搵張紙同筆（唔好用電話）',
      '定個 10 分鐘計時',
      '將腦入面所有諗法通通寫出嚟',
      '亂寫都得 · 唔用理文法 · 唔用睇返',
      '寫完可以撕爛掉 · 或者收埋等第二日睇',
    ],
    science: '「Brain Dump」係認知行為治療（CBT）常用技巧 · 將思緒外化 · 可以即時減輕心智負荷。',
  },
];

// ---- 情境分類：唔同場合啱唔同技巧 ----
export type CalmSituation = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  techniqueKeys: string[];
};

export const CALM_SITUATIONS: CalmSituation[] = [
  {
    key: 'home',
    emoji: '🏠',
    title: '喺屋企',
    subtitle: '有時間 · 有空間 · 可以大膽啲',
    color: '#DFF3E4',
    techniqueKeys: ['hot-shower', 'pillow-scream', 'clean-up', 'cold-water', 'heart-touch'],
  },
  {
    key: 'work',
    emoji: '💼',
    title: '返緊工',
    subtitle: '唔想俾人見到 · 要保持專業',
    color: '#E4E9F5',
    techniqueKeys: ['desk-breathing', 'jaw-release', 'cold-water', 'grounding', 'heart-touch'],
  },
  {
    key: 'outside',
    emoji: '🚇',
    title: '出街 / 交通工具',
    subtitle: '身邊有陌生人 · 要低調',
    color: '#E0EAFC',
    techniqueKeys: ['safe-music', 'grounding', 'heart-touch', 'jaw-release'],
  },
  {
    key: 'night',
    emoji: '🌙',
    title: '夜晚訓唔到',
    subtitle: '個腦停唔到 · 心跳好快',
    color: '#EDE4F5',
    techniqueKeys: ['478-breath', 'body-scan', 'brain-dump', 'heart-touch'],
  },
  {
    key: 'crowd',
    emoji: '👥',
    title: '人多嘈雜',
    subtitle: '想逃避 · 感官超載',
    color: '#FFE9D6',
    techniqueKeys: ['safe-music', 'grounding', 'jaw-release', 'walk'],
  },
  {
    key: 'intense',
    emoji: '🔥',
    title: '好激烈 · 想爆',
    subtitle: '剛嗌完交 · 或者嬲到爆',
    color: '#FBD9E4',
    techniqueKeys: ['cold-water', 'walk', 'pillow-scream', 'clean-up', 'brain-dump'],
  },
];

// 方便從 key 攞返 technique
export const TECHNIQUE_BY_KEY: Record<string, CalmTechnique> = CALM_TECHNIQUES.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {},
);
