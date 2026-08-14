import type { NSState } from '@/src/lib/ritual/state-detector';
import type { SoupKey } from '@/src/constants/soups';
import type { BodyChipKey, BodyRegionKey } from '@/src/constants/body-chips';
import type { ExperienceMode, MinorAgeBand } from '@/src/lib/experience-mode';
import { experienceModeForRole } from '@/src/lib/experience-mode';

/** Three wording bands for the whole app ritual / self-care copy. */
export type WordingMode = 'lower' | 'upper' | 'adult';

export type WordingPack = {
  soup_title: string;
  soup_sub: string;
  body_title: string;
  /** Clarifies L1 ambiguity · drink can be craving OR state. */
  body_clarify: string;
  /** Body-as-vessel prompt under the chosen drink. */
  body_vessel: string;
  body_hint: string;
  body_cta: string;
  body_skip: string;
  region_labels: Record<BodyRegionKey, string>;
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
  strawberry_milk: '好甜 · 好滿足',
  marble_soda: '想跳跳紮',
  lemon_juice: '有啲委屈',
  spicy_ginger: '熱辣辣 · 有火',
  bitter_tea: '好累 · 想休息',
  warm_milk: '暖暖地 · 好放心',
  plain_water: '平平淡淡',
  no_drink: '而家唔想',
};

const SOUP_SUBS_UPPER: Record<SoupKey, string> = {
  strawberry_milk: '今日有開心嘅事 · 好甜好滿足',
  marble_soda: '好興奮 · 成個人都想郁',
  lemon_juice: '少少煩惱 · 或者有啲唔順',
  spicy_ginger: '心裡面頂住 · 想爆一爆',
  bitter_tea: '心情有啲沉重 · 需要唞一唞',
  warm_milk: '好放鬆 · 覺得安心溫暖',
  plain_water: '冇特別開心亦冇唔開心',
  no_drink: '暫時咩都唔想入口',
};

const SOUP_SUBS_ADULT: Record<SoupKey, string> = {
  strawberry_milk: '滿足 · 想留住呢刻甜甜嘅感覺',
  marble_soda: '能量偏高 · 想輕輕釋放',
  lemon_juice: '有啲刺 · 想消化啲煩惱',
  spicy_ginger: '心裡面頂住 · 想釋放',
  bitter_tea: '疲累 · 想慢慢歇一歇',
  warm_milk: '被安住 · 想溫柔對待自己',
  plain_water: '平淡 · 或者暫時感覺唔多',
  no_drink: '提不起勁 · 想留白',
};

/** P1–P3 · playful somatic metaphors. */
const CHIP_LOWER: Record<BodyChipKey, string> = {
  face_flush: '面紅紅 · 好似蒸籠',
  jaw_clench: '牙咬到咔咔聲',
  teary: '眼酸酸 · 想喊',
  eyelids_heavy: '眼皮掛住水桶',
  eyes_bright: '眼睛發亮',
  head_heavy: '頭好似大石頭',
  brain_blank: '腦入面空空哋',
  chest_warm: '胸口暖暖',
  chest_tight: '胸口像壓住石',
  heart_fast: '心跳像小兔砰砰跳',
  breath_fast: '鼻子呼哧呼哧',
  heat_rising: '熱氣衝上腦門',
  throat_tight: '喉嚨像吞咗小石頭',
  belly_full: '肚仔有蝴蝶亂飛',
  no_appetite: '唔想食嘢',
  need_toilet: '突然好想去廁所',
  fists_clench: '拳頭硬邦邦',
  sweaty_palms: '手心濕漉漉',
  shaky: '手腳震震',
  soft_hands: '手軟軟 · 冇力',
  shoulders_heavy: '膊頭好重',
  body_tense: '成身繃緊緊',
  want_jump: '腳仔想跳跳紮',
  smile_wide: '嘴角忍唔住笑',
  curled_up: '想縮埋一團',
  floaty: '輕飄飄',
};

