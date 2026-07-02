export type Emotion = {
  key: string;
  label: string;
  description: string;
  color: string;
  image: any;
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
};

export const EMOTIONS: Emotion[] = [
  { key: 'happy', label: '開心', description: '覺得輕鬆又快樂', color: '#D6E5D8', image: EMOTION_IMAGES.happy },
  { key: 'content', label: '滿足', description: '心入面有種靜靜嘅滿足', color: '#C8E6C9', image: EMOTION_IMAGES.content },
  { key: 'grateful', label: '感恩', description: '今日有啲嘢想感激', color: '#FFC8DD', image: EMOTION_IMAGES.grateful },
  { key: 'hopeful', label: '有希望', description: '前面好似有一絲光', color: '#E0EAFC', image: EMOTION_IMAGES.hopeful },
  { key: 'calm', label: '平靜', description: '溫柔而安定', color: '#A3C4BC', image: EMOTION_IMAGES.calm },
  { key: 'peaceful', label: '安寧', description: '所有嘢都冇事咁', color: '#CDB4DB', image: EMOTION_IMAGES.peaceful },
  { key: 'loved', label: '被愛', description: '感覺被關心緊', color: '#FFB6C1', image: EMOTION_IMAGES.loved },
  { key: 'proud', label: '自豪', description: '我做咗啲好嘢', color: '#FFF3B0', image: EMOTION_IMAGES.proud },
  { key: 'sad', label: '傷心', description: '心入面有種柔和嘅沉重', color: '#A2D2FF', image: EMOTION_IMAGES.sad },
  { key: 'lonely', label: '寂寞', description: '好想有人喺身邊', color: '#BDE0FE', image: EMOTION_IMAGES.lonely },
  { key: 'empty', label: '空虛', description: '而家好似乜都感受唔到', color: '#F0EFEB', image: EMOTION_IMAGES.empty },
  { key: 'numb', label: '麻木', description: '同自己有距離', color: '#D3D3D3', image: EMOTION_IMAGES.numb },
  { key: 'exhausted', label: '好攰', description: '身心都攰晒', color: '#E0BBE4', image: EMOTION_IMAGES.exhausted },
  { key: 'restless', label: '心煩', description: '坐唔定 靜唔到', color: '#FFDEAD', image: EMOTION_IMAGES.restless },
  { key: 'anxious', label: '焦慮', description: '好似有啲嘢唔妥', color: '#FFD6A5', image: EMOTION_IMAGES.anxious },
  { key: 'worried', label: '擔心', description: '諗嘢停唔到', color: '#FFE4B5', image: EMOTION_IMAGES.worried },
  { key: 'overwhelmed', label: '透唔到氣', description: '好多嘢一齊嚟', color: '#E8A598', image: EMOTION_IMAGES.overwhelmed },
  { key: 'insecure', label: '冇自信', description: '覺得自己唔夠好', color: '#E0BBE4', image: EMOTION_IMAGES.insecure },
  { key: 'frustrated', label: '沮喪', description: '好似卡住咗', color: '#F4D0C9', image: EMOTION_IMAGES.frustrated },
  { key: 'angry', label: '嬲', description: '心入面有把火', color: '#FFAAA5', image: EMOTION_IMAGES.angry },
];

export const EMOTION_BY_KEY: Record<string, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {},
);
