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
  /** Recolors the mascot itself (hue/sat) instead of laying a wash on top. */
  colorTint?: string | null;
};

function hasTint(hex?: string | null): hex is string {
  return !!hex && hex !== '#FFFFFF';
}

/**
 * Renders an emotion's PNG mascot when one exists, otherwise falls back to a
 * Feather icon inside a coloured circle. Keeps every emotion visually usable
 * even before the rice-bowl mascot for it has been generated.
 *
 * When `colorTint` is set, the bowl art is recolored with mix-blend `color`
 * so shading / outlines stay from the original — not a translucent overlay.
 * Android uses a softer opacity so a missing blend never fully covers the art.
 */
export function EmotionVisual({ emotion, size, radius, style, colorTint }: Props) {
  if (!emotion) return null;
  const r = radius ?? RADIUS.sm;
  const tint = hasTint(colorTint) ? colorTint : null;

  if (emotion.image) {
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
              StyleSheet.absoluteFillObject,
              {
                borderRadius: r,
                backgroundColor: tint,
                // Recolor artwork: take hue/sat from tint, keep luminosity from PNG.
                mixBlendMode: 'color' as const,
                // If blend is unavailable on some Android builds, stay translucent.
                opacity: Platform.OS === 'android' ? 0.55 : 1,
              },
            ]}
          />
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
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
