import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import {
  BOWL_DECOR_BY_KEY,
  type PlacedDecoration,
} from '@/src/constants/bowl-decorations';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS } from '@/src/constants/theme';
import { tapToPct } from '@/src/lib/ritual/decor-tap';

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

function windowScroll() {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.scrollX || window.pageXOffset || 0,
    y: window.scrollY || window.pageYOffset || 0,
  };
}

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
  const boxRef = useRef<View>(null);

  const handlePlaceEvent = (e: GestureResponderEvent) => {
    if (!onPlace) return;
    const native = e.nativeEvent as GestureResponderEvent['nativeEvent'] & {
      clientX?: number;
      clientY?: number;
    };

    const apply = (box: { x: number; y: number; width: number; height: number }) => {
      const pct = tapToPct(native, box, windowScroll());
      onPlace(pct.x, pct.y);
    };

    boxRef.current?.measureInWindow((wx, wy, w, h) => {
      if (w > 0 && h > 0) {
        apply({ x: wx, y: wy, width: w, height: h });
        return;
      }
      apply({ x: 0, y: 0, width: size, height: size });
    });
  };

  return (
    <View
      ref={boxRef}
      collapsable={false}
      style={[
        styles.box,
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
        // While placing a new sticker, ignore taps on existing ones
        if (onRemoveAt && !placing) {
          return (
            <Pressable
              key={`${placed.key}-${i}-${placed.x}-${placed.y}`}
              testID={`decor-sticker-${i}`}
              onPress={() => onRemoveAt(i)}
              hitSlop={8}
              style={[
                styles.sticker,
                {
                  left: `${placed.x}%`,
                  top: `${placed.y}%`,
                  width: emojiSize,
                  height: emojiSize,
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
                width: emojiSize,
                height: emojiSize,
                marginLeft: -emojiSize / 2,
                marginTop: -emojiSize / 2,
              },
            ]}
          >
            {sticker}
          </View>
        );
      })}

      {interactive && onPlace ? (
        <Pressable
          testID="bowl-decor-place-surface"
          onPress={handlePlaceEvent}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={placing ? '撳呢度放飾品' : '碗'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
    overflow: 'visible',
  },
  sticker: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
