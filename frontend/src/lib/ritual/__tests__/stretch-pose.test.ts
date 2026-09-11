import { describe, expect, it } from 'vitest';

import { STRETCH_STEPS, stretchPoseForStep } from '../stretch-pose';

describe('stretchPoseForStep', () => {
  it('has one pose per stretch cue', () => {
    expect(STRETCH_STEPS).toHaveLength(5);
    expect(stretchPoseForStep(1).armRaise).toBeGreaterThan(stretchPoseForStep(0).armRaise);
    expect(stretchPoseForStep(1).scaleY).toBeGreaterThan(stretchPoseForStep(0).scaleY);
  });

  it('leans left then right, then settles with a breath', () => {
    expect(stretchPoseForStep(2).rotateDeg).toBeLessThan(0);
    expect(stretchPoseForStep(3).rotateDeg).toBeGreaterThan(0);
    expect(stretchPoseForStep(4).armRaise).toBe(0);
    expect(stretchPoseForStep(4).scaleY).toBeLessThan(1);
  });
});
