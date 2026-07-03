export type EmotionCategory = 'warm' | 'sad' | 'nervous' | 'wound' | 'anger';

export type Emotion = {
  key: string;
  label: string;
  description: string;
  color: string;
  category: EmotionCategory;
  image?: any; // PNG mascot (preferred when available)
  icon?: string; // Feather icon fallback while the mascot is being generated
};

export const EMOTION_CATEGORIES: {
  key: EmotionCategory;
  label: string;
  short: string;   // short label for chip
  color: string;
}[] = [
  { key: 'warm',    label: '溫暖 · 有力量',   short: '溫暖',       color: '#D6E5D8' },
  { key: 'sad',     label: '傷心 · 低能量',   short: '傷心',       color: '#BDE0FE' },
  { key: 'nervous', label: '緊張 · 不安',     short: '緊張',       color: '#FFD6A5' },
  { key: 'wound',   label: '自我懷疑 · 被傷', short: '自我懷疑',   color: '#D5AAFF' },
  { key: 'anger',   label: '憤怒 · 痛楚',     short: '憤怒',       color: '#FFAAA5' },
];

// Static requires so Metro can bundle the images.
export const EMOTION_IMAGES: Record<string, any> = {
  happy: require('../../assets/emotions/happy.png'),
  content: require('../../assets/emotions/content.png'),
  grateful: require('../../assets/emotions/grateful.png'),
  hopeful: require('../../assets/emotions/hopeful.png'),
  calm: require('../../assets/emotions/calm.png'),
  peaceful: require('../../assets/emotions/peaceful.png'),
  loved: require('../../assets/emotions/loved.png'),
  proud: require('../../assets/emotions/proud.png'),
  sad: require('../../assets/emotions/sad.png'),
  lonely: require('../../assets/emotions/lonely.png'),
  empty: require('../../assets/emotions/empty.png'),
  numb: require('../../assets/emotions/numb.png'),
  exhausted: require('../../assets/emotions/exhausted.png'),
  restless: require('../../assets/emotions/restless.png'),
  anxious: require('../../assets/emotions/anxious.png'),
  scared: require('../../assets/emotions/scared.png'),
  unmotivated: require('../../assets/emotions/unmotivated.png'),
  worried: require('../../assets/emotions/worried.png'),
  overwhelmed: require('../../assets/emotions/overwhelmed.png'),
  insecure: require('../../assets/emotions/insecure.png'),
  frustrated: require('../../assets/emotions/frustrated.png'),
  angry: require('../../assets/emotions/angry.png'),
  irritable: require('../../assets/emotions/irritable.png'),
  trapped: require('../../assets/emotions/trapped.png'),
  unfair: require('../../assets/emotions/unfair.png'),
  supported: require('../../assets/emotions/supported.png'),
  offended: require('../../assets/emotions/offended.png'),
  empowered: require('../../assets/emotions/empowered.png'),
  worthless: require('../../assets/emotions/worthless.png'),
  unloved: require('../../assets/emotions/unloved.png'),
  unappreciated: require('../../assets/emotions/unappreciated.png'),
  disrespected: require('../../assets/emotions/disrespected.png'),
  invisible: require('../../assets/emotions/invisible.png'),
  rejected: require('../../assets/emotions/rejected.png'),
  abandoned: require('../../assets/emotions/abandoned.png'),
  misunderstood: require('../../assets/emotions/misunderstood.png'),
  guilty: require('../../assets/emotions/guilty.png'),
  ashamed: require('../../assets/emotions/ashamed.png'),
  hopeless: require('../../assets/emotions/hopeless.png'),
  suppressed: require('../../assets/emotions/suppressed.png'),
  furious: require('../../assets/emotions/furious.png'),
  'in-pain': require('../../assets/emotions/in-pain.png'),
  'in-agony': require('../../assets/emotions/in-agony.png'),
};

