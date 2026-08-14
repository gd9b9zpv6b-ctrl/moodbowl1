export type BowlColorTint = {
  hex: string;
  label: string;
  /** Stronger wash used for live preview so kids see the change clearly. */
  wash: string;
};

/**
 * User-picked bowl washes for the customize step.
 * Pastel but saturated enough to read on mascot PNGs.
 */
export const BOWL_COLOR_TINTS: BowlColorTint[] = [
  { hex: '#FFFFFF', label: '原本', wash: 'transparent' },
  { hex: '#FF8FA3', label: '草莓紅', wash: 'rgba(255,143,163,0.45)' },
  { hex: '#FFB347', label: '蜜糖橙', wash: 'rgba(255,179,71,0.45)' },
  { hex: '#FFE566', label: '陽光黃', wash: 'rgba(255,229,102,0.42)' },
  { hex: '#7DCEA0', label: '抹茶綠', wash: 'rgba(125,206,160,0.45)' },
  { hex: '#5DADE2', label: '天空藍', wash: 'rgba(93,173,226,0.45)' },
  { hex: '#AF7AC5', label: '葡萄紫', wash: 'rgba(175,122,197,0.42)' },
  { hex: '#F5B7B1', label: '櫻花粉', wash: 'rgba(245,183,177,0.45)' },
  { hex: '#D5D8DC', label: '淡灰', wash: 'rgba(213,216,220,0.5)' },
];

export function tintWash(hex: string | null | undefined): string {
  if (!hex || hex === '#FFFFFF') return 'transparent';
  const found = BOWL_COLOR_TINTS.find((t) => t.hex === hex);
  return found?.wash || hex;
}

export function tintLabel(hex: string | null | undefined): string {
  if (!hex || hex === '#FFFFFF') return '原本';
  return BOWL_COLOR_TINTS.find((t) => t.hex === hex)?.label || '顏色';
}
