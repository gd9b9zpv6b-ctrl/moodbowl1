// 能量分類 · 高 / 平穩 / 低 (用嚟做 admin dashboard)
import { EMOTIONS } from './emotions';

export type EnergyLevel = 'high' | 'steady' | 'low';

export const ENERGY_META: Record<EnergyLevel, { label: string; color: string; representative: string }> = {
  high:   { label: '高能量', color: '#F0AE64', representative: 'happy' },     // 快樂 / 激動 / 憤怒
  steady: { label: '能量平穩', color: '#7BA88C', representative: 'calm' },    // 平靜 / 滿足 / 一般
  low:    { label: '低能量', color: '#8FA5D1', representative: 'sad' },       // 悲傷 / 疲憊 / 無力
};

// Map each emotion key to its energy level
export const ENERGY_BY_KEY: Record<string, EnergyLevel> = {
  // 高能量 · 正面激動 · 負面激動
  happy: 'high', excited: 'high', empowered: 'high', proud: 'high',
  hopeful: 'high', grateful: 'high', loved: 'high', supported: 'high',
  angry: 'high', irritated: 'high', frustrated: 'high',
  anxious: 'high', worried: 'high', nervous: 'high', restless: 'high',
  scared: 'high', 'in-pain': 'high', 'in-agony': 'high', uneasy: 'high',

  // 能量平穩 · 中性 · 溫和
  calm: 'steady', peaceful: 'steady', content: 'steady', free: 'steady',
  foggy: 'steady', questioning: 'steady', blank: 'steady',
  awkward: 'steady',

  // 低能量 · 抑鬱 · 疲累 · 無力
  sad: 'low', lonely: 'low', hopeless: 'low', unloved: 'low',
  ashamed: 'low', insecure: 'low', trapped: 'low', suppressed: 'low',
  unappreciated: 'low', unmotivated: 'low', tired: 'low', drained: 'low',
  overwhelmed: 'low', numb: 'low',
};

// Any emotion not explicitly mapped defaults to 'steady'
export function getEnergyLevel(key: string): EnergyLevel {
  return ENERGY_BY_KEY[key] || 'steady';
}

// Get representative bowl per level (fallback to first found)
export function getEnergyBowlKey(level: EnergyLevel): string {
  const rep = ENERGY_META[level].representative;
  const found = EMOTIONS.find((e) => e.key === rep);
  return found ? found.key : EMOTIONS[0].key;
}