export const EMOTIONS: Emotion[] = [
  // Warm / positive — sage/pink/warm-yellow spectrum
  { key: 'happy', label: '開心', description: '覺得輕鬆又快樂', color: '#D6E5D8', category: 'warm', image: EMOTION_IMAGES.happy },
  { key: 'content', label: '滿足', description: '心入面有種靜靜嘅滿足', color: '#B8E0C2', category: 'warm', image: EMOTION_IMAGES.content },
  { key: 'grateful', label: '感恩', description: '今日有啲嘢想感激', color: '#FFC8DD', category: 'warm', image: EMOTION_IMAGES.grateful },
  { key: 'hopeful', label: '有希望', description: '前面好似有一絲光', color: '#E0EAFC', category: 'warm', image: EMOTION_IMAGES.hopeful },
  { key: 'calm', label: '平靜', description: '溫柔而安定', color: '#A3C4BC', category: 'warm', image: EMOTION_IMAGES.calm },
  { key: 'peaceful', label: '安寧', description: '所有嘢都冇事咁', color: '#D2C1E5', category: 'warm', image: EMOTION_IMAGES.peaceful },
  { key: 'loved', label: '被愛', description: '感覺被關心緊', color: '#FFB6C1', category: 'warm', image: EMOTION_IMAGES.loved },
  { key: 'supported', label: '被支持', description: '有人喺我身邊撐我', color: '#F4C2C2', category: 'warm', image: EMOTION_IMAGES.supported },
  { key: 'proud', label: '自豪', description: '我做咗啲好嘢', color: '#FFE68A', category: 'warm', image: EMOTION_IMAGES.proud },
  { key: 'empowered', label: '有力量', description: '我夠力面對', color: '#FFA76E', category: 'warm', image: EMOTION_IMAGES.empowered },

  // Sadness / low energy — cool blues/greys
  { key: 'sad', label: '傷心', description: '心入面有種柔和嘅沉重', color: '#A2D2FF', category: 'sad', image: EMOTION_IMAGES.sad },
  { key: 'lonely', label: '寂寞', description: '好想有人喺身邊', color: '#B4CCE8', category: 'sad', image: EMOTION_IMAGES.lonely },
  { key: 'unmotivated', label: '冇心機', description: '提唔起勁做嘢', color: '#B7CFC0', category: 'sad', image: EMOTION_IMAGES.unmotivated },
  { key: 'empty', label: '空虛', description: '而家好似乜都感受唔到', color: '#EFECE4', category: 'sad', image: EMOTION_IMAGES.empty },
  { key: 'numb', label: '麻木', description: '同自己有距離', color: '#CFD3D6', category: 'sad', image: EMOTION_IMAGES.numb },
  { key: 'exhausted', label: '好攰', description: '身心都攰晒', color: '#DBC5E8', category: 'sad', image: EMOTION_IMAGES.exhausted },

  // Nervous / tense — yellows/oranges/teal
  { key: 'restless', label: '不知所措', description: '唔知點算好', color: '#FFEB99', category: 'nervous', image: EMOTION_IMAGES.restless },
  { key: 'irritable', label: '煩躁', description: '個火開始上湧', color: '#FF9E7A', category: 'nervous', image: EMOTION_IMAGES.irritable },
  { key: 'anxious', label: '焦慮', description: '心入面亂到停唔到', color: '#FFCC99', category: 'nervous', image: EMOTION_IMAGES.anxious },
  { key: 'scared', label: '驚', description: '心跳好快 · 好唔安', color: '#FFDCA5', category: 'nervous', image: EMOTION_IMAGES.scared },
  { key: 'worried', label: '擔心', description: '諗嘢停唔到', color: '#FFE9B2', category: 'nervous', image: EMOTION_IMAGES.worried },
  { key: 'overwhelmed', label: '透唔到氣', description: '好多嘢一齊嚟', color: '#E8B0A8', category: 'nervous', image: EMOTION_IMAGES.overwhelmed },
  { key: 'trapped', label: '被困', description: '好似逃唔到出去', color: '#7FB3C8', category: 'nervous', image: EMOTION_IMAGES.trapped },

  // Self-worth wounds — purples/muted greys
  { key: 'worthless', label: '冇價值', description: '覺得自己毫無價值', color: '#B8BFDF', category: 'wound', image: EMOTION_IMAGES.worthless },
  { key: 'insecure', label: '冇自信', description: '覺得自己唔夠好', color: '#C7A8D5', category: 'wound', image: EMOTION_IMAGES.insecure },
  { key: 'unloved', label: '唔被愛', description: '冇人真心錫我', color: '#EAB0AA', category: 'wound', image: EMOTION_IMAGES.unloved },
  { key: 'unappreciated', label: '被排擠', description: '好似被人剩落', color: '#D5AAFF', category: 'wound', image: EMOTION_IMAGES.unappreciated },
  { key: 'disrespected', label: '唔被尊重', description: '好似被人睇小', color: '#F5A088', category: 'wound', image: EMOTION_IMAGES.disrespected },
  { key: 'invisible', label: '被忽視', description: '好似冇人見到我', color: '#A9B0BC', category: 'wound', image: EMOTION_IMAGES.invisible },
  { key: 'rejected', label: '被拒絕', description: '唔被接納', color: '#F5C69B', category: 'wound', image: EMOTION_IMAGES.rejected },
  { key: 'abandoned', label: '被拋棄', description: '感覺被人丟低', color: '#B8D5DE', category: 'wound', image: EMOTION_IMAGES.abandoned },
  { key: 'misunderstood', label: '唔被理解', description: '講極都冇人明', color: '#A899CE', category: 'wound', image: EMOTION_IMAGES.misunderstood },
  { key: 'unfair', label: '唔公平', description: '點解會咁對我?', color: '#7B93B0', category: 'wound', image: EMOTION_IMAGES.unfair },
  { key: 'guilty', label: '內疚', description: '覺得係自己嘅錯', color: '#E8D57A', category: 'wound', image: EMOTION_IMAGES.guilty },
  { key: 'ashamed', label: '羞愧', description: '想搵個窿匿埋', color: '#E6A896', category: 'wound', image: EMOTION_IMAGES.ashamed },
  { key: 'hopeless', label: '絕望', description: '睇唔到前面嘅路', color: '#A0AEB8', category: 'wound', image: EMOTION_IMAGES.hopeless },
  { key: 'suppressed', label: '被打壓', description: '俾人壓住 · 冇聲出', color: '#6E7C8A', category: 'wound', image: EMOTION_IMAGES.suppressed },

  // Anger / intense — reds/deep tones
  { key: 'frustrated', label: '沮喪', description: '好似卡住咗', color: '#EDBEB6', category: 'anger', image: EMOTION_IMAGES.frustrated },
  { key: 'angry', label: '嬲', description: '心入面有把火', color: '#F58884', category: 'anger', image: EMOTION_IMAGES.angry },
  { key: 'offended', label: '被冒犯', description: '個心俾人踩咗一腳', color: '#DC9A70', category: 'anger', image: EMOTION_IMAGES.offended },
  { key: 'furious', label: '激嬲', description: '把火燒到頂', color: '#E86A6A', category: 'anger', image: EMOTION_IMAGES.furious },
  { key: 'in-pain', label: '痛苦', description: '心 / 身好痛', color: '#D97D77', category: 'anger', image: EMOTION_IMAGES['in-pain'] },
  { key: 'in-agony', label: '煎熬', description: '痛得好難捱', color: '#8B7AA6', category: 'anger', image: EMOTION_IMAGES['in-agony'] },
];

export const EMOTION_BY_KEY: Record<string, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {},
);
