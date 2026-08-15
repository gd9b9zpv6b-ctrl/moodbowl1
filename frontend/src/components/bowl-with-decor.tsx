import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import {
  BOWL_DECOR_BY_KEY,
  type PlacedDecoration,
} from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS } from '@/src/constants/theme';

type Props = {
  emotion?: Emotion | null;
  size: number;
  radius?: number;
  decorations?: PlacedDecoration[];
  style?: ViewStyle;
  /** When set · tap empty bowl area to place the pending decoration. */
  onPlace?: (xPct: number, yPct: number) => void;
  /** Tap an existing sticker to remove it. */
  onRemoveAt?: (index: number) => void;
  /** Show dashed empty bowl when no emotion art. */
  empty?: boolean;
  /** Highlight that placement mode is active. */
  placing?: boolean;
};

/**
 * Bowl mascot with decoration stickers at user-chosen positions.
 */
export function BowlWithDecor({
  emotion,
  size,
  radius,
  decorations = [],
  style,
  onPlace,
  onRemoveAt,
  empty,
  placing,
}: Props) {
  const r = radius ?? RADIUS.sm;
  const emojiSize = Math.max(18, Math.round(size * 0.18));
  const interactive = !!(onPlace || onRemoveAt);
  const Wrap = interactive ? Pressable : View;

  const handlePlace = (locationX: number, locationY: number) => {
    if (!onPlace) return;
    const xPct = (locationX / size) * 100;
    const yPct = (locationY / size) * 100;
    onPlace(xPct, yPct);
  };

  return (
    <Wrap
      {...(interactive
        ? {
            onPress: (e: { nativeEvent: { locationX: number; locationY: number } }) => {
              if (!onPlace) return;
              handlePlace(e.nativeEvent.locationX, e.nativeEvent.locationY);
            },
            accessibilityLabel: placing ? '撳呢度放飾品' : '碗',
          }
        : { accessibilityLabel: '碗' })}
      style={[
        { width: size, height: size },
        placing && styles.placingRing,
        style,
      ]}
    >
      {emotion && !empty ? (
        <EmotionVisual emotion={emotion} size={size} radius={r} />
      ) : (
        <View
          style={[
            styles.emptyBowl,
            { width: size, height: size, borderRadius: r },
          ]}
        />
      )}
      {decorations.map((placed, i) => {
        const decor = BOWL_DECOR_BY_KEY[placed.key];
        if (!decor) return null;
        const sticker = (
          <Text
            pointerEvents="none"
            style={{
              fontSize: emojiSize,
              lineHeight: emojiSize + 4,
            }}
          >
            {decor.emoji}
          </Text>
        );
        if (onRemoveAt) {
          return (
            <Pressable
              key={`${placed.key}-${i}-${placed.x}-${placed.y}`}
              testID={`decor-sticker-${i}`}
              onPress={(e) => {
                onRemoveAt(i);
              }}
              hitSlop={8}
              style={[
                styles.sticker,
                {
                  left: `${placed.x}%`,
                  top: `${placed.y}%`,
                  marginLeft: -emojiSize / 2,
                  marginTop: -emojiSize / 2,
                },
              ]}
              accessibilityLabel={`移除${decor.label}`}
            >
              {sticker}
            </Pressable>
          );
        }
        return (
          <View
            key={`${placed.key}-${i}-${placed.x}-${placed.y}`}
            pointerEvents="none"
            style={[
              styles.sticker,
              {
                left: `${placed.x}%`,
                top: `${placed.y}%`,
                marginLeft: -emojiSize / 2,
                marginTop: -emojiSize / 2,
              },
            ]}
          >
            {sticker}
          </View>
        );
      })}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
    zIndex: 2,
  },
  emptyBowl: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  placingRing: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
