export type BodyChipKey =
  | 'chest_warm'
  | 'chest_tight'
  | 'heart_fast'
  | 'belly_full'
  | 'head_heavy'
  | 'shoulders_heavy'
  | 'face_flush'
  | 'throat_tight'
  | 'sweaty_palms'
  | 'want_jump'
  | 'curled_up'
  | 'teary'
  | 'soft_hands'
  | 'floaty';

export type BodyChipDef = {
  key: BodyChipKey;
  emoji: string;
  label: string;
  animation: string;
};

/** Interoceptive chips for L2 clarification · user picks up to 3. */
export const BODY_CHIPS: BodyChipDef[] = [
  { key: 'chest_warm', emoji: '🌟', label: '胸口暖暖', animation: 'chest_glow' },
  { key: 'chest_tight', emoji: '💨', label: '胸口悶悶', animation: 'chest_cloud' },
  { key: 'heart_fast', emoji: '💓', label: '心跳得好快', animation: 'pulse_fast' },
  { key: 'face_flush', emoji: '😳', label: '面紅', animation: 'face_flush' },
  { key: 'head_heavy', emoji: '🪨', label: '頭好重', animation: 'tilt_down' },
  { key: 'shoulders_heavy', emoji: '🏋️', label: '膊頭好重', animation: 'shoulders_drop' },
  { key: 'throat_tight', emoji: '🫧', label: '喉嚨哽哽', animation: 'throat_catch' },
  { key: 'belly_full', emoji: '🍥', label: '肚仔嘟嘟', animation: 'belly_wiggle' },
  { key: 'sweaty_palms', emoji: '🖐️', label: '手心濕濕', animation: 'palm_sweat' },
  { key: 'want_jump', emoji: '🕺', label: '好想跳', animation: 'bounce' },
  { key: 'curled_up', emoji: '🐚', label: '縮埋一團', animation: 'scale_down' },
  { key: 'teary', emoji: '💧', label: '眼濕濕', animation: 'tear_droplet' },
  { key: 'soft_hands', emoji: '🫥', label: '手軟軟', animation: 'wobble' },
  { key: 'floaty', emoji: '🪶', label: '輕飄飄', animation: 'float_drift' },
];

export const BODY_CHIP_BY_KEY: Record<BodyChipKey, BodyChipDef> = BODY_CHIPS.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<BodyChipKey, BodyChipDef>,
);
