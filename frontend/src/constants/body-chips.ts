export type BodyChipKey =
  | 'chest_warm'
  | 'chest_tight'
  | 'heart_fast'
  | 'belly_full'
  | 'head_heavy'
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

export const BODY_CHIPS: BodyChipDef[] = [
  { key: 'chest_warm', emoji: '🌟', label: '胸口暖暖', animation: 'chest_glow' },
  { key: 'chest_tight', emoji: '💨', label: '胸口悶悶', animation: 'chest_cloud' },
  { key: 'heart_fast', emoji: '💓', label: '心跳好快', animation: 'pulse_fast' },
  { key: 'belly_full', emoji: '🍥', label: '肚仔嘟嘟', animation: 'belly_wiggle' },
  { key: 'head_heavy', emoji: '🪨', label: '頭重重', animation: 'tilt_down' },
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
