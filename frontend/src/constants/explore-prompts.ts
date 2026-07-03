// 探索自己 · gentle life-review prompts for narrative-therapy journaling.

export type ExploreStage = 'childhood' | 'teen' | 'young-adult' | 'adult' | 'reflection';

export type ExplorePrompt = {
  key: string;
  stage: ExploreStage;
  text: string;
  hint?: string;
};

export const STAGE_TITLE: Record<ExploreStage, string> = {
  childhood: '童年 · 0–12 歲',
  teen: '少年 · 13–19 歲',
  'young-adult': '青年 · 20–30 歲',
  adult: '而家嘅你',
  reflection: '深啲嘅反思',
};

export const STAGE_ICON: Record<ExploreStage, string> = {
  childhood: 'sun',
  teen: 'wind',
  'young-adult': 'compass',
  adult: 'user',
  reflection: 'feather',
};

export const STAGE_COLOR: Record<ExploreStage, string> = {
  childhood: '#FFE4B5',
  teen: '#BDE0FE',
  'young-adult': '#D1E2DE',
  adult: '#E0BBE4',
  reflection: '#FFC8DD',
};

export const EXPLORE_PROMPTS: ExplorePrompt[] = [
  // ---- Childhood ----
  { key: 'earliest', stage: 'childhood', text: '你最早記得嘅一個畫面係咩?', hint: '嗰陣時你幾多歲?身邊有邊個?' },
  { key: 'safe-person', stage: 'childhood', text: '細個時,邊個令你感覺最安全?', hint: '寫下一件關於佢嘅小事' },
  { key: 'favourite-thing', stage: 'childhood', text: '細個嘅你,最鍾意做啲乜?' },
  { key: 'sentence-echoes', stage: 'childhood', text: '有冇一句話,到而家仲會時不時響起?', hint: '邊個對你講嘅?當時你點感受?' },
  { key: 'first-school', stage: 'childhood', text: '上小學嘅第一日,你記得啲乜?' },
  { key: 'safe-place', stage: 'childhood', text: '有冇一個地方,你去到就覺得舒服?' },
  { key: 'hard-moment-child', stage: 'childhood', text: '細個時有冇一件事,而家諗返仲會有感覺?', hint: '慢慢寫 · 唔急' },

  // ---- Teen ----
  { key: 'first-friend', stage: 'teen', text: '邊個係你嘅第一個真正嘅好朋友?', hint: '你哋一齊做過啲乜?' },
  { key: 'first-heartbreak', stage: 'teen', text: '你第一次覺得心痛係幾時?' },
  { key: 'who-i-wanted', stage: 'teen', text: '嗰時你最想成為點樣嘅人?' },
  { key: 'teen-decision', stage: 'teen', text: '有冇一件事,你當時決定咗要 / 唔要做?' },
  { key: 'teen-secret', stage: 'teen', text: '嗰時有冇一個秘密,你從來冇同人講?' },

  // ---- Young adult ----
  { key: 'big-choice', stage: 'young-adult', text: '有邊一個決定,而家諗返會做唔同?' },
  { key: 'thankful-to', stage: 'young-adult', text: '你最感激邊個曾經幫過你?', hint: '有冇同佢講過?' },
  { key: 'relationship-mark', stage: 'young-adult', text: '有邊一段關係,影響咗你好深?' },
  { key: 'first-loss', stage: 'young-adult', text: '你經歷過嘅第一次「失去」,係咩?' },

  // ---- Adult / now ----
  { key: 'pattern', stage: 'adult', text: '你有冇發覺自己重複緊某啲反應 / 想法?', hint: '呢啲反應可能係細個學嚟嘅' },
  { key: 'joy-lately', stage: 'adult', text: '最近有邊一刻,你係真心開心過?' },
  { key: 'burden', stage: 'adult', text: '你依家扛住嘅嘢入面,邊樣其實可以放低?' },
  { key: 'boundary', stage: 'adult', text: '有咩事,你想學識講「唔」?' },

  // ---- Reflection / forgiveness ----
  { key: 'letter-inner-child', stage: 'reflection', text: '如果可以話俾細個嘅自己聽,你會講咩?', hint: '寫俾嗰個未被好好對待嘅細路' },
  { key: 'unsent-letter', stage: 'reflection', text: '有邊個,你好想寫封信但一直冇寄?', hint: '寫出嚟,無論最後寄唔寄' },
  { key: 'not-forgiven', stage: 'reflection', text: '有邊一件事,你至今仲原諒唔到自己?', hint: '呢一刻只係寫俾自己睇' },
  { key: 'still-tears', stage: 'reflection', text: '有咩事,你以為放低咗,但諗起仲會眼濕濕?' },
  { key: 'forgive', stage: 'reflection', text: '如果今日可以原諒一個人,你想原諒邊個?', hint: '可能係另一個人 · 可能係自己' },
  { key: 'grateful-past', stage: 'reflection', text: '你想多謝過去嘅自己邊一樣嘢?' },
];

export const PROMPT_BY_KEY: Record<string, ExplorePrompt> = EXPLORE_PROMPTS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {},
);
