import type { NSState } from '@/src/lib/ritual/state-detector';
import type { SoupKey } from '@/src/constants/soups';
import type { BodyChipKey } from '@/src/constants/body-chips';
import type { ExperienceMode, MinorAgeBand } from '@/src/lib/experience-mode';
import { experienceModeForRole } from '@/src/lib/experience-mode';

/** Three wording bands for the whole app ritual / self-care copy. */
export type WordingMode = 'lower' | 'upper' | 'adult';

export type WordingPack = {
  soup_title: string;
  soup_sub: string;
  body_title: string;
  body_hint: string;
  body_cta: string;
  body_skip: string;
  pick_title: string;
  pick_expand: string;
  pick_collapse: string;
  pick_see_all: string;
  customize_title: (bowlLabel: string) => string;
  customize_next: string;
  talk_title: (bowlLabel: string) => string;
  talk_speech: string;
  talk_placeholder: string;
  talk_submit: string;
  talk_hug: string;
  regulate_skip: string;
  bridge_share_class: string;
  bridge_share_family: string;
  bridge_share_timeline: string;
  bridge_complete: string;
  home_ritual_cta: string;
  home_ritual_prompt: string;
  home_ritual_hint: string;
  home_quick_diary: string;
  home_album: string;
  selfcare_title: string;
  selfcare_subtitle: string;
  bridge_by_state: Record<NSState, string>;
  regulate_by_state: Record<NSState, string>;
  soup_subs: Record<SoupKey, string>;
  chip_labels: Record<BodyChipKey, string>;
};

const SOUP_SUBS_LOWER: Record<SoupKey, string> = {
  hot_milk_tea: '舒服 warm warm',
  cold_lemon_tea: '淡淡地',
  curry: '熱辣辣 有火',
  plain_congee: '冇特別',
  sweet_soup: '好想食甜嘢',
  no_appetite: '冇胃口',
};

const SOUP_SUBS_UPPER: Record<SoupKey, string> = {
  hot_milk_tea: '想 hug 一下嗰種暖暖地',
  cold_lemon_tea: '心裡面有啲距離感',
  curry: '有嘢頂住 · 想爆',
  plain_congee: '空落落嘅感覺',
  sweet_soup: '想 celebrate 啲嘢',
  no_appetite: '吞唔落嘅感覺',
};

const SOUP_SUBS_ADULT: Record<SoupKey, string> = {
  hot_milk_tea: '想被溫柔包住一下',
  cold_lemon_tea: '有啲抽離 · 想留位俾自己',
  curry: '心裡面頂住 · 想釋放',
  plain_congee: '平淡 · 或者有啲空',
  sweet_soup: '想慶祝 · 想留住呢刻',
  no_appetite: '提不起勁 · 吞唔落',
};

const CHIP_LOWER: Record<BodyChipKey, string> = {
  chest_warm: '胸口暖暖',
  chest_tight: '胸口悶悶',
  heart_fast: '心跳好快',
  belly_full: '肚仔嘟嘟',
  head_heavy: '頭重重',
  want_jump: '好想跳',
  curled_up: '縮埋一團',
  teary: '眼濕濕',
  soft_hands: '手軟軟',
  floaty: '輕飄飄',
};

const CHIP_UPPER: Record<BodyChipKey, string> = {
  chest_warm: '胸口暖暖',
  chest_tight: '胸口悶悶',
  heart_fast: '心跳好快',
  belly_full: '肚有感覺',
  head_heavy: '頭重重',
  want_jump: '身體想郁',
  curled_up: '想縮埋',
  teary: '眼濕濕',
  soft_hands: '手軟軟',
  floaty: '輕飄飄',
};

const CHIP_ADULT: Record<BodyChipKey, string> = {
  chest_warm: '胸口溫暖',
  chest_tight: '胸口擠逼',
  heart_fast: '心跳加快',
  belly_full: '腹部緊張',
  head_heavy: '頭部沉重',
  want_jump: '想郁動釋放',
  curled_up: '想收起自己',
  teary: '眼泛淚光',
  soft_hands: '手腳乏力',
  floaty: '有啲飄',
};

