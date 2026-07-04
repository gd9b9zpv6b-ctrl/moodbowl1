// 香港註冊心理健康資源 · Hong Kong registered mental-health resources.
// Emergency hotlines are 24/7 unless noted.

export type Hotline = {
  key: string;
  name: string;
  desc: string;
  phone: string;
  hours: string;
  urgent?: boolean;
  languages?: string;
};

export const HOTLINES: Hotline[] = [
  {
    key: 'samaritans',
    name: '撒瑪利亞防止自殺會',
    desc: '24 小時多語防止自殺熱線',
    phone: '28960000',
    hours: '24 小時',
    urgent: true,
    languages: '中 / 英 / 多語',
  },
  {
    key: 'sbhk',
    name: '生命熱線',
    desc: '情緒困擾及自殺危機支援',
    phone: '23820000',
    hours: '24 小時',
    urgent: true,
    languages: '廣東話 / 普通話 / 英',
  },
  {
    key: 'caritas',
    name: '明愛向晴熱線',
    desc: '一站式家庭危機支援',
    phone: '18288',
    hours: '24 小時',
    urgent: true,
  },
  {
    key: 'tungwah',
    name: '東華三院芷若園',
    desc: '危機介入及支援中心',
    phone: '18281',
    hours: '24 小時',
    urgent: true,
  },
  {
    key: 'ha-psych',
    name: '醫院管理局精神健康專線',
    desc: '公立精神科查詢及支援',
    phone: '24667350',
    hours: '24 小時',
  },
  {
    key: 'youth',
    name: '學友社學生熱線',
    desc: '為青少年而設嘅情緒支援',
    phone: '25033399',
    hours: '每日 14:00 – 02:00',
  },
  {
    key: 'openup',
    name: 'Open 噏 (文字傾訴)',
    desc: '24 小時 whatsapp / SMS 文字支援 (11-35 歲)',
    phone: '91012012',
    hours: '24 小時 · 文字',
  },
];

export type Provider = {
  key: string;
  name: string;
  role: string;
  desc: string;
  contact: string; // phone or website
  url?: string;
  fee: string;
};

// Curated professional / verified directories.
// The app links users to established HK professional bodies rather than
// pretending to book real practitioners.
export const PROVIDERS: Provider[] = [
  {
    key: 'mindhk',
    name: 'Mind HK 心理健康資源目錄',
    role: '註冊臨床心理學家名冊 · NGO',
    desc: '免費搜尋香港註冊臨床心理學家及輔導員,並提供低收費服務清單。',
    contact: 'mind.org.hk',
    url: 'https://www.mind.org.hk/zh-hant/',
    fee: '目錄免費 · 個別收費由服務提供者定',
  },
  {
    key: 'hkps',
    name: '香港心理學會 (HKPS)',
    role: '註冊心理學家名冊',
    desc: '查詢認可註冊臨床心理學家,確保專業資格。',
    contact: 'hkps.org.hk',
    url: 'https://www.hkps.org.hk',
    fee: '個別執業收費 HK$800 – 2000 / 節',
  },
  {
    key: 'hkcpsych',
    name: '香港精神科醫學院',
    role: '精神科醫生名冊',
    desc: '如需藥物治療或臨床診斷,可尋找註冊精神科醫生。',
    contact: 'hkcpsych.org.hk',
    url: 'https://www.hkcpsych.org.hk',
    fee: '公立 HK$135 起 · 私家由 HK$1500 起',
  },
  {
    key: 'nlpra',
    name: '新生精神康復會',
    role: 'NGO · 低收費輔導',
    desc: '為精神復元人士及家屬提供社區支援及輔導。',
    contact: 'nlpra.org.hk',
    url: 'https://www.nlpra.org.hk',
    fee: '大部分服務免費 / 低收費',
  },
  {
    key: 'caritas-fs',
    name: '明愛家庭服務',
    role: 'NGO · 家庭輔導',
    desc: '面談輔導、婚姻及家庭問題支援。',
    contact: 'caritas.org.hk',
    url: 'https://family.caritas.org.hk',
    fee: '按經濟情況調節 · 部分免費',
  },
  {
    key: 'ha-clinic',
    name: '醫管局精神科門診 (公立)',
    role: '公立精神科服務',
    desc: '需經家庭醫生或急症室轉介。輪候期較長,但收費親民。',
    contact: '24667350',
    fee: 'HK$135 起 (合資格人士)',
  },
];

export const SAFETY_DISCLAIMER =
  'MoodBowl 唔可以取代專業治療。如果你有即時危險,或者想傷害自己,請即刻打上面嘅緊急熱線,或者到最近嘅急症室。你係值得被幫助嘅。';
