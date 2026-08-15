export type BowlDecoration = {
  key: string;
  emoji: string;
  label: string;
};

/** A decoration sticker pinned onto the bowl at a chosen spot. */
export type PlacedDecoration = {
  key: string;
  /** 0–100 · horizontal % from left */
  x: number;
  /** 0–100 · vertical % from top */
  y: number;
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

/** Fallback positions when decoding legacy key-only lists. */
export const DEFAULT_DECOR_SLOTS: { x: number; y: number }[] = [
  { x: 18, y: 12 },
  { x: 68, y: 10 },
  { x: 12, y: 62 },
  { x: 72, y: 58 },
];

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(4, Math.min(88, Math.round(n)));
}

/** Persist decorations in the existing bowl_color_tint text column. */
export function encodeDecorations(items: PlacedDecoration[]): string | null {
  const clean = items
    .filter((p) => BOWL_DECOR_BY_KEY[p.key])
    .slice(0, MAX_BOWL_DECORS)
    .map((p) => `${p.key}@${clampPct(p.x)},${clampPct(p.y)}`);
  if (clean.length === 0) return null;
  return `decor:${clean.join(';')}`;
}

/**
 * Decode persisted decorations.
 * Supports:
 * - `decor:star@18,12;heart@70,20` (with positions)
 * - `decor:star,heart` (legacy · default slots)
 */
export function decodeDecorations(raw: string | null | undefined): PlacedDecoration[] {
  if (!raw) return [];
  if (!raw.startsWith('decor:')) return [];

  const body = raw.slice(6).trim();
  if (!body) return [];

  // Positioned format uses `;` separators (or single item with `@`)
  if (body.includes('@')) {
    return body
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [keyPart, posPart] = part.split('@');
        const key = (keyPart || '').trim();
        if (!BOWL_DECOR_BY_KEY[key] || !posPart) return null;
        const [xs, ys] = posPart.split(',');
        const x = clampPct(Number(xs));
        const y = clampPct(Number(ys));
        return { key, x, y } satisfies PlacedDecoration;
      })
      .filter((p): p is PlacedDecoration => !!p)
      .slice(0, MAX_BOWL_DECORS);
  }

  // Legacy key list
  return body
    .split(',')
    .map((s) => s.trim())
    .filter((k) => BOWL_DECOR_BY_KEY[k])
    .slice(0, MAX_BOWL_DECORS)
    .map((key, i) => {
      const slot = DEFAULT_DECOR_SLOTS[i] || DEFAULT_DECOR_SLOTS[0];
      return { key, x: slot.x, y: slot.y };
    });
}

export function isLegacyTint(raw: string | null | undefined): boolean {
  return !!raw && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim());
}
