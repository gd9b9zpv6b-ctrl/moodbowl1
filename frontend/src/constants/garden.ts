// 稻米種植 —— 純 emoji + 現有 mascot PNG，唔使新 AI 圖

export type PlotStage = 'empty' | 'seed' | 'sprout' | 'growing' | 'ready';

export type Plot = {
  id: number;
  stage: PlotStage;
  plantedAt?: number; // timestamp ms
  cropKey?: string; // 對應 EMOTIONS 嘅 key (成熟時揭曉)
};

export const PLOT_COUNT = 6;
export const HEART_COST = 3;

// 每個階段要幾耐（下一階段所需時間）
// Real: 24h. Demo: 3s. Total 3 stages = 3 日 / 9 秒。
export const STAGE_DURATION_MS = {
  real: 24 * 60 * 60 * 1000,
  demo: 3000,
};

export const STAGE_EMOJI: Record<PlotStage, string> = {
  empty: '➕',
  seed: '🫘',
  sprout: '🌱',
  growing: '🌾',
  ready: '🍚',
};

export const STAGE_LABEL: Record<PlotStage, string> = {
  empty: '空田',
  seed: '播種',
  sprout: '發芽',
  growing: '抽穗',
  ready: '成熟',
};

// 由於用戶隨機解鎖飯碗，我哋將所有現有 emotion key 當做「品種池」。
// 淨係要拎啲 label 好嘅（優先 warm 系列，其他都可以）。
export const HARVEST_POOL_KEYS = [
  'happy', 'content', 'grateful', 'hopeful', 'calm',
  'peaceful', 'loved', 'supported', 'proud', 'empowered',
  'free',
];

export function nextStage(s: PlotStage): PlotStage {
  switch (s) {
    case 'seed': return 'sprout';
    case 'sprout': return 'growing';
    case 'growing': return 'ready';
    default: return s;
  }
}

// 由播種時間+demo/real 模式，計出應該去到嘅階段
export function computeStage(plantedAt: number | undefined, demo: boolean): PlotStage {
  if (!plantedAt) return 'empty';
  const elapsed = Date.now() - plantedAt;
  const dur = demo ? STAGE_DURATION_MS.demo : STAGE_DURATION_MS.real;
  if (elapsed >= dur * 3) return 'ready';
  if (elapsed >= dur * 2) return 'growing';
  if (elapsed >= dur) return 'sprout';
  return 'seed';
}

export function timeToNextStage(plantedAt: number, demo: boolean): number {
  const dur = demo ? STAGE_DURATION_MS.demo : STAGE_DURATION_MS.real;
  const elapsed = Date.now() - plantedAt;
  const totalStages = 3;
  for (let i = 1; i <= totalStages; i++) {
    if (elapsed < dur * i) return dur * i - elapsed;
  }
  return 0;
}

export function pickRandomCropKey(): string {
  return HARVEST_POOL_KEYS[Math.floor(Math.random() * HARVEST_POOL_KEYS.length)];
}
