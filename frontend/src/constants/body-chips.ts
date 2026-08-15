/**
 * Somatic body chips · L2 clarification after drink metaphor.
 * Grouped by body region for a light “身體掃描 / 飲品容器” scan.
 *
 * `emoji` is the single source for chip list + floating decor on 碗仔.
 */

export type BodyChipKey =
  | 'face_flush'
  | 'jaw_clench'
  | 'teary'
  | 'eyelids_heavy'
  | 'eyes_bright'
  | 'head_heavy'
  | 'brain_blank'
  | 'chest_warm'
  | 'chest_tight'
  | 'heart_fast'
  | 'breath_fast'
  | 'heat_rising'
  | 'throat_tight'
  | 'belly_full'
  | 'no_appetite'
  | 'need_toilet'
  | 'fists_clench'
  | 'sweaty_palms'
  | 'shaky'
  | 'soft_hands'
  | 'shoulders_heavy'
  | 'body_tense'
  | 'want_jump'
  | 'smile_wide'
  | 'curled_up'
  | 'floaty';

export type BodyRegionKey = 'head' | 'chest' | 'belly' | 'hands' | 'whole';

export type BodyChipDef = {
  key: BodyChipKey;
  /** Same emoji on chip button and on 碗仔 decoration. */
  emoji: string;
  /** Fallback label · wording packs override per age band. */
  label: string;
  animation: string;
  region: BodyRegionKey;
  /** Where the decor floats on blank 碗仔. */
  decorSpot:
    | 'head'
    | 'face'
    | 'chest'
    | 'belly'
    | 'leftHand'
    | 'rightHand'
    | 'feet'
    | 'auraL'
    | 'auraR';
};

export type BodyRegionDef = {
  key: BodyRegionKey;
  emoji: string;
  /** Fallback region title · wording packs override. */
  label: string;
};

export const BODY_REGIONS: BodyRegionDef[] = [
  { key: 'head', emoji: '🧑', label: '碗頭' },
  { key: 'chest', emoji: '💓', label: '胸口' },
  { key: 'belly', emoji: '🫧', label: '肚仔' },
  { key: 'hands', emoji: '🖐️', label: '小手' },
  { key: 'whole', emoji: '🦶', label: '雙腳' },
];

/** Interoceptive chips for L2 · user picks up to 3. */
export const BODY_CHIPS: BodyChipDef[] = [
  // 頭 · emoji matches somatic description
  { key: 'face_flush', emoji: '♨️', label: '面紅', animation: 'face_flush', region: 'head', decorSpot: 'face' },
  { key: 'jaw_clench', emoji: '😬', label: '牙咬緊', animation: 'jaw_clench', region: 'head', decorSpot: 'face' },
  { key: 'teary', emoji: '💧', label: '眼濕濕', animation: 'tear_droplet', region: 'head', decorSpot: 'face' },
  { key: 'eyelids_heavy', emoji: '😴', label: '眼皮好重', animation: 'blink_slow', region: 'head', decorSpot: 'head' },
  { key: 'eyes_bright', emoji: '✨', label: '眼睛發亮', animation: 'eyes_sparkle', region: 'head', decorSpot: 'face' },
  { key: 'head_heavy', emoji: '🪨', label: '頭好重', animation: 'tilt_down', region: 'head', decorSpot: 'head' },
  { key: 'brain_blank', emoji: '🌫️', label: '腦海空白', animation: 'fog_drift', region: 'head', decorSpot: 'head' },
  // 胸口
  { key: 'chest_warm', emoji: '🌟', label: '胸口暖暖', animation: 'chest_glow', region: 'chest', decorSpot: 'chest' },
  { key: 'chest_tight', emoji: '🪨', label: '胸口悶悶', animation: 'chest_cloud', region: 'chest', decorSpot: 'chest' },
  { key: 'heart_fast', emoji: '🐇', label: '心跳得好快', animation: 'pulse_fast', region: 'chest', decorSpot: 'chest' },
  { key: 'breath_fast', emoji: '💨', label: '呼吸好急', animation: 'breath_puff', region: 'chest', decorSpot: 'chest' },
  { key: 'heat_rising', emoji: '🔥', label: '熱氣上湧', animation: 'heat_rise', region: 'chest', decorSpot: 'auraL' },
  // 肚同喉
  { key: 'throat_tight', emoji: '🪨', label: '喉嚨哽哽', animation: 'throat_catch', region: 'belly', decorSpot: 'belly' },
  { key: 'belly_full', emoji: '🦋', label: '肚仔翻滾', animation: 'belly_wiggle', region: 'belly', decorSpot: 'belly' },
  { key: 'no_appetite', emoji: '🥣', label: '冇胃口', animation: 'appetite_fade', region: 'belly', decorSpot: 'belly' },
  { key: 'need_toilet', emoji: '🚻', label: '想去廁所', animation: 'wiggle_urgent', region: 'belly', decorSpot: 'belly' },
  // 手同膊
  { key: 'fists_clench', emoji: '✊', label: '拳頭捏緊', animation: 'fist_clench', region: 'hands', decorSpot: 'leftHand' },
  { key: 'sweaty_palms', emoji: '💦', label: '手心濕濕', animation: 'palm_sweat', region: 'hands', decorSpot: 'rightHand' },
  { key: 'shaky', emoji: '🫨', label: '手腳震震', animation: 'tremble', region: 'hands', decorSpot: 'auraR' },
  { key: 'soft_hands', emoji: '🍜', label: '手軟軟', animation: 'wobble', region: 'hands', decorSpot: 'rightHand' },
  { key: 'shoulders_heavy', emoji: '🎒', label: '膊頭好重', animation: 'shoulders_drop', region: 'hands', decorSpot: 'auraL' },
  // 成個身體／腳
  { key: 'body_tense', emoji: '🏹', label: '身體繃緊', animation: 'tense_hold', region: 'whole', decorSpot: 'auraL' },
  { key: 'want_jump', emoji: '🦘', label: '腳仔想跳', animation: 'bounce', region: 'whole', decorSpot: 'feet' },
  { key: 'smile_wide', emoji: '😊', label: '嘴角上揚', animation: 'smile_pull', region: 'whole', decorSpot: 'face' },
  { key: 'curled_up', emoji: '🐚', label: '縮埋一團', animation: 'scale_down', region: 'whole', decorSpot: 'auraR' },
  { key: 'floaty', emoji: '🪶', label: '輕飄飄', animation: 'float_drift', region: 'whole', decorSpot: 'auraR' },
];

export const BODY_CHIP_BY_KEY: Record<BodyChipKey, BodyChipDef> = BODY_CHIPS.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<BodyChipKey, BodyChipDef>,
);

export function chipsForRegion(region: BodyRegionKey): BodyChipDef[] {
  return BODY_CHIPS.filter((c) => c.region === region);
}
