export type EmotionCategory = 'warm' | 'sad' | 'nervous' | 'wound' | 'anger' | 'unspoken';

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
  { key: 'unspoken',label: '講唔出 · 一言難盡', short: '講唔出',    color: '#E8D5F0' },
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
  uneasy: require('../../assets/emotions/uneasy.png'),
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
  free: require('../../assets/emotions/free.png'),
  foggy: require('../../assets/emotions/foggy.png'),
  questioning: require('../../assets/emotions/questioning.png'),
  blank: require('../../assets/emotions/blank.png'),
  awkward: require('../../assets/emotions/awkward.png'),
};

export const EMOTIONS: Emotion[] = [
  // Warm / positive — greens · warm pinks · sun colors
  { key: 'happy', label: '開心', description: '覺得輕鬆又快樂', color: '#A8DBB2', category: 'warm', image: EMOTION_IMAGES.happy },
  { key: 'content', label: '滿足', description: '心入面有種靜靜嘅滿足', color: '#C7E4A0', category: 'warm', image: EMOTION_IMAGES.content },
  { key: 'grateful', label: '感恩', description: '今日有啲嘢想感激', color: '#FFC5DE', category: 'warm', image: EMOTION_IMAGES.grateful },
  { key: 'hopeful', label: '有希望', description: '前面好似有一絲光', color: '#C1DFF8', category: 'warm', image: EMOTION_IMAGES.hopeful },
  { key: 'calm', label: '平靜', description: '溫柔而安定', color: '#82C4B8', category: 'warm', image: EMOTION_IMAGES.calm },
  { key: 'peaceful', label: '安寧', description: '所有嘢都冇事咁', color: '#C1B5E8', category: 'warm', image: EMOTION_IMAGES.peaceful },
  { key: 'loved', label: '被愛', description: '感覺被關心緊', color: '#F8A2B8', category: 'warm', image: EMOTION_IMAGES.loved },
  { key: 'supported', label: '被支持', description: '有人喺我身邊撐我', color: '#F6C4B7', category: 'warm', image: EMOTION_IMAGES.supported },
  { key: 'proud', label: '自豪', description: '我做咗啲好嘢', color: '#FFDA5E', category: 'warm', image: EMOTION_IMAGES.proud },
  { key: 'empowered', label: '有力量', description: '我夠力面對', color: '#FF9151', category: 'warm', image: EMOTION_IMAGES.empowered },
  { key: 'free', label: '自由', description: '無拘無束 · 好舒暢', color: '#B8D9F5', category: 'warm', image: EMOTION_IMAGES.free },

  // Sadness / low energy — spread across hues (藍/青/綠/米/灰/紫)
  { key: 'sad', label: '傷心', description: '心入面有種柔和嘅沉重', color: '#A2CCFF', category: 'sad', image: EMOTION_IMAGES.sad },
  { key: 'lonely', label: '寂寞', description: '好想有人喺身邊', color: '#A87FA5', category: 'sad', image: EMOTION_IMAGES.lonely },
  { key: 'unmotivated', label: '冇心機', description: '提唔起勁做嘢', color: '#A6C1A6', category: 'sad', image: EMOTION_IMAGES.unmotivated },
  { key: 'empty', label: '空虛', description: '而家好似乜都感受唔到', color: '#EDE7D6', category: 'sad', image: EMOTION_IMAGES.empty },
  { key: 'numb', label: '麻木', description: '同自己有距離', color: '#B5B9BE', category: 'sad', image: EMOTION_IMAGES.numb },
  { key: 'exhausted', label: '好攰', description: '身心都攰晒', color: '#C6A3E5', category: 'sad', image: EMOTION_IMAGES.exhausted },

  // Nervous / tense — spread across hues (黃/橙/粉/紫/綠/紅/青)
  { key: 'restless', label: '不知所措', description: '唔知點算好', color: '#FFF199', category: 'nervous', image: EMOTION_IMAGES.restless },
  { key: 'irritable', label: '煩躁', description: '個火開始上湧', color: '#FF8264', category: 'nervous', image: EMOTION_IMAGES.irritable },
  { key: 'anxious', label: '焦慮', description: '心入面亂到停唔到', color: '#D48DB4', category: 'nervous', image: EMOTION_IMAGES.anxious },
  { key: 'scared', label: '驚', description: '心跳好快 · 好唔安', color: '#9A93C0', category: 'nervous', image: EMOTION_IMAGES.scared },
  { key: 'uneasy', label: '不安', description: '心裡總覺得有啲怪怪嘅', color: '#B0A08B', category: 'nervous', image: EMOTION_IMAGES.uneasy },
  { key: 'worried', label: '擔心', description: '諗嘢停唔到', color: '#D5DBA8', category: 'nervous', image: EMOTION_IMAGES.worried },
  { key: 'overwhelmed', label: '透唔到氣', description: '好多嘢一齊嚟', color: '#C4756E', category: 'nervous', image: EMOTION_IMAGES.overwhelmed },
  { key: 'trapped', label: '被困', description: '好似逃唔到出去', color: '#6BA8BF', category: 'nervous', image: EMOTION_IMAGES.trapped },

  // Self-worth wounds — muted purples/browns/greys
  { key: 'worthless', label: '冇價值', description: '覺得自己毫無價值', color: '#96A2C8', category: 'wound', image: EMOTION_IMAGES.worthless },
  { key: 'insecure', label: '冇自信', description: '覺得自己唔夠好', color: '#B394CF', category: 'wound', image: EMOTION_IMAGES.insecure },
  { key: 'unloved', label: '唔被愛', description: '冇人真心錫我', color: '#E8988D', category: 'wound', image: EMOTION_IMAGES.unloved },
  { key: 'unappreciated', label: '被排擠', description: '好似被人剩落', color: '#C58AF0', category: 'wound', image: EMOTION_IMAGES.unappreciated },
  { key: 'disrespected', label: '唔被尊重', description: '好似被人睇小', color: '#E88F65', category: 'wound', image: EMOTION_IMAGES.disrespected },
  { key: 'invisible', label: '被忽視', description: '好似冇人見到我', color: '#9AA5B2', category: 'wound', image: EMOTION_IMAGES.invisible },
  { key: 'rejected', label: '被拒絕', description: '唔被接納', color: '#EFB278', category: 'wound', image: EMOTION_IMAGES.rejected },
  { key: 'abandoned', label: '被拋棄', description: '感覺被人丟低', color: '#93B9C7', category: 'wound', image: EMOTION_IMAGES.abandoned },
  { key: 'misunderstood', label: '唔被理解', description: '講極都冇人明', color: '#8877B4', category: 'wound', image: EMOTION_IMAGES.misunderstood },
  { key: 'unfair', label: '唔公平', description: '點解會咁對我?', color: '#58768E', category: 'wound', image: EMOTION_IMAGES.unfair },
  { key: 'guilty', label: '內疚', description: '覺得係自己嘅錯', color: '#DCC15E', category: 'wound', image: EMOTION_IMAGES.guilty },
  { key: 'ashamed', label: '羞愧', description: '想搵個窿匿埋', color: '#D48570', category: 'wound', image: EMOTION_IMAGES.ashamed },
  { key: 'awkward', label: '尷尬', description: '有啲下不了台', color: '#9BA8CE', category: 'wound', image: EMOTION_IMAGES.awkward },
  { key: 'hopeless', label: '絕望', description: '睇唔到前面嘅路', color: '#7E8A94', category: 'wound', image: EMOTION_IMAGES.hopeless },
  { key: 'suppressed', label: '被打壓', description: '俾人壓住 · 仲要撐住', color: '#8A7563', category: 'wound', image: EMOTION_IMAGES.suppressed },

  // Anger / intense — reds ordered by intensity
  { key: 'frustrated', label: '沮喪', description: '好似卡住咗', color: '#E4A3A0', category: 'anger', image: EMOTION_IMAGES.frustrated },
  { key: 'angry', label: '嬲', description: '心入面有把火', color: '#F17372', category: 'anger', image: EMOTION_IMAGES.angry },
  { key: 'offended', label: '被冒犯', description: '個心俾人踩咗一腳', color: '#C08360', category: 'anger', image: EMOTION_IMAGES.offended },
  { key: 'furious', label: '激嬲', description: '把火燒到頂', color: '#D34848', category: 'anger', image: EMOTION_IMAGES.furious },
  { key: 'in-pain', label: '痛苦', description: '心 / 身好痛', color: '#B36663', category: 'anger', image: EMOTION_IMAGES['in-pain'] },
  { key: 'in-agony', label: '煎熬', description: '痛得好難捱', color: '#786095', category: 'anger', image: EMOTION_IMAGES['in-agony'] },

  // Unspoken / 講唔出 — fallback when nothing else fits
  { key: 'foggy', label: '濛查查', description: '腦入面一片模糊', color: '#B8C1CE', category: 'unspoken', image: EMOTION_IMAGES.foggy },
  { key: 'questioning', label: '唔知乜感覺', description: '有嘢喺度 · 但講唔出', color: '#E8CE8A', category: 'unspoken', image: EMOTION_IMAGES.questioning },
  { key: 'blank', label: '一片空白', description: '腦入面咩都冇', color: '#CFC9BC', category: 'unspoken', image: EMOTION_IMAGES.blank },
];

export const EMOTION_BY_KEY: Record<string, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {},
);
