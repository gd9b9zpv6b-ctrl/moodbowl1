export type SoupKey =
  | 'strawberry_milk'
  | 'marble_soda'
  | 'lemon_juice'
  | 'spicy_ginger'
  | 'bitter_tea'
  | 'warm_milk'
  | 'plain_water'
  | 'no_drink';

export type SoupDef = {
  key: SoupKey;
  emoji: string;
  label: string;
  /** Fallback subs · wording packs override per mode. */
  subLower: string;
  subUpper: string;
};

/**
 * Drink metaphors for the ritual check-in (replaces food/soup set).
 * Order is intentional · left-to-right energy arc then shut-down.
 */
export const SOUPS: SoupDef[] = [
  {
    key: 'strawberry_milk',
    emoji: '🍓',
    label: '草莓牛奶',
    subLower: '好甜 · 好滿足',
    subUpper: '今日有開心嘅事 · 好甜好滿足',
  },
  {
    key: 'marble_soda',
    emoji: '🫧',
    label: '彈珠汽水',
    subLower: '想跳跳紮',
    subUpper: '好興奮 · 成個人都想郁',
  },
  {
    key: 'lemon_juice',
    emoji: '🍋',
    label: '檸檬汁',
    subLower: '有啲委屈',
    subUpper: '少少煩惱 · 或者有啲唔順',
  },
  {
    key: 'spicy_ginger',
    emoji: '🌶️',
    label: '辣薑茶',
    subLower: '熱辣辣 · 有火',
    subUpper: '心裡面頂住 · 想爆一爆',
  },
  {
    key: 'bitter_tea',
    emoji: '☕',
    label: '苦熱茶',
    subLower: '好累 · 想休息',
    subUpper: '心情有啲沉重 · 需要唞一唞',
  },
  {
    key: 'warm_milk',
    emoji: '🥛',
    label: '熱牛奶',
    subLower: '暖暖地 · 好放心',
    subUpper: '好放鬆 · 覺得安心溫暖',
  },
  {
    key: 'plain_water',
    emoji: '💧',
    label: '白開水',
    subLower: '平平淡淡',
    subUpper: '冇特別開心亦冇唔開心',
  },
  {
    key: 'no_drink',
    emoji: '🚫',
    label: '唔想飲',
    subLower: '而家唔想',
    subUpper: '暫時咩都唔想入口',
  },
];

export const SOUP_BY_KEY: Record<SoupKey, SoupDef> = SOUPS.reduce(
  (acc, s) => {
    acc[s.key] = s;
    return acc;
  },
  {} as Record<SoupKey, SoupDef>,
);
