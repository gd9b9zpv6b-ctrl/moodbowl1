/** Match the breathing visual to the activity name. */

export type BreathShape = 'ice' | 'bowl' | 'wind' | 'orb';

export function breathShapeForActivity(key: string | null | undefined): BreathShape {
  if (key === 'ice_breath') return 'ice';
  if (key === 'sit_with_bowl') return 'bowl';
  if (key === 'soft_breath' || key === 'wake_breath' || key === 'savor_breath') return 'wind';
  return 'orb';
}
