export type Emotion = {
  key: string;
  label: string;
  description: string;
  color: string;
  image?: any; // PNG mascot (preferred when available)
  icon?: string; // Feather icon fallback while the mascot is being generated
};

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
  worried: require('../../assets/emotions/worried.png'),
  overwhelmed: require('../../assets/emotions/overwhelmed.png'),
  insecure: require('../../assets/emotions/insecure.png'),
  frustrated: require('../../assets/emotions/frustrated.png'),
  angry: require('../../assets/emotions/angry.png'),
  irritable: require('../../assets/emotions/irritable.png'),
  trapped: require('../../assets/emotions/trapped.png'),
  unfair: require('../../assets/emotions/unfair.png'),
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
  furious: require('../../assets/emotions/furious.png'),
  'in-pain': require('../../assets/emotions/in-pain.png'),
  'in-agony': require('../../assets/emotions/in-agony.png'),
};

export const EMOTIONS: Emotion[] = [
  // Warm / positive
  { key: 'happy', label: '開心', description: '覺得輕鬆又快樂', color: '#D6E5D8', image: EMOTION_IMAGES.happy },
  { key: 'content', label: '滿足', description: '心入面有種靜靜嘅滿足', color: '#C8E6C9', image: EMOTION_IMAGES.content },
  { key: 'grateful', label: '感恩', description: '今日有啲嘢想感激', color: '#FFC8DD', image: EMOTION_IMAGES.grateful },
  { key: 'hopeful', label: '有希望', description: '前面好似有一絲光', color: '#E0EAFC', image: EMOTION_IMAGES.hopeful },
  { key: 'calm', label: '平靜', description: '溫柔而安定', color: '#A3C4BC', image: EMOTION_IMAGES.calm },
  { key: 'peaceful', label: '安寧', description: '所有嘢都冇事咁', color: '#CDB4DB', image: EMOTION_IMAGES.peaceful },
  { key: 'loved', label: '被愛', description: '感覺被關心緊', color: '#FFB6C1', image: EMOTION_IMAGES.loved },
  { key: 'proud', label: '自豪', description: '我做咗啲好嘢', color: '#FFF3B0', image: EMOTION_IMAGES.proud },

  // Common sadness / low energy
  { key: 'sad', label: '傷心', description: '心入面有種柔和嘅沉重', color: '#A2D2FF', image: EMOTION_IMAGES.sad },
  { key: 'lonely', label: '寂寞', description: '好想有人喺身邊', color: '#BDE0FE', image: EMOTION_IMAGES.lonely },
  { key: 'empty', label: '空虛', description: '而家好似乜都感受唔到', color: '#F0EFEB', image: EMOTION_IMAGES.empty },
  { key: 'numb', label: '麻木', description: '同自己有距離', color: '#D3D3D3', image: EMOTION_IMAGES.numb },
  { key: 'exhausted', label: '好攰', description: '身心都攰晒', color: '#E0BBE4', image: EMOTION_IMAGES.exhausted },

  // Nervous / tense
  { key: 'restless', label: '不知所措', description: '唔知點算好', color: '#FFF3B0', image: EMOTION_IMAGES.restless },
  { key: 'irritable', label: '煩躁', description: '個火開始上湧', color: '#FFB088', image: EMOTION_IMAGES.irritable },
  { key: 'anxious', label: '焦慮', description: '好似有啲嘢唔妥', color: '#FFD6A5', image: EMOTION_IMAGES.anxious },
  { key: 'worried', label: '擔心', description: '諗嘢停唔到', color: '#FFE4B5', image: EMOTION_IMAGES.worried },
  { key: 'overwhelmed', label: '透唔到氣', description: '好多嘢一齊嚟', color: '#E8A598', image: EMOTION_IMAGES.overwhelmed },
  { key: 'trapped', label: '被困', description: '好似逃唔到出去', color: '#7FB3C8', image: EMOTION_IMAGES.trapped },

  // Self-worth wounds  ⚠ often central for depression
  { key: 'worthless', label: '冇價值', description: '覺得自己毫無價值', color: '#C7CEEA', image: EMOTION_IMAGES.worthless },
  { key: 'insecure', label: '冇自信', description: '覺得自己唔夠好', color: '#E0BBE4', image: EMOTION_IMAGES.insecure },
  { key: 'unloved', label: '唔被愛', description: '冇人真心錫我', color: '#F5B7B1', image: EMOTION_IMAGES.unloved },
  { key: 'unappreciated', label: '唔被欣賞', description: '做咗好多都冇人睇到', color: '#D5AAFF', image: EMOTION_IMAGES.unappreciated },
  { key: 'disrespected', label: '唔被尊重', description: '好似被人睇小', color: '#FFAB91', image: EMOTION_IMAGES.disrespected },
  { key: 'invisible', label: '被忽視', description: '好似冇人見到我', color: '#B5B9C4', image: EMOTION_IMAGES.invisible },
  { key: 'rejected', label: '被拒絕', description: '唔被接納', color: '#F5CBA7', image: EMOTION_IMAGES.rejected },
  { key: 'abandoned', label: '被拋棄', description: '感覺被人丟低', color: '#AED9E0', image: EMOTION_IMAGES.abandoned },
  { key: 'misunderstood', label: '唔被理解', description: '講極都冇人明', color: '#B39DDB', image: EMOTION_IMAGES.misunderstood },
  { key: 'unfair', label: '唔公平', description: '點解會咁對我?', color: '#8FA7BF', image: EMOTION_IMAGES.unfair },
  { key: 'guilty', label: '內疚', description: '覺得係自己嘅錯', color: '#F9E79F', image: EMOTION_IMAGES.guilty },
  { key: 'ashamed', label: '羞愧', description: '想搵個窿匿埋', color: '#F0B7A4', image: EMOTION_IMAGES.ashamed },
  { key: 'hopeless', label: '絕望', description: '睇唔到前面嘅路', color: '#B0BEC5', image: EMOTION_IMAGES.hopeless },

  // Anger / intense
  { key: 'frustrated', label: '沮喪', description: '好似卡住咗', color: '#F4D0C9', image: EMOTION_IMAGES.frustrated },
  { key: 'angry', label: '嬲', description: '心入面有把火', color: '#FFAAA5', image: EMOTION_IMAGES.angry },
  { key: 'furious', label: '激嬲', description: '把火燒到頂', color: '#FF8A80', image: EMOTION_IMAGES.furious },
  { key: 'in-pain', label: '痛苦', description: '心 / 身好痛', color: '#F0918B', image: EMOTION_IMAGES['in-pain'] },
  { key: 'in-agony', label: '煎熬', description: '痛得好難捱', color: '#9D8DB8', image: EMOTION_IMAGES['in-agony'] },
];

export const EMOTION_BY_KEY: Record<string, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {},
);
