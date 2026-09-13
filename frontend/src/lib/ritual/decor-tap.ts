/**
 * Map a press onto a measured bowl box.
 *
 * RN-web `measureInWindow` is viewport-relative (getBoundingClientRect).
 * `pageX` / `pageY` are document-relative and include scroll. Mixing them
 * after the customize page scrolls puts stickers far from the tap.
 */
export type TapNative = {
  locationX?: number;
  locationY?: number;
  pageX?: number;
  pageY?: number;
  clientX?: number;
  clientY?: number;
};

export type MeasuredBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function finite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function usableLocal(n: number | undefined, span: number): n is number {
  return finite(n) && n !== 0 && n >= -1 && n <= span + 1;
}

export function localTapInMeasuredBox(
  native: TapNative,
  box: MeasuredBox,
  scroll: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
  const w = box.width > 0 ? box.width : 1;
  const h = box.height > 0 ? box.height : 1;

  if (usableLocal(native.locationX, w) && usableLocal(native.locationY, h)) {
    return { x: native.locationX, y: native.locationY };
  }

  const clientX = finite(native.clientX)
    ? native.clientX
    : finite(native.pageX)
      ? native.pageX - scroll.x
      : w / 2;
  const clientY = finite(native.clientY)
    ? native.clientY
    : finite(native.pageY)
      ? native.pageY - scroll.y
      : h / 2;

  return { x: clientX - box.x, y: clientY - box.y };
}

export function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(5, Math.min(95, n));
}

export function tapToPct(
  native: TapNative,
  box: MeasuredBox,
  scroll?: { x: number; y: number },
): { x: number; y: number } {
  const local = localTapInMeasuredBox(native, box, scroll);
  const w = box.width > 0 ? box.width : 1;
  const h = box.height > 0 ? box.height : 1;
  return {
    x: clampPct((local.x / w) * 100),
    y: clampPct((local.y / h) * 100),
  };
}
