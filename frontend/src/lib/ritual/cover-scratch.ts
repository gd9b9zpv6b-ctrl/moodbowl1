/** Grid math for the full-sheet hide-and-seek covers (sand, rain, fog). */

export const COVER_COLUMNS = 8;
export const COVER_ROWS = 10;
export const SCRATCH_HIT_THRESHOLD = 3;
export const SCRATCH_MOVE_MIN = 7;

export function clampIndex(value: number, maxExclusive: number): number {
  if (!Number.isFinite(value) || maxExclusive <= 0) return 0;
  return Math.max(0, Math.min(maxExclusive - 1, Math.floor(value)));
}

export function coverCellAt(
  x: number,
  y: number,
  width: number,
  height: number,
  columns: number,
  rows: number,
): number {
  const w = width > 0 ? width : 1;
  const h = height > 0 ? height : 1;
  const column = clampIndex(x / (w / columns), columns);
  const row = clampIndex(y / (h / rows), rows);
  return row * columns + column;
}

export function bowlIndexAt(
  x: number,
  y: number,
  width: number,
  height: number,
  count: number,
): number | null {
  if (count <= 0) return null;
  const columns = count > 12 ? 5 : count > 6 ? 4 : count > 4 ? 3 : 2;
  const rows = Math.ceil(count / columns);
  const w = width > 0 ? width : 1;
  const h = height > 0 ? height : 1;
  const column = clampIndex(x / (w / columns), columns);
  const row = clampIndex(y / (h / rows), rows);
  const index = row * columns + column;
  return index < count ? index : null;
}

export function shouldDiscoverAfterHits(hits: number): boolean {
  return hits >= SCRATCH_HIT_THRESHOLD;
}

export function farEnoughFromLast(
  x: number,
  y: number,
  last: { x: number; y: number },
  start: boolean,
): boolean {
  if (start) return true;
  const dx = x - last.x;
  const dy = y - last.y;
  return Math.sqrt(dx * dx + dy * dy) >= SCRATCH_MOVE_MIN;
}
