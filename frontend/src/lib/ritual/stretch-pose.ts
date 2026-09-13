/** Gentle-stretch poses · the bowl moves with each cue. */

export const STRETCH_STEPS = [
  '慢慢企直啲 · 或者坐穩',
  '雙手向上伸 · 好似想掂到天花',
  '輕輕側一側 · 左邊',
  '再側一側 · 右邊',
  '放下雙手 · 呼一大口氣',
] as const;

export type StretchPose = {
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  translateY: number;
  /** 0 = arms down · 1 = arms reaching up */
  armRaise: number;
};

export function stretchPoseForStep(index: number): StretchPose {
  switch (index) {
    case 0:
      return { scaleX: 1, scaleY: 1.05, rotateDeg: 0, translateY: -6, armRaise: 0.12 };
    case 1:
      return { scaleX: 0.88, scaleY: 1.24, rotateDeg: 0, translateY: -22, armRaise: 1 };
    case 2:
      return { scaleX: 0.94, scaleY: 1.14, rotateDeg: -16, translateY: -12, armRaise: 0.82 };
    case 3:
      return { scaleX: 0.94, scaleY: 1.14, rotateDeg: 16, translateY: -12, armRaise: 0.82 };
    default:
      return { scaleX: 1.06, scaleY: 0.94, rotateDeg: 0, translateY: 8, armRaise: 0 };
  }
}
