import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS } from '@/src/constants/theme';

type Props = {
  emotion?: Emotion | null;
  size: number;
  radius?: number;
  style?: ViewStyle;
  /** Recolors the bowl body only · card background stays original. */
  colorTint?: string | null;
};

function hasTint(hex?: string | null): hex is string {
  return !!hex && hex !== '#FFFFFF';
}

/**
 * Fraction of the square art where the bowl character sits.
 * Tint is clipped to this oval so the baked-in card background keeps its color.
 */
const BOWL_MASK = {
  left: 0.14,
  top: 0.12,
  width: 0.72,
  height: 0.76,
} as const;

/**
 * Renders an emotion's PNG mascot when one exists, otherwise falls back to a
 * Feather icon inside a coloured circle.
 *
 * When `colorTint` is set, only the bowl character is recolored (mix-blend
 * `color` inside an oval mask). The original square background is unchanged.
 */
export function EmotionVisual({ emotion, size, radius, style, colorTint }: Props) {
  if (!emotion) return null;
  const r = radius ?? RADIUS.sm;
  const tint = hasTint(colorTint) ? colorTint : null;

  if (emotion.image) {
    const maskLeft = size * BOWL_MASK.left;
    const maskTop = size * BOWL_MASK.top;
    const maskW = size * BOWL_MASK.width;
    const maskH = size * BOWL_MASK.height;

    return (
      <View
        style={[
          styles.imageWrap,
          { width: size, height: size, borderRadius: r, isolation: 'isolate' as const },
          style,
        ]}
      >
        <Image
          source={emotion.image}
          style={{ width: size, height: size, borderRadius: r }}
        />
        {tint ? (
          <View
            pointerEvents="none"
            style={[
              styles.bowlMask,
              {
                left: maskLeft,
                top: maskTop,
                width: maskW,
                height: maskH,
                borderRadius: Math.min(maskW, maskH) / 2,
                isolation: 'isolate' as const,
              },
            ]}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: tint,
                // Recolor bowl art only: hue/sat from tint, luminosity from PNG.
                mixBlendMode: 'color' as const,
                // If blend is unavailable on some Android builds, stay translucent.
                opacity: Platform.OS === 'android' ? 0.55 : 1,
              }}
            />
          </View>
        ) : null}
      </View>
    );
  }

  const iconSize = Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.iconWrap,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: tint || emotion.color,
        },
        style,
      ]}
    >
      <Feather
        name={(emotion.icon as any) || 'circle'}
        size={iconSize}
        color={emotion.iconTint || COLORS.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowlMask: {
    position: 'absolute',
    overflow: 'hidden',
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