export const WORDING: Record<WordingMode, WordingPack> = {
  lower: {
    soup_title: '你今日想飲咩湯?',
    soup_sub: '慢慢揀 · 冇錯答案',
    body_title: '碗身體邊度有 feel?',
    body_hint: '最多揀 3 樣',
    body_cta: '準備見碗 →',
    body_skip: 'Skip →',
    pick_title: '你今日似邊個? 揀一個',
    pick_expand: '唔啱心水? 睇多啲',
    pick_collapse: '收埋',
    pick_see_all: '睇全部碗',
    customize_title: (bowl) => `幫 ${bowl} 打扮一下`,
    customize_next: '下一步 · 同碗傾偈 →',
    talk_title: (bowl) => `${bowl} 想知你今日發生咩事`,
    talk_speech: '我聽緊 · 慢慢講',
    talk_placeholder: '打幾隻字都得',
    talk_submit: '寫完啦 · 餵佢食',
    talk_hug: '今日靜靜哋 · 得個抱',
    regulate_skip: '唔洗 · 我 OK',
    bridge_share_class: '想同人講 · 派俾同學',
    bridge_share_family: '派俾家人',
    bridge_share_timeline: '留返俾自己睇',
    bridge_complete: '完成啦 · 搞掂',
    home_ritual_cta: '同碗打招呼 · 3 分鐘',
    home_ritual_prompt: '今日想同碗打招呼嗎',
    home_ritual_hint: '慢慢嚟 · 三個步驟 · 呢度係你嘅小天地',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '你都值得記錄自己嘅心情',
    selfcare_subtitle: '撳我開始同自己坐一坐',
    bridge_by_state: {
      sympathetic_fire: '返返靜咗未呀? 想搵人講嗎?',
      dorsal_sad: '感覺舒服返啲未? 想搵朋友嗎?',
      sympathetic_anxious: '心跳慢返未? 有人陪一陣?',
      dorsal_freeze: '有 feel 番嗎? 講一句話都得',
      ventral_regulated: '想同人 share 嗎?',
      unspoken: '留返俾自己都得',
    },
    regulate_by_state: {
      sympathetic_fire: '看落你有啲熱辣辣 · 試下呢啲?',
      dorsal_sad: '看落你有啲重 · 試下呢啲?',
      sympathetic_anxious: '看落心跳有啲快 · 試下呢啲?',
      dorsal_freeze: '看落有啲空空哋 · 試下呢啲?',
      ventral_regulated: '看落你覺得幾靚 · 想多留一陣?',
      unspoken: '想同碗坐一坐 · 試下呢啲?',
    },
    soup_subs: SOUP_SUBS_LOWER,
    chip_labels: CHIP_LOWER,
  },
  upper: {
    soup_title: '你今日想飲邊碗湯?',
    soup_sub: '慢慢揀 · 冇錯答案',
    body_title: '望下你嘅身體 · 邊度有 feel? 揀最多 3 樣',
    body_hint: '揀 3 樣就夠啦',
    body_cta: '準備見碗 →',
    body_skip: 'Skip →',
    pick_title: '你今日似邊個? 揀一個',
    pick_expand: '唔啱心水? 睇多啲 (12)',
    pick_collapse: '收埋',
    pick_see_all: '冇一個 fit? 睇全部',
    customize_title: (bowl) => `幫 ${bowl} 打扮一下`,
    customize_next: '下一步 · 同碗傾偈 →',
    talk_title: (bowl) => `${bowl} 想知你今日發生咩事 · 講俾佢聽`,
    talk_speech: '我聽緊 · 慢慢講',
    talk_placeholder: '一個字都得 · 或者好長都 ok',
    talk_submit: '寫完啦 · 餵佢食',
    talk_hug: '今日靜靜哋 · 得個抱',
    regulate_skip: '唔洗 · 我 OK',
    bridge_share_class: '想同人講嘢 · 派俾我班同學',
    bridge_share_family: '派俾家人（如果連咗）',
    bridge_share_timeline: '留返俾我自己 timeline',
    bridge_complete: '完成啦 · 搞掂',
    home_ritual_cta: '同碗打招呼 · 3 分鐘',
    home_ritual_prompt: '今日想同碗打招呼嗎',
    home_ritual_hint: '慢慢嚟 · 三個步驟 · 呢度係你嘅小天地',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '你都值得記錄自己嘅心情',
    selfcare_subtitle: '撳我開始同自己坐一坐',
    bridge_by_state: {
      sympathetic_fire: '而家平靜返啲啦嘛? 想同人講咩發生咗咩事嗎?',
      dorsal_sad: '而家 feel 冇咁重嗎? 想搵個朋友唞唞氣嗎?',
      sympathetic_anxious: '而家心跳慢返嗎? 如果想有人陪住 · 想搵邊個?',
      dorsal_freeze: '而家有啲返到自己嗎? 如果想同人講一句話 · 都得',
      ventral_regulated: '今日呢種靚感覺 · 想派俾人一齊分享嗎?',
      unspoken: '今日呢件事 · 留返俾自己都完全 OK',
    },
    regulate_by_state: {
      sympathetic_fire: '看落你有啲熱辣辣 · 試下呢啲?',
      dorsal_sad: '看落你有啲重 · 試下呢啲?',
      sympathetic_anxious: '看落心跳有啲快 · 試下呢啲?',
      dorsal_freeze: '看落有啲空空哋 · 試下呢啲?',
      ventral_regulated: '看落你覺得幾靚 · 想多留一陣?',
      unspoken: '想同碗坐一坐 · 試下呢啲?',
    },
    soup_subs: SOUP_SUBS_UPPER,
    chip_labels: CHIP_UPPER,
  },
  adult: {
    soup_title: '而家呢刻 · 你比較似邊種狀態?',
    soup_sub: '用食物做隱喻 · 幫自己對齊感覺',
    body_title: '身體邊度有訊號? 最多揀 3 樣',
    body_hint: '唔使完美 · 揀而家最明顯嘅',
    body_cta: '下一步 · 睇碗 →',
    body_skip: '略過身體感覺 →',
    pick_title: '邊個碗最贴近你而家?',
    pick_expand: '想睇多啲選擇',
    pick_collapse: '收起',
    pick_see_all: '睇完整圖鑑',
    customize_title: (bowl) => `為「${bowl}」調校色同大細`,
    customize_next: '下一步 · 寫低今日',
    talk_title: (bowl) => `同「${bowl}」講今日發生咩事`,
    talk_speech: '我喺度 · 你可以慢慢寫',
    talk_placeholder: '寫幾句都得 · 亦可以淨係留白',
    talk_submit: '寫好 · 繼續',
    talk_hug: '今日只想靜一靜 · 唔寫字',
    regulate_skip: '暫時唔使 · 我 OK',
    bridge_share_class: '分享俾同事／同學圈（可選）',
    bridge_share_family: '分享俾家人（可選）',
    bridge_share_timeline: '留喺自己 timeline',
    bridge_complete: '完成打卡',
    home_ritual_cta: '同自己 check-in · 約 3 分鐘',
    home_ritual_prompt: '今日想為自己留幾分鐘嗎',
    home_ritual_hint: '溫柔對齊 · 唔急 · 呢度係你嘅空間',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '照顧學生之前 · 都要照顧自己',
    selfcare_subtitle: '開自己嘅 check-in · 用成人用詞模式',
    bridge_by_state: {
      sympathetic_fire: '平靜返少少未? 如果想講 · 可以揀分享對象',
      dorsal_sad: '重量輕咗啲未? 需要陪一陪都完全 OK',
      sympathetic_anxious: '節奏慢返未? 想有人陪可以輕輕分享',
      dorsal_freeze: '有返啲感覺未? 一句話都夠',
      ventral_regulated: '呢種狀態想唔想輕輕分享出去?',
      unspoken: '今日可以淨係留俾自己',
    },
    regulate_by_state: {
      sympathetic_fire: '身體有啲被点燃 · 可以試呢啲調節',
      dorsal_sad: '能量偏低 · 可以試呢啲輕輕托住自己',
      sympathetic_anxious: '節奏偏快 · 可以試呢啲 grounding',
      dorsal_freeze: '有啲抽離 · 可以試輕輕激活感官',
      ventral_regulated: '狀態幾穩 · 想唔想多留一陣?',
      unspoken: '想同自己坐一坐 · 可以試呢啲',
    },
    soup_subs: SOUP_SUBS_ADULT,
    chip_labels: CHIP_ADULT,
  },
};

export function resolveWordingMode(input: {
  role?: string | null;
  minorBand?: MinorAgeBand | null;
}): WordingMode {
  const experience: ExperienceMode = experienceModeForRole(input.role);
  if (experience === 'adult') return 'adult';
  return input.minorBand === 'lower' ? 'lower' : 'upper';
}

export function wordingFor(mode: WordingMode): WordingPack {
  return WORDING[mode];
}

export function wordingModeLabel(mode: WordingMode): string {
  switch (mode) {
    case 'lower':
      return 'Minor · P1–P3';
    case 'upper':
      return 'Minor · P4–P6';
    case 'adult':
      return 'Adult · 大人用詞';
  }
}