/** P4–P6 · grounded somatic language. */
const CHIP_UPPER: Record<BodyChipKey, string> = {
  face_flush: '面紅／臉頰發熱',
  jaw_clench: '牙關咬緊',
  teary: '眼眶發熱 · 鼻酸',
  eyelids_heavy: '眼皮好重 · 睜唔開',
  eyes_bright: '精神特別好',
  head_heavy: '頭部沉重',
  brain_blank: '腦袋一片空白',
  chest_warm: '胸口溫暖',
  chest_tight: '胸口悶悶重重',
  heart_fast: '心跳得好快',
  breath_fast: '呼吸變急',
  heat_rising: '熱氣由胸口衝上腦',
  throat_tight: '喉嚨哽住 · 講唔出',
  belly_full: '胃部緊縮 · 咕嚕翻滾',
  no_appetite: '冇胃口',
  need_toilet: '突然想去廁所',
  fists_clench: '拳頭不自覺捏緊',
  sweaty_palms: '手心出汗',
  shaky: '手指或腳微震',
  soft_hands: '手軟 · 提唔起勁',
  shoulders_heavy: '膊頭痠 · 像背重書包',
  body_tense: '肌肉繃緊 · 像拉滿弓',
  want_jump: '坐立不安 · 好想郁',
  smile_wide: '說話變快 · 想分享',
  curled_up: '想收起自己',
  floaty: '動作變慢 · 有啲飄',
};

/** Adult · clinical-adjacent but warm. */
const CHIP_ADULT: Record<BodyChipKey, string> = {
  face_flush: '面頰發熱',
  jaw_clench: '牙關咬緊',
  teary: '眼泛淚光',
  eyelids_heavy: '眼皮沉重',
  eyes_bright: '眼睛有光',
  head_heavy: '頭部沉重',
  brain_blank: '腦袋空白 · 運轉慢',
  chest_warm: '胸口溫暖',
  chest_tight: '胸口擠逼',
  heart_fast: '心跳加快',
  breath_fast: '呼吸急促',
  heat_rising: '熱氣上湧',
  throat_tight: '喉嚨收緊',
  belly_full: '腹部緊張／翻滾',
  no_appetite: '食欲下降',
  need_toilet: '突然想去洗手間',
  fists_clench: '拳頭捏緊',
  sweaty_palms: '手心出汗',
  shaky: '手腳微震',
  soft_hands: '手腳乏力',
  shoulders_heavy: '肩頸緊繃',
  body_tense: '全身繃緊',
  want_jump: '想郁動釋放',
  smile_wide: '嘴角上揚 · 想講',
  curled_up: '想收起自己',
  floaty: '有啲抽離／飄',
};

const REGION_LOWER: Record<BodyRegionKey, string> = {
  head: '碗頭',
  chest: '胸口',
  belly: '肚仔',
  hands: '小手',
  whole: '雙腳',
};

const REGION_UPPER: Record<BodyRegionKey, string> = {
  head: '碗頭',
  chest: '胸口',
  belly: '肚',
  hands: '手',
  whole: '雙腳',
};

const REGION_ADULT: Record<BodyRegionKey, string> = {
  head: '頭',
  chest: '胸口',
  belly: '腹',
  hands: '手',
  whole: '腳',
};

export const WORDING: Record<WordingMode, WordingPack> = {
  lower: {
    soup_title: '今日想飲咩?',
    soup_sub: '揀一種最似而家感覺嘅 · 唔係問你想慰勞自己',
    body_title: '戳戳碗仔 · 邊度喺度嘈?',
    body_clarify: '碗仔係你嘅身體地圖 · 撳吓邊度有感覺',
    body_vessel: '由米堆戳到腳趾 · 最多揀 3 樣最嘈嘅',
    body_hint: '最多揀 3 樣 · 唔好塞爆碗仔!',
    body_cta: '準備見碗 →',
    body_skip: '略過 →',
    region_labels: REGION_LOWER,
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
    soup_title: '今日嘅狀態岩飲邊樣飲品?',
    soup_sub: '揀最似而家感覺嘅 · 可以係想安慰自己嘅味道 · 下一步會對齊身體',
    body_title: '戳戳碗仔 · 身體掃描',
    body_clarify: '想飲甜唔等於開心 · 戳碗仔睇真相',
    body_vessel: '撳碗仔部位 · 睇吓浮起咩感覺',
    body_hint: '揀 3 樣就夠 · 碗滿啦!',
    body_cta: '準備見碗 →',
    body_skip: '暫時略過 →',
    region_labels: REGION_UPPER,
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
    soup_title: '而家呢刻 · 你比較似邊種飲品?',
    soup_sub: '用飲品做隱喻 · 可以係狀態 · 亦可以係想慰藉自己嘅味道',
    body_title: '戳戳碗仔 · 身體覺察',
    body_clarify: '想飲甜可以係開心 · 亦可以係想被安慰 · 身體幫你分清楚',
    body_vessel: '撳碗仔部位 · 睇吓浮起嘅感覺',
    body_hint: '唔使完美 · 揀而家最明顯嘅',
    body_cta: '下一步 · 睇碗 →',
    body_skip: '略過身體感覺 →',
    region_labels: REGION_ADULT,
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
    selfcare_subtitle: '開自己嘅 check-in · 畀自己幾分鐘',
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
