/**
 * Bowl size = intensity signal for teacher follow-up reports.
 * Scheme B: replaces the independent 0–100 battery slider as the
 * “how strong is this feeling?” dimension kids set during customize / quick diary.
 */

export type BowlSize = 'S' | 'M' | 'L' | 'XL';

export type BowlSizeMeta = {
  key: BowlSize;
  label: string;
  /** Kid-facing intensity hint */
  hint: string;
  /** Teacher-facing follow-up cue (not shown to students) */
  teacherHint: string;
  scale: number;
  /** Legacy 0–100 energy_level mirror for older dashboards / RPC */
  energyLevel: number;
  /** Whether teachers should prioritize a check-in */
  followUp: 'none' | 'watch' | 'follow';
};

export const BOWL_SIZES: BowlSizeMeta[] = [
  {
    key: 'S',
    label: 'S',
    hint: '淡淡地',
    teacherHint: '感覺好淡 · 通常唔使即刻跟進',
    scale: 0.75,
    energyLevel: 25,
    followUp: 'none',
  },
  {
    key: 'M',
    label: 'M',
    hint: '一般',
    teacherHint: '一般強度 · 觀察即可',
    scale: 1,
    energyLevel: 50,
    followUp: 'none',
  },
  {
    key: 'L',
    label: 'L',
    hint: '好強烈',
    teacherHint: '感覺好強烈 · 建議留意跟進',
    scale: 1.25,
    energyLevel: 75,
    followUp: 'watch',
  },
  {
    key: 'XL',
    label: 'XL',
    hint: '巨型',
    teacherHint: '感覺好大 · 建議主動跟進',
    scale: 1.5,
    energyLevel: 95,
    followUp: 'follow',
  },
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

/** Mirror size into legacy energy_level (0–100) for older teacher tooling. */
export function bowlSizeToEnergyLevel(key: BowlSize | string | null | undefined): number {
  return bowlSizeMeta(key).energyLevel;
}

export function needsTeacherFollowUp(key: BowlSize | string | null | undefined): boolean {
  const level = bowlSizeMeta(key).followUp;
  return level === 'watch' || level === 'follow';
}
