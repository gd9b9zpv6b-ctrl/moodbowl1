export type SoupKey =
  | 'hot_milk_tea'
  | 'cold_lemon_tea'
  | 'curry'
  | 'plain_congee'
  | 'sweet_soup'
  | 'no_appetite';

export type SoupDef = {
  key: SoupKey;
  emoji: string;
  label: string;
  subLower: string;
  subUpper: string;
};

export const SOUPS: SoupDef[] = [
  {
    key: 'hot_milk_tea',
    emoji: '🍵',
    label: '熱奶茶',
    subLower: '舒服 warm warm',
    subUpper: '想 hug 一下嗰種暖暖地',
  },
  {
    key: 'cold_lemon_tea',
    emoji: '🥤',
    label: '凍檸茶',
    subLower: '淡淡地',
    subUpper: '心裡面有啲距離感',
  },
  {
    key: 'curry',
    emoji: '🍛',
    label: '咖喱',
    subLower: '熱辣辣 有火',
    subUpper: '有嘢頂住 · 想爆',
  },
  {
    key: 'plain_congee',
    emoji: '🥣',
    label: '白粥',
    subLower: '冇特別',
    subUpper: '空落落嘅感覺',
  },
  {
    key: 'sweet_soup',
    emoji: '🍨',
    label: '甜湯',
    subLower: '好想食甜嘢',
    subUpper: '想 celebrate 啲嘢',
  },
  {
    key: 'no_appetite',
    emoji: '🍽️',
    label: '唔想食',
    subLower: '冇胃口',
    subUpper: '吞唔落嘅感覺',
  },
];

export const SOUP_BY_KEY: Record<SoupKey, SoupDef> = SOUPS.reduce(
  (acc, s) => {
    acc[s.key] = s;
    return acc;
  },
  {} as Record<SoupKey, SoupDef>,
);
