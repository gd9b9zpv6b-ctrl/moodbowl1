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
  /** After picking a food · shown during the offer animation. */
  soup_offer_done: (foodLabel: string) => string;
  soup_offer_skip: string;
  body_title: string;
  /** Clarifies L1 ambiguity · food can be craving OR state. */
  body_clarify: string;
  /** Body-as-vessel prompt under the chosen food. */
  body_vessel: string;
  body_hint: string;
  body_cta: string;
  body_skip: string;
  region_labels: Record<BodyRegionKey, string>;
  pick_title: string;
  pick_expand: string;
  pick_collapse: string;
  pick_see_all: string;
  /** Skip the discovery game and tap a scored bowl. */
  pick_direct: string;
  /** Switch back from the scored grid to the discovery game. */
  pick_play: string;
  customize_got_bowl: (bowlLabel: string) => string;
  customize_title: (bowlLabel: string) => string;
  customize_sub: string;
  customize_next: string;
  customize_skip: string;
  release_title: (bowlLabel: string) => string;
  release_sub: string;
  release_actions: Record<
    import('@/src/constants/bowl-release').BowlReleaseKey,
    { label: string; hint: string }
  >;
  /** When no bowl was picked (直接寫日記) · dispose-the-diary framing. */
  release_diary_title: string;
  release_diary_sub: string;
  release_diary_actions: Record<
    import('@/src/constants/bowl-release').BowlReleaseKey,
    { label: string; hint: string }
  >;
  /** Short caption under the release action animation. */
  release_anim_captions: Record<
    import('@/src/constants/bowl-release').BowlReleaseKey,
    string
  >;
  release_diary_anim_captions: Record<
    import('@/src/constants/bowl-release').BowlReleaseKey,
    string
  >;
  release_finish: string;
  release_regulate: string;
  release_share_heading: string;
  release_done_title: string;
  release_done_sub: (minutes: number) => string;
  /** Praise when the user wrote diary text this session. */
  release_wrote_praise: string;
  release_smile_hint: string;
  release_smile_hold: string;
  release_smile_done: string;
  release_home: string;
  talk_got_bowl: (bowlLabel: string) => string;
  talk_title: (bowlLabel: string) => string;
  talk_speech: string;
  talk_placeholder: string;
  talk_submit: string;
  talk_hug: string;
  /** 直接寫日記 · no bowl picked yet. */
  talk_solo_title: string;
  talk_solo_speech: string;
  talk_solo_submit: string;
  talk_solo_hug: string;
  customize_solo_got: string;
  customize_solo_title: string;
  customize_solo_sub: string;
  customize_place_hint: (decorLabel: string) => string;
  customize_place_hint_solo: (decorLabel: string) => string;
  customize_idle_hint: string;
  customize_idle_hint_solo: string;
  /** Continue from standalone quick diary into release. */
  quick_diary_continue: string;
  regulate_skip: string;
  /** Eyebrow / step label on regulate screen. */
  regulate_eyebrow: string;
  /** Why we are accompanying · per nervous-system state. */
  regulate_sub_by_state: Record<NSState, string>;
  /** Hint above activity list · age-banded. */
  regulate_pick_hint: (feel: string) => string;
  regulate_next: string;
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
  /** Label above the bridge question. */
  bridge_eyebrow: string;
  bridge_by_state: Record<NSState, string>;
  /** Lead line before symbolic dispose · also state-toned. */
  release_lead_by_state: Record<NSState, string>;
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
  eyelids_heavy: '眼皮好重 · 想瞓',
  eyes_bright: '眼睛發亮 · 閃閃',
  head_heavy: '頭好似大石頭',
  brain_blank: '腦入面空空哋',
  chest_warm: '胸口暖暖 · 有星',
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
  soft_hands: '手軟軟 · 似拉麵',
  shoulders_heavy: '膊頭好重 · 像背書包',
  body_tense: '成身繃緊 · 像拉弓',
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
    soup_title: '請碗星靈食啲嘢?',
    soup_sub: '揀一樣請佢 · 慢慢揀就得',
    soup_offer_done: (food) => `請咗「${food}」俾碗星靈 · 佢好開心`,
    soup_offer_skip: '碗星靈明白 · 今日唔使食',
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
    pick_direct: '唔想玩 · 直接揀',
    pick_play: '用小遊戲搵碗',
    talk_got_bowl: (bowl) => `你今日嘅碗係「${bowl}」`,
    talk_title: (bowl) => `同 ${bowl} 講吓今日發生咩事`,
    talk_speech: '我聽緊 · 慢慢講',
    talk_placeholder: '打幾隻字都得',
    talk_submit: '寫好 · 去打扮碗 →',
    talk_hug: '今日靜靜哋 · 得個抱 · 去打扮',
    talk_solo_title: '想寫吓今日發生咩事?',
    talk_solo_speech: '我聽緊 · 慢慢寫 · 一個字都得',
    talk_solo_submit: '寫好 · 繼續 →',
    talk_solo_hug: '今日靜靜哋 · 得個抱 · 繼續',
    quick_diary_continue: '寫好 · 繼續 →',
    customize_got_bowl: (bowl) => `寫完啦 · 呢個就係你嘅「${bowl}」`,
    customize_title: (bowl) => `幫 ${bowl} 打扮一下`,
    customize_sub: '先揀飾品 · 再撳碗上想放嘅位置 · 唔想可以跳過',
    customize_solo_got: '寫完啦 · 想加啲裝飾嗎?',
    customize_solo_title: '幫今日嘅日記打扮一下',
    customize_solo_sub: '先揀飾品 · 再撳上面想放嘅位置 · 唔想可以跳過',
    customize_place_hint: (d) => `撳碗上面 · 放「${d}」`,
    customize_place_hint_solo: (d) => `撳上面 · 放「${d}」`,
    customize_idle_hint: '先揀一件飾品 · 再撳碗上想放嘅位置',
    customize_idle_hint_solo: '先揀一件飾品 · 再撳想放嘅位置',
    customize_next: '打扮好 · 去陪碗 →',
    customize_skip: '唔打扮 · 去陪碗 →',
    release_title: (bowl) => `想點處理「${bowl}」?`,
    release_sub: '用一個小動作 · 同今日嘅感覺道別或者抱一抱',
    release_actions: {
      empty: { label: '埋入泥土', hint: '摺好呢頁 · 會長成一棵小樹苗' },
      set_aside: { label: '放入書枱', hint: '打開櫃桶收埋 · 遲啲再諗' },
      send_away: { label: '摺成紙飛機', hint: '向住海島飛到唔見' },
      wash: { label: '洗乾淨', hint: '沖一沖 · 整返清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '合上再鎖 · 只有你睇到' },
    },
    release_diary_title: '想點處置今日呢份日記?',
    release_diary_sub: '用一個小動作 · 同呢頁日記道別或者留低',
    release_diary_actions: {
      empty: { label: '埋入泥土', hint: '將呢頁摺好埋低 · 會長成樹苗' },
      set_aside: { label: '放入書枱', hint: '放入櫃桶 · 遲啲再決定都得' },
      send_away: { label: '摺成紙飛機', hint: '向住海島飛走 · 輕輕放手' },
      wash: { label: '抹乾淨', hint: '抹走殘留 · 整返清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '只有你解鎖先睇到' },
    },
    release_anim_captions: {
      empty: '摺好 · 埋入泥土……',
      set_aside: '放入櫃桶……',
      send_away: '摺成紙飛機 · 飛走……',
      wash: '沖一沖 · 清爽……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_diary_anim_captions: {
      empty: '將呢頁埋入泥土……',
      set_aside: '放入書枱櫃桶……',
      send_away: '紙飛機飛走……',
      wash: '抹乾淨……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_finish: '搞掂 · 儲存',
    release_regulate: '陪碗做啲嘢',
    release_share_heading: '想唔想有人留意吓你?',
    release_done_title: '你搞掂啦',
    release_done_sub: (m) => `你今日肯坐低同自己相處咗 ${m} 分鐘 · 好厲害 · 好棒`,
    release_wrote_praise: '你今日肯寫日記 · 呢件事本身好勇敢 · 好棒',
    release_smile_hint: '對住自己笑一笑 · 2 秒（可選）',
    release_smile_hold: '撳住 2 秒',
    release_smile_done: '多謝你嘅笑',
    release_home: '回主頁',
    regulate_skip: '唔洗 · 我 OK',
    regulate_eyebrow: '陪碗做啲嘢',
    regulate_sub_by_state: {
      sympathetic_fire: '你好似有啲熱辣辣 · 嚟！一齊用力出氣',
      dorsal_sad: '你好似有啲唔開心 · 一齊睇吓得意畫面',
      sympathetic_anxious: '心跳有啲快 · 碗慢慢陪你唞',
      dorsal_freeze: '有啲空空哋 · 輕輕郁吓就得',
      ventral_regulated: '今日好靚 · 記低三樣開心嘢',
      unspoken: '唔知講咩都 OK · 坐一陣先',
    },
    regulate_pick_hint: (feel) => `因為你而家「${feel}」· 碗準備咗呢啲陪你（揀一樣就得）`,
    regulate_next: '陪完 · 繼續 →',
    bridge_share_class: '想老師留意吓我',
    bridge_share_family: '想屋企人留意吓我',
    bridge_share_timeline: '留返俾自己睇',
    bridge_complete: '完成啦 · 搞掂',
    home_ritual_cta: '同碗打招呼 · 3 分鐘',
    home_ritual_prompt: '今日想同碗打招呼嗎',
    home_ritual_hint: '慢慢嚟 · 三個步驟 · 呢度係你嘅小天地',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '你都值得記錄自己嘅心情',
    selfcare_subtitle: '撳我開始同自己坐一坐',
    bridge_eyebrow: '想唔想有人留意吓你?',
    /** Soft 「留意」tone · not 「傾偈／分享內容」. */
    bridge_by_state: {
      sympathetic_fire: '返返靜咗未呀? 想唔想有人留意吓你?',
      dorsal_sad: '感覺重唔重? 想唔想有人留意吓你?',
      sympathetic_anxious: '心跳慢返未? 想唔想有人陪你留意吓?',
      dorsal_freeze: '有 feel 番嗎? 想唔想有人留意吓你?',
      ventral_regulated: '今日好靚 · 想唔想有人一齊留意吓?',
      unspoken: '留返俾自己都得 · 想留意都可以',
    },
    release_lead_by_state: {
      sympathetic_fire: '火氣出咗之後 · 想點安頓呢份感覺?',
      dorsal_sad: '睇完溫柔畫面 · 想點安頓呢份重?',
      sympathetic_anxious: '定咗少少 · 想點安頓呢陣掛住?',
      dorsal_freeze: '郁返少少 · 想點安頓今日呢份感覺?',
      ventral_regulated: '靚感覺想留低 · 定係輕輕放下?',
      unspoken: '坐完一陣 · 想點處置今日呢頁?',
    },
    /** Companion job titles · same as upper · age live in sub lines. */
    regulate_by_state: {
      sympathetic_fire: '同碗一齊發洩',
      dorsal_sad: '同碗睇啲嘢',
      sympathetic_anxious: '碗陪你落地',
      dorsal_freeze: '碗想搞醒你',
      ventral_regulated: '留住呢個瞬間',
      unspoken: '同碗坐一坐',
    },
    soup_subs: SOUP_SUBS_LOWER,
    chip_labels: CHIP_LOWER,
  },
  upper: {
    soup_title: '你想請你嘅碗星靈食啲乜嘢啊?',
    soup_sub: '揀一樣請佢 · 可以係想安慰自己嘅味道 · 下一步會對齊身體',
    soup_offer_done: (food) => `請咗「${food}」俾碗星靈 · 精靈收咗`,
    soup_offer_skip: '碗星靈明白 · 今日唔使食',
    body_title: '戳戳碗仔 · 身體掃描',
    body_clarify: '想食甜唔等於開心 · 戳碗仔睇真相',
    body_vessel: '撳碗仔部位 · 睇吓浮起咩感覺',
    body_hint: '揀 3 樣就夠 · 碗滿啦!',
    body_cta: '準備見碗 →',
    body_skip: '暫時略過 →',
    region_labels: REGION_UPPER,
    pick_title: '你今日似邊個? 揀一個',
    pick_expand: '唔啱心水? 睇多啲 (12)',
    pick_collapse: '收埋',
    pick_see_all: '冇一個 fit? 睇全部',
    pick_direct: '唔想玩 · 直接揀',
    pick_play: '用小遊戲搵碗',
    talk_got_bowl: (bowl) => `你今日嘅碗係「${bowl}」`,
    talk_title: (bowl) => `同 ${bowl} 講吓今日發生咩事`,
    talk_speech: '我聽緊 · 慢慢講',
    talk_placeholder: '一個字都得 · 或者好長都 ok',
    talk_submit: '寫好 · 去打扮碗 →',
    talk_hug: '今日靜靜哋 · 得個抱 · 去打扮',
    talk_solo_title: '想寫吓今日發生咩事?',
    talk_solo_speech: '我聽緊 · 慢慢寫 · 唔使完美',
    talk_solo_submit: '寫好 · 繼續 →',
    talk_solo_hug: '今日靜靜哋 · 得個抱 · 繼續',
    quick_diary_continue: '寫好 · 繼續 →',
    customize_got_bowl: (bowl) => `寫完啦 · 呢個就係你嘅「${bowl}」`,
    customize_title: (bowl) => `幫 ${bowl} 打扮一下`,
    customize_sub: '先揀飾品 · 再撳碗上想放嘅位置 · 唔想可以跳過',
    customize_solo_got: '寫完啦 · 想加啲裝飾嗎?',
    customize_solo_title: '幫今日嘅日記打扮一下',
    customize_solo_sub: '先揀飾品 · 再撳上面想放嘅位置 · 唔想可以跳過',
    customize_place_hint: (d) => `撳碗上面 · 放「${d}」`,
    customize_place_hint_solo: (d) => `撳上面 · 放「${d}」`,
    customize_idle_hint: '先揀一件飾品 · 再撳碗上想放嘅位置',
    customize_idle_hint_solo: '先揀一件飾品 · 再撳想放嘅位置',
    customize_next: '打扮好 · 去陪碗 →',
    customize_skip: '唔打扮 · 去陪碗 →',
    release_title: (bowl) => `想點處理「${bowl}」?`,
    release_sub: '揀一個象徵動作 · 幫自己同呢份感覺道別或者安頓',
    release_actions: {
      empty: { label: '埋入泥土', hint: '摺好呢頁 · 會長成一棵小樹苗' },
      set_aside: { label: '放入書枱', hint: '打開櫃桶收埋 · 遲啲再諗' },
      send_away: { label: '摺成紙飛機', hint: '向住海島飛走 · 輕輕放手' },
      wash: { label: '洗乾淨', hint: '沖走殘留 · 整返清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '合上再鎖 · 只有你睇到' },
    },
    release_diary_title: '想點處置今日呢份日記?',
    release_diary_sub: '揀一個象徵動作 · 幫自己同呢頁日記道別或者安頓',
    release_diary_actions: {
      empty: { label: '埋入泥土', hint: '將呢頁摺好埋低 · 會長成樹苗' },
      set_aside: { label: '放入書枱', hint: '放入櫃桶 · 遲啲再決定都得' },
      send_away: { label: '摺成紙飛機', hint: '向住海島飛走' },
      wash: { label: '抹乾淨', hint: '抹走殘留 · 整返清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '只有你解鎖先睇到' },
    },
    release_anim_captions: {
      empty: '摺好 · 埋入泥土……',
      set_aside: '放入櫃桶……',
      send_away: '摺成紙飛機 · 飛走……',
      wash: '沖一沖 · 清爽……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_diary_anim_captions: {
      empty: '將呢頁埋入泥土……',
      set_aside: '放入書枱櫃桶……',
      send_away: '紙飛機飛走……',
      wash: '抹乾淨……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_finish: '搞掂 · 儲存',
    release_regulate: '陪碗做啲嘢',
    release_share_heading: '想唔想有人留意吓你?',
    release_done_title: '你搞掂啦',
    release_done_sub: (m) => `你今日肯坐低同自己相處咗 ${m} 分鐘 · 好厲害 · 好棒`,
    release_wrote_praise: '你今日肯寫低自己嘅嘢 · 呢件事本身好厲害',
    release_smile_hint: '對住自己笑一笑 · 2 秒（可選）',
    release_smile_hold: '撳住 2 秒',
    release_smile_done: '多謝你嘅笑',
    release_home: '回主頁',
    regulate_skip: '唔洗 · 我 OK',
    regulate_eyebrow: '陪碗做啲嘢',
    regulate_sub_by_state: {
      sympathetic_fire: '睇落你有啲熱辣辣 · 一齊發洩同慢慢呼吸',
      dorsal_sad: '睇落有啲重 · 一齊睇啲溫柔得意嘅畫面',
      sympathetic_anxious: '睇落有啲掛住 · 碗陪你慢慢落地',
      dorsal_freeze: '睇落有啲空空哋 · 輕輕搞醒少少感覺',
      ventral_regulated: '睇落幾靚 · 一齊留住呢個瞬間',
      unspoken: '唔使特別目標 · 同碗靜靜坐一陣都得',
    },
    regulate_pick_hint: (feel) =>
      `睇落你而家「${feel}」· 碗準備咗呢啲陪你（揀一樣就得）`,
    regulate_next: '陪完 · 繼續 →',
    bridge_share_class: '想老師留意吓我',
    bridge_share_family: '想屋企人留意吓我',
    bridge_share_timeline: '留返俾我自己 timeline',
    bridge_complete: '完成啦 · 搞掂',
    home_ritual_cta: '同碗打招呼 · 3 分鐘',
    home_ritual_prompt: '今日想同碗打招呼嗎',
    home_ritual_hint: '慢慢嚟 · 三個步驟 · 呢度係你嘅小天地',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '你都值得記錄自己嘅心情',
    selfcare_subtitle: '撳我開始同自己坐一坐',
    bridge_eyebrow: '想唔想有人留意吓你?',
    /** Soft 「留意」tone · not 「傾偈／分享內容」. */
    bridge_by_state: {
      sympathetic_fire: '而家平靜返啲未? 想唔想有人留意吓你?',
      dorsal_sad: '而家冇咁重未? 想唔想有人留意吓你?',
      sympathetic_anxious: '心跳慢返未? 想唔想有人留意吓你?',
      dorsal_freeze: '有返啲自己未? 想唔想有人留意吓你?',
      ventral_regulated: '今日呢種靚感覺 · 想唔想有人一齊留意?',
      unspoken: '今日留返俾自己都完全 OK',
    },
    release_lead_by_state: {
      sympathetic_fire: '發洩完之後 · 想點安頓呢份火?',
      dorsal_sad: '睇過溫柔嘢之後 · 想點安頓呢份重?',
      sympathetic_anxious: '落地之後 · 想點安頓呢陣掛住?',
      dorsal_freeze: '搞醒少少之後 · 想點安頓今日?',
      ventral_regulated: '呢個靚瞬間 · 想留低定輕輕放手?',
      unspoken: '坐完之後 · 想點處置今日呢頁?',
    },
    regulate_by_state: {
      sympathetic_fire: '同碗一齊發洩',
      dorsal_sad: '同碗睇啲嘢',
      sympathetic_anxious: '碗陪你落地',
      dorsal_freeze: '碗想搞醒你',
      ventral_regulated: '留住呢個瞬間',
      unspoken: '同碗坐一坐',
    },
    soup_subs: SOUP_SUBS_UPPER,
    chip_labels: CHIP_UPPER,
  },
  adult: {
    soup_title: '你想請你嘅碗星靈食啲乜?',
    soup_sub: '用一樣食物請佢 · 可以係狀態 · 亦可以係想慰藉自己嘅味道',
    soup_offer_done: (food) => `已請「${food}」俾碗星靈`,
    soup_offer_skip: '碗星靈明白 · 今日可以唔食',
    body_title: '戳戳碗仔 · 身體覺察',
    body_clarify: '想食甜可以係開心 · 亦可以係想被安慰 · 身體幫你分清楚',
    body_vessel: '撳碗仔部位 · 睇吓浮起嘅感覺',
    body_hint: '唔使完美 · 揀而家最明顯嘅',
    body_cta: '下一步 · 睇碗 →',
    body_skip: '略過身體感覺 →',
    region_labels: REGION_ADULT,
    pick_title: '邊個碗最贴近你而家?',
    pick_expand: '想睇多啲選擇',
    pick_collapse: '收起',
    pick_see_all: '睇完整圖鑑',
    pick_direct: '跳過互動 · 直接選擇',
    pick_play: '用互動搵碗',
    talk_got_bowl: (bowl) => `你今日對應嘅碗係「${bowl}」`,
    talk_title: (bowl) => `同「${bowl}」講今日發生咩事`,
    talk_speech: '我喺度 · 你可以慢慢寫',
    talk_placeholder: '寫幾句都得 · 亦可以淨係留白',
    talk_submit: '寫好 · 去打扮 →',
    talk_hug: '今日只想靜一靜 · 去打扮',
    talk_solo_title: '想寫吓今日發生咩事?',
    talk_solo_speech: '我喺度 · 你可以慢慢寫',
    talk_solo_submit: '寫好 · 繼續 →',
    talk_solo_hug: '今日只想靜一靜 · 繼續',
    quick_diary_continue: '寫好 · 繼續 →',
    customize_got_bowl: (bowl) => `寫完之後 · 呢個係你嘅「${bowl}」`,
    customize_title: (bowl) => `為「${bowl}」加裝飾同調校大細`,
    customize_sub: '揀飾品後撳碗上位置放置 · 再調感覺強度 · 可略過',
    customize_solo_got: '寫完之後 · 想加啲裝飾嗎?',
    customize_solo_title: '為今日嘅日記加裝飾同調校大細',
    customize_solo_sub: '揀飾品後撳上面放置 · 再調感覺強度 · 可略過',
    customize_place_hint: (d) => `撳碗上面 · 放「${d}」`,
    customize_place_hint_solo: (d) => `撳上面 · 放「${d}」`,
    customize_idle_hint: '先揀一件飾品 · 再撳碗上想放嘅位置',
    customize_idle_hint_solo: '先揀一件飾品 · 再撳想放嘅位置',
    customize_next: '打扮好 · 去做調節 →',
    customize_skip: '略過打扮 · 去做調節 →',
    release_title: (bowl) => `你想點安頓「${bowl}」?`,
    release_sub: '用一個象徵動作 · 為今日嘅情緒做個收束',
    release_actions: {
      empty: { label: '埋入泥土', hint: '摺好安放 · 讓它長成樹苗' },
      set_aside: { label: '放入書枱', hint: '暫收櫃桶 · 稍後再決定' },
      send_away: { label: '摺成紙飛機', hint: '向海島飛走 · 象徵放手' },
      wash: { label: '清洗', hint: '沖走殘留 · 回復清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '合上再鎖 · 只有你能打開' },
    },
    release_diary_title: '你想點處置今日呢份日記?',
    release_diary_sub: '用一個象徵動作 · 為呢頁日記做個收束',
    release_diary_actions: {
      empty: { label: '埋入泥土', hint: '將呢頁摺好埋低 · 長成樹苗' },
      set_aside: { label: '放入書枱', hint: '暫收櫃桶 · 稍後再決定' },
      send_away: { label: '摺成紙飛機', hint: '向海島飛走 · 象徵放手' },
      wash: { label: '抹乾淨', hint: '抹走殘留 · 回復清爽' },
      keep_hug: { label: '放入盒鎖好', hint: '只有你解鎖才能再看' },
    },
    release_anim_captions: {
      empty: '摺好 · 埋入泥土……',
      set_aside: '放入櫃桶……',
      send_away: '摺成紙飛機 · 飛走……',
      wash: '清洗緊……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_diary_anim_captions: {
      empty: '將呢頁埋入泥土……',
      set_aside: '放入書枱櫃桶……',
      send_away: '紙飛機飛走……',
      wash: '抹乾淨……',
      keep_hug: '放入盒 · 鎖好……',
    },
    release_finish: '儲存打卡',
    release_regulate: '陪自己做啲調節',
    release_share_heading: '想唔想有人留意吓你?',
    release_done_title: '你搞掂啦',
    release_done_sub: (m) => `你今日肯坐低同自己相處咗 ${m} 分鐘 · 好厲害 · 好棒`,
    release_wrote_praise: '你今日肯為自己寫低呢段 · 值得被肯定',
    release_smile_hint: '對住自己笑一笑 · 2 秒（可選）',
    release_smile_hold: '撳住 2 秒',
    release_smile_done: '多謝你嘅笑',
    release_home: '回主頁',
    regulate_skip: '暫時唔使 · 我 OK',
    regulate_eyebrow: '陪自己做啲調節',
    regulate_sub_by_state: {
      sympathetic_fire: '身體有啲被点燃 · 一齊釋放同呼吸',
      dorsal_sad: '能量偏低 · 一齊睇啲溫柔畫面托住自己',
      sympathetic_anxious: '節奏偏快 · 一齊慢慢落地',
      dorsal_freeze: '有啲抽離 · 輕輕激活少少感覺',
      ventral_regulated: '狀態幾穩 · 一齊留住呢個瞬間',
      unspoken: '唔使特別目標 · 同自己靜靜坐一陣都得',
    },
    regulate_pick_hint: (feel) =>
      `因為而家「${feel}」· 呢度有啲調節方式（揀一樣就得）`,
    regulate_next: '調節完 · 繼續 →',
    bridge_share_class: '想老師／同事留意吓我（可選）',
    bridge_share_family: '想屋企人留意吓我（可選）',
    bridge_share_timeline: '留喺自己 timeline',
    bridge_complete: '完成打卡',
    home_ritual_cta: '同自己 check-in · 約 3 分鐘',
    home_ritual_prompt: '今日想為自己留幾分鐘嗎',
    home_ritual_hint: '溫柔對齊 · 唔急 · 呢度係你嘅空間',
    home_quick_diary: '直接寫日記',
    home_album: '睇心情圖鑑',
    selfcare_title: '照顧學生之前 · 都要照顧自己',
    selfcare_subtitle: '開自己嘅 check-in · 畀自己幾分鐘',
    bridge_eyebrow: '想唔想有人留意吓你?',
    bridge_by_state: {
      sympathetic_fire: '平靜返少少未? 想唔想有人留意吓你?',
      dorsal_sad: '重量輕咗啲未? 想唔想有人留意吓你?',
      sympathetic_anxious: '節奏慢返未? 想唔想有人留意吓你?',
      dorsal_freeze: '有返啲感覺未? 想唔想有人留意吓你?',
      ventral_regulated: '呢種狀態想唔想有人一齊留意?',
      unspoken: '今日可以淨係留俾自己',
    },
    release_lead_by_state: {
      sympathetic_fire: '釋放之後 · 想點安頓呢份能量?',
      dorsal_sad: '托住自己之後 · 想點安頓呢份重量?',
      sympathetic_anxious: '落地之後 · 想點安頓呢陣緊張?',
      dorsal_freeze: '激活之後 · 想點安頓今日?',
      ventral_regulated: '呢個狀態 · 想留低定輕輕放手?',
      unspoken: '坐完之後 · 想點處置今日呢段?',
    },
    regulate_by_state: {
      sympathetic_fire: '一齊釋放一下',
      dorsal_sad: '睇啲溫柔嘅畫面',
      sympathetic_anxious: '陪你慢慢落地',
      dorsal_freeze: '輕輕搞醒少少感覺',
      ventral_regulated: '留住呢個瞬間',
      unspoken: '同自己坐一坐',
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
