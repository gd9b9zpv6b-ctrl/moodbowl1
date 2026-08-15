export type BowlDecoration = {
  key: string;
  emoji: string;
  label: string;
};

/** Stickers users can pin onto their bowl during 打扮. */
export const BOWL_DECORATIONS: BowlDecoration[] = [
  { key: 'star', emoji: '⭐', label: '星星' },
  { key: 'heart', emoji: '💗', label: '心心' },
  { key: 'flower', emoji: '🌸', label: '小花' },
  { key: 'bow', emoji: '🎀', label: '蝴蝶結' },
  { key: 'sparkle', emoji: '✨', label: '閃閃' },
  { key: 'crown', emoji: '👑', label: '皇冠' },
  { key: 'rainbow', emoji: '🌈', label: '彩虹' },
  { key: 'moon', emoji: '🌙', label: '月亮' },
  { key: 'cloud', emoji: '☁️', label: '白雲' },
  { key: 'leaf', emoji: '🍃', label: '葉子' },
  { key: 'music', emoji: '🎵', label: '音符' },
  { key: 'sun', emoji: '☀️', label: '太陽' },
];

export const BOWL_DECOR_BY_KEY: Record<string, BowlDecoration> = Object.fromEntries(
  BOWL_DECORATIONS.map((d) => [d.key, d]),
);

export const MAX_BOWL_DECORS = 4;

/** Persist decorations in the existing bowl_color_tint text column. */
export function encodeDecorations(keys: string[]): string | null {
  const clean = keys.filter((k) => BOWL_DECOR_BY_KEY[k]);
  if (clean.length === 0) return null;
  return `decor:${clean.join(',')}`;
}

export function decodeDecorations(raw: string | null | undefined): string[] {
  if (!raw) return [];
  if (raw.startsWith('decor:')) {
    return raw
      .slice(6)
      .split(',')
      .map((s) => s.trim())
      .filter((k) => BOWL_DECOR_BY_KEY[k]);
  }
  // Legacy hex tint · no decorations
  return [];
}

export function isLegacyTint(raw: string | null | undefined): boolean {
  return !!raw && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim());
}
