import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS } from '@/src/constants/theme';

type Props = {
  emotion?: Emotion | null;
  size: number;
  radius?: number;
  style?: ViewStyle;
};

/**
 * Renders an emotion's PNG mascot when one exists, otherwise falls back to a
 * Feather icon inside a coloured circle. Keeps every emotion visually usable
 * even before the rice-bowl mascot for it has been generated.
 */
export function EmotionVisual({ emotion, size, radius, style }: Props) {
  if (!emotion) return null;
  const r = radius ?? RADIUS.sm;
  if (emotion.image) {
    return (
      <Image
        source={emotion.image}
        style={[{ width: size, height: size, borderRadius: r }, style]}
      />
    );
  }
  const iconSize = Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.iconWrap,
        { width: size, height: size, borderRadius: r, backgroundColor: emotion.color },
        style,
      ]}
    >
      <Feather name={(emotion.icon as any) || 'circle'} size={iconSize} color={COLORS.textPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
