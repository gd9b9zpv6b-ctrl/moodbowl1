import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { BOWL_DECOR_BY_KEY } from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { RADIUS } from '@/src/constants/theme';

type Props = {
  emotion?: Emotion | null;
  size: number;
  radius?: number;
  decorations?: string[];
  style?: ViewStyle;
};

/** Fixed sticker slots around the bowl preview. */
const SLOTS: { top: string; left: string; rotate: string }[] = [
  { top: '6%', left: '12%', rotate: '-12deg' },
  { top: '4%', left: '62%', rotate: '10deg' },
  { top: '58%', left: '4%', rotate: '-6deg' },
  { top: '55%', left: '72%', rotate: '8deg' },
];

/**
 * Bowl mascot with optional decoration stickers overlaid on top.
 */
export function BowlWithDecor({ emotion, size, radius, decorations = [], style }: Props) {
  const r = radius ?? RADIUS.sm;
  const emojiSize = Math.max(18, Math.round(size * 0.18));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <EmotionVisual emotion={emotion} size={size} radius={r} />
      {decorations.slice(0, SLOTS.length).map((key, i) => {
        const decor = BOWL_DECOR_BY_KEY[key];
        if (!decor) return null;
        const slot = SLOTS[i];
        return (
          <Text
            key={`${key}-${i}`}
            pointerEvents="none"
            style={[
              styles.sticker,
              {
                top: slot.top as any,
                left: slot.left as any,
                fontSize: emojiSize,
                transform: [{ rotate: slot.rotate }],
              },
            ]}
          >
            {decor.emoji}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
    zIndex: 2,
  },
});
