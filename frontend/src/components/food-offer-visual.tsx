import { Image, Text } from 'react-native';

import type { SoupDef } from '@/src/constants/soups';

type Props = {
  food: SoupDef;
  size?: number;
};

/** Food card / offer visual · PNG when we have one, emoji otherwise. */
export function FoodOfferVisual({ food, size = 40 }: Props) {
  if (food.image) {
    return (
      <Image
        accessibilityLabel={food.label}
        source={food.image}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Text accessibilityLabel={food.label} style={{ fontSize: Math.round(size * 0.85) }}>
      {food.emoji}
    </Text>
  );
}
