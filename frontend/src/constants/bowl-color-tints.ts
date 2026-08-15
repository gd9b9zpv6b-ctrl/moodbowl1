export type BowlColorTint = {
  hex: string;
  label: string;
};

/**
 * User-picked bowl recolors for the customize step.
 * Applied via EmotionVisual mix-blend (recolors the art, not a wash on top).
 */
export const BOWL_COLOR_TINTS: BowlColorTint[] = [
  { hex: '#FFFFFF', label: '原本' },
  { hex: '#FF8FA3', label: '草莓紅' },
  { hex: '#FFB347', label: '蜜糖橙' },
  { hex: '#FFE566', label: '陽光黃' },
  { hex: '#7DCEA0', label: '抹茶綠' },
  { hex: '#5DADE2', label: '天空藍' },
  { hex: '#AF7AC5', label: '葡萄紫' },
  { hex: '#F5B7B1', label: '櫻花粉' },
  { hex: '#D5D8DC', label: '淡灰' },
];

export function tintLabel(hex: string | null | undefined): string {
  if (!hex || hex === '#FFFFFF') return '原本';
  return BOWL_COLOR_TINTS.find((t) => t.hex === hex)?.label || '顏色';
}
