import type { AgeGroup } from './ritual-store';

type AgeStringBag = {
  soup_title: string;
  body_title: string;
  pick_title: string;
  diary_placeholder: string;
};

export const AGE_STRINGS: Record<AgeGroup, AgeStringBag> = {
  lower: {
    soup_title: '你今日想食咩湯?',
    body_title: '碗身體邊度有 feel?',
    pick_title: '你今日似邊個? 揀一個',
    diary_placeholder: '打幾隻字都得',
  },
  upper: {
    soup_title: '你今日想食邊碗湯?',
    body_title: '望下你嘅身體 · 邊度有 feel? 揀最多 3 樣',
    pick_title: '你今日似邊個? 揀一個',
    diary_placeholder: '一個字都得 · 或者好長都 ok',
  },
};

export function soupTitleForAge(ageGroup: AgeGroup): string {
  return AGE_STRINGS[ageGroup].soup_title;
}

export function bodyTitleForAge(ageGroup: AgeGroup): string {
  return AGE_STRINGS[ageGroup].body_title;
}

export function pickTitleForAge(ageGroup: AgeGroup): string {
  return AGE_STRINGS[ageGroup].pick_title;
}

export function diaryPlaceholderForAge(ageGroup: AgeGroup): string {
  return AGE_STRINGS[ageGroup].diary_placeholder;
}
