import type { BodyChipKey } from '@/src/constants/body-chips';
import {
  EMOTIONS,
  type Emotion,
  type EmotionCategory,
} from '@/src/constants/emotions';
import type { SoupKey } from '@/src/constants/soups';

/**
 * Drink (L1) is a soft projective prior — ambiguous between state vs craving.
 * Body chips (L2) are the clarifying signal and intentionally outweigh L1.
 */
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

/**
 * Somatic category pulls mapped from emotion→body guide:
 * anger / anxiety / sadness / joy / fatigue.
 */
const CHIP_CATEGORY_SCORES: Record<BodyChipKey, Partial<Record<EmotionCategory, number>>> = {
  // Anger
  face_flush: { anger: 5, nervous: 3, warm: 1 },
  jaw_clench: { anger: 7, nervous: 2 },
  fists_clench: { anger: 8, nervous: 1 },
  breath_fast: { anger: 6, nervous: 3 },
  heat_rising: { anger: 8, nervous: 2 },
  body_tense: { anger: 6, nervous: 3, wound: 1 },
  // Anxiety / fear
  heart_fast: { nervous: 7, anger: 2 },
  sweaty_palms: { nervous: 7 },
  belly_full: { nervous: 6, warm: 1 },
  shaky: { nervous: 7, wound: 1 },
  need_toilet: { nervous: 6 },
  // Sadness
  teary: { sad: 8, wound: 3 },
  throat_tight: { sad: 5, wound: 3, nervous: 2 },
  chest_tight: { sad: 5, wound: 4, unspoken: 2 },
  no_appetite: { sad: 6, unspoken: 3 },
  curled_up: { sad: 6, wound: 3, unspoken: 2 },
  // Joy / excitement
  chest_warm: { warm: 7 },
  want_jump: { warm: 6, nervous: 2 },
  smile_wide: { warm: 7 },
  eyes_bright: { warm: 7 },
  // Fatigue / burnout
  eyelids_heavy: { sad: 5, unspoken: 4 },
  head_heavy: { sad: 4, unspoken: 5 },
  shoulders_heavy: { sad: 5, unspoken: 3, wound: 2 },
  brain_blank: { unspoken: 6, sad: 3 },
  soft_hands: { sad: 4, unspoken: 4 },
  floaty: { warm: 2, unspoken: 5 },
};

const CHIP_BOWL_SCORES: Record<BodyChipKey, string[]> = {
  face_flush: ['angry', 'furious', 'awkward', 'ashamed', 'anxious', 'proud'],
  jaw_clench: ['angry', 'furious', 'irritable', 'frustrated', 'restless'],
  fists_clench: ['angry', 'furious', 'irritable', 'frustrated', 'offended'],
  breath_fast: ['angry', 'anxious', 'overwhelmed', 'furious', 'restless'],
  heat_rising: ['angry', 'furious', 'irritable', 'offended', 'empowered'],
  body_tense: ['angry', 'trapped', 'overwhelmed', 'anxious', 'irritable'],
  heart_fast: ['anxious', 'scared', 'restless', 'overwhelmed', 'empowered'],
  sweaty_palms: ['anxious', 'scared', 'uneasy', 'awkward', 'restless'],
  belly_full: ['anxious', 'uneasy', 'worried', 'scared'],
  shaky: ['anxious', 'scared', 'uneasy', 'restless', 'overwhelmed'],
  need_toilet: ['anxious', 'scared', 'uneasy', 'worried'],
  teary: ['sad', 'lonely', 'in-pain', 'in-agony', 'unloved', 'misunderstood', 'guilty', 'abandoned'],
  throat_tight: ['suppressed', 'sad', 'misunderstood', 'hollow', 'trapped'],
  chest_tight: ['suppressed', 'overwhelmed', 'trapped', 'in-pain', 'hollow', 'sad'],
  no_appetite: ['sad', 'empty', 'unmotivated', 'numb', 'hopeless'],
  curled_up: ['lonely', 'empty', 'scared', 'abandoned', 'hollow', 'ashamed', 'sad'],
  chest_warm: ['happy', 'content', 'loved', 'calm', 'peaceful', 'supported', 'grateful'],
  want_jump: ['happy', 'empowered', 'free', 'proud', 'restless', 'content'],
  smile_wide: ['happy', 'proud', 'grateful', 'content', 'loved', 'free'],
  eyes_bright: ['happy', 'hopeful', 'empowered', 'proud', 'content'],
  eyelids_heavy: ['exhausted', 'unmotivated', 'numb', 'foggy', 'hopeless'],
  head_heavy: ['exhausted', 'foggy', 'unmotivated', 'numb', 'overwhelmed'],
  shoulders_heavy: ['exhausted', 'overwhelmed', 'sad', 'unmotivated', 'suppressed', 'trapped'],
  brain_blank: ['foggy', 'blank', 'numb', 'empty', 'exhausted'],
  soft_hands: ['exhausted', 'numb', 'overwhelmed', 'uneasy', 'unmotivated'],
  floaty: ['peaceful', 'free', 'calm', 'empty', 'foggy', 'blank'],
};

/** When body chips are present, dampen food prior so craving ≠ state. */
const SOUP_WEIGHT_WITH_CHIPS = 0.35;
const SOUP_WEIGHT_SOLO = 1;
const CHIP_BOWL_BONUS = 8;

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
  const soupWeight = chips.length > 0 ? SOUP_WEIGHT_WITH_CHIPS : SOUP_WEIGHT_SOLO;

  const scored: Scored[] = EMOTIONS.map((bowl) => {
    let s = (SOUP_CATEGORY_SCORES[soup][bowl.category] ?? 0) * soupWeight;

    for (const chip of chips) {
      s += CHIP_CATEGORY_SCORES[chip][bowl.category] ?? 0;
      if (CHIP_BOWL_SCORES[chip]?.includes(bowl.key)) s += CHIP_BOWL_BONUS;
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
    .slice(0, 11);

  const defaultList = [...default5, hollow];
  const expanded = [...default5, ...expanded12].slice(0, 12);

  return { default: defaultList, expanded };
}

/**
 * Bowls shown inside a discovery scene.
 * Prefer the scored ritual shortlist so a body combo never opens empty;
 * fill from the rest of the family if the user switches category.
 */
export function discoveryBowlsForCategory(
  category: EmotionCategory,
  scored: { default: Emotion[]; expanded: Emotion[] },
  limit = 6,
): Emotion[] {
  const seen = new Set<string>();
  const out: Emotion[] = [];
  const push = (bowl: Emotion) => {
    if (bowl.category !== category || seen.has(bowl.key)) return;
    seen.add(bowl.key);
    out.push(bowl);
  };
  for (const bowl of scored.default) {
    push(bowl);
    if (out.length >= limit) return out;
  }
  for (const bowl of scored.expanded) {
    push(bowl);
    if (out.length >= limit) return out;
  }
  for (const bowl of EMOTIONS) {
    push(bowl);
    if (out.length >= limit) return out;
  }
  return out;
}
