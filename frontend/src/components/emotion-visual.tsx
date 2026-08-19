import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

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
 * Feather icon inside a coloured circle.
 *
 * Use RN Image (not expo-image) so Metro-bundled PNGs stay visible on web
 * tunnels. Bowl art is never recolored — ritual “顏色” changes the backdrop.
 */
export function EmotionVisual({ emotion, size, radius, style }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [emotion?.key, emotion?.image]);

  if (!emotion) return null;
  const r = radius ?? RADIUS.sm;
  const showImage = !!emotion.image && !failed;

  if (showImage) {
    return (
      <Image
        accessibilityLabel={emotion.label}
        source={emotion.image}
        resizeMode="contain"
        onError={() => setFailed(true)}
        style={[{ width: size, height: size }, style]}
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
      <Feather
        name={(emotion.icon as any) || 'circle'}
        size={iconSize}
        color={emotion.iconTint || COLORS.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
