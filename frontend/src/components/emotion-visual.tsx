import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { Ellipse, Path, Svg } from 'react-native-svg';

import { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS } from '@/src/constants/theme';

type Props = {
  emotion?: Emotion | null;
  size: number;
  radius?: number;
  style?: ViewStyle;
};

/** Metro `require()` ids break inside RN-web Modals unless we resolve a URI. */
export function resolveEmotionImageSource(image: unknown): ImageSourcePropType | null {
  if (image == null) return null;
  if (typeof image === 'number') {
    const resolved =
      typeof Image.resolveAssetSource === 'function'
        ? Image.resolveAssetSource(image)
        : null;
    if (resolved?.uri) return { uri: resolved.uri };
    return image;
  }
  if (typeof image === 'object' && image && 'uri' in image && typeof (image as { uri?: string }).uri === 'string') {
    return image as ImageSourcePropType;
  }
  return image as ImageSourcePropType;
}

function BowlSilhouette({ size, color }: { size: number; color: string }) {
  return (
    <Svg height={size} viewBox="0 0 40 40" width={size}>
      <Ellipse cx="20" cy="26" fill={color} opacity={0.95} rx="13" ry="7" />
      <Path d="M9 24 C9 15 31 15 31 24" fill={color} />
      <Ellipse cx="20" cy="16" fill="#FFFDF6" opacity={0.55} rx="8" ry="3" />
    </Svg>
  );
}

/**
 * Emotion PNG mascot. Never clip the bowl into a circle.
 * If the PNG is missing, show a bowl silhouette — not a Feather circle.
 */
export function EmotionVisual({ emotion, size, radius, style }: Props) {
  const source = useMemo(
    () => resolveEmotionImageSource(emotion?.image),
    [emotion?.image],
  );

  if (!emotion) return null;

  if (source) {
    return (
      <Image
        accessibilityLabel={emotion.label}
        source={source}
        resizeMode="contain"
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  const r = radius ?? RADIUS.sm;
  if (emotion.icon) {
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
          name={emotion.icon as 'circle'}
          size={iconSize}
          color={emotion.iconTint || COLORS.textPrimary}
        />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, overflow: 'visible' }, style]}>
      <BowlSilhouette color={emotion.color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
});
