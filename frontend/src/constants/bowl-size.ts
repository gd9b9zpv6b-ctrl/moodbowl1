/**
 * Bowl size = intensity of the feeling kids set during customize / quick diary.
 * Teacher follow-up rules live in `teacher-follow-up.ts` (negative emotions only).
 */

export type BowlSize = 'S' | 'M' | 'L' | 'XL';

export type BowlSizeMeta = {
  key: BowlSize;
  label: string;
  /** Kid-facing intensity hint */
  hint: string;
  scale: number;
  /** Legacy 0–100 energy_level mirror for older dashboards / RPC */
  energyLevel: number;
};

export const BOWL_SIZES: BowlSizeMeta[] = [
  { key: 'S', label: 'S', hint: '淡淡地', scale: 0.75, energyLevel: 25 },
  { key: 'M', label: 'M', hint: '一般', scale: 1, energyLevel: 50 },
  { key: 'L', label: 'L', hint: '好強烈', scale: 1.25, energyLevel: 75 },
  { key: 'XL', label: 'XL', hint: '巨型', scale: 1.5, energyLevel: 95 },
];

export function isBowlSize(value: unknown): value is BowlSize {
  return value === 'S' || value === 'M' || value === 'L' || value === 'XL';
}

export function bowlSizeIndex(key: BowlSize | string | null | undefined): number {
  const i = BOWL_SIZES.findIndex((s) => s.key === key);
  return i >= 0 ? i : 1;
}

export function bowlSizeMeta(key: BowlSize | string | null | undefined): BowlSizeMeta {
  return BOWL_SIZES[bowlSizeIndex(key)] ?? BOWL_SIZES[1];
}

/** Mirror size into legacy energy_level (0–100) for older tooling. */
export function bowlSizeToEnergyLevel(key: BowlSize | string | null | undefined): number {
  return bowlSizeMeta(key).energyLevel;
}
