import type { BodyChipKey } from '@/src/constants/body-chips';
import {
  EMOTIONS,
  type Emotion,
  type EmotionCategory,
} from '@/src/constants/emotions';
import type { SoupKey } from '@/src/constants/soups';

const SOUP_CATEGORY_SCORES: Record<SoupKey, Partial<Record<EmotionCategory, number>>> = {
  strawberry_milk: { warm: 8, nervous: 1 },
  marble_soda: { warm: 6, nervous: 4 },
  lemon_juice: { sad: 5, wound: 4, unspoken: 2, nervous: 1 },
  spicy_ginger: { anger: 8, nervous: 3, wound: 2 },
  bitter_tea: { sad: 5, unspoken: 3, wound: 2, nervous: 1 },
  warm_milk: { warm: 8, unspoken: 2, sad: 1 },
  plain_water: { unspoken: 6, sad: 3, nervous: 1 },
  no_drink: { sad: 6, wound: 5, unspoken: 3, nervous: 1, anger: 1 },
};

const CHIP_BOWL_SCORES: Record<BodyChipKey, string[]> = {
  chest_warm: ['happy', 'content', 'loved', 'calm', 'peaceful', 'supported', 'grateful'],
  chest_tight: ['suppressed', 'overwhelmed', 'trapped', 'in-pain', 'hollow', 'sad'],
  heart_fast: ['anxious', 'angry', 'furious', 'scared', 'restless', 'overwhelmed', 'empowered'],
  belly_full: ['anxious', 'uneasy', 'worried', 'content'],
  head_heavy: ['exhausted', 'foggy', 'unmotivated', 'numb', 'overwhelmed'],
  want_jump: ['happy', 'empowered', 'free', 'proud', 'restless', 'content'],
  curled_up: ['lonely', 'empty', 'scared', 'abandoned', 'hollow', 'ashamed', 'sad'],
  teary: ['sad', 'lonely', 'in-pain', 'in-agony', 'unloved', 'misunderstood', 'guilty', 'abandoned'],
  soft_hands: ['exhausted', 'numb', 'overwhelmed', 'uneasy', 'anxious'],
  floaty: ['peaceful', 'free', 'calm', 'empty', 'foggy'],
};

type Scored = Emotion & { score: number };

function ensureDiversity(top5: Scored[], all: Scored[], minCats: number): Scored[] {
  const result = [...top5];
  const catsPresent = new Set(result.map((b) => b.category));
  if (catsPresent.size >= minCats) return result;

  const usedKeys = new Set(result.map((b) => b.key));
  const replacement = all.find(
    (b) => !usedKeys.has(b.key) && !catsPresent.has(b.category),
  );
  if (!replacement || result.length === 0) return result;

  result[result.length - 1] = replacement;
  return result;
}

function getTopCategories(scored: Scored[], n: number): EmotionCategory[] {
  const totals = new Map<EmotionCategory, number>();
  for (const b of scored) {
    totals.set(b.category, (totals.get(b.category) ?? 0) + b.score);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

export function scoreBowls(
  soup: SoupKey,
  chips: BodyChipKey[],
  recentBowlKeys: string[] = [],
): { default: Emotion[]; expanded: Emotion[] } {
  const recent = new Set(recentBowlKeys);

  const scored: Scored[] = EMOTIONS.map((bowl) => {
    let s = SOUP_CATEGORY_SCORES[soup][bowl.category] ?? 0;
    for (const chip of chips) {
      if (CHIP_BOWL_SCORES[chip]?.includes(bowl.key)) s += 5;
    }
    if (recent.has(bowl.key)) s -= 3;
    return { ...bowl, score: s };
  }).sort((a, b) => b.score - a.score);

  const hollow = scored.find((b) => b.key === 'hollow')!;
  const others = scored.filter((b) => b.key !== 'hollow');

  const default5 = ensureDiversity(others.slice(0, 5), others, 2);
  const defaultKeys = new Set(default5.map((b) => b.key));

  const topCategories = getTopCategories(scored, 2);
  const expanded12 = others
    .filter((b) => topCategories.includes(b.category))
    .filter((b) => !defaultKeys.has(b.key))
    .slice(0, 12);

  const strip = ({ score: _score, ...rest }: Scored): Emotion => rest;

  return {
    default: [...default5.map(strip), strip(hollow)],
    expanded: expanded12.map(strip),
  };
}
