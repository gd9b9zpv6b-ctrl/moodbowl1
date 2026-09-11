import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { WatchWindowIcon } from '@/src/components/regulation/activity-icon';
import type { NSState } from '@/src/lib/ritual/state-detector';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

export const STATE_REACTION: Record<
  NSState,
  { emoji: string; tint: string; accent: string; feel: string; pulseMs: number }
> = {
  sympathetic_fire: {
    emoji: '🔥',
    tint: '#FFE4D6',
    accent: '#F97316',
    feel: '熱辣辣',
    pulseMs: 420,
  },
  dorsal_sad: {
    emoji: '🪟',
    tint: '#E0F2FE',
    accent: '#38BDF8',
    feel: '有啲重',
    pulseMs: 1400,
  },
  dorsal_freeze: {
    emoji: '🌫️',
    tint: '#F3F4F6',
    accent: '#9CA3AF',
    feel: '空空哋',
    pulseMs: 1800,
  },
  sympathetic_anxious: {
    emoji: '🌪️',
    tint: '#FEF3C7',
    accent: '#F59E0B',
    feel: '掛住跳',
    pulseMs: 520,
  },
  ventral_regulated: {
    emoji: '🌈',
    tint: '#DCFCE7',
    accent: '#34D399',
    feel: '暖暖地',
    pulseMs: 1100,
  },
  unspoken: {
    emoji: '🌙',
    tint: '#EDE9FE',
    accent: '#A78BFA',
    feel: '淡淡地',
    pulseMs: 1300,
  },
};

type Props = {
  state: NSState;
  title: string;
  subtitle: string;
};

/**
 * Loud visual reaction so kids feel the app “sees” their state.
 */
export function RegulateStateStage({ state, title, subtitle }: Props) {
  const meta = STATE_REACTION[state];
  const pulse = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.setValue(1);
    bob.setValue(0);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: meta.pulseMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: meta.pulseMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: meta.pulseMs * 1.2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: meta.pulseMs * 1.2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    bobLoop.start();
    return () => {
      pulseLoop.stop();
      bobLoop.stop();
    };
  }, [state, meta.pulseMs, pulse, bob]);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, state === 'sympathetic_fire' || state === 'sympathetic_anxious' ? -8 : -4],
  });

  return (
    <View
      testID={`regulate-stage-${state}`}
      style={[styles.stage, { backgroundColor: meta.tint, borderColor: meta.accent }]}
    >
      <Text style={[styles.feelChip, { backgroundColor: meta.accent }]}>
        碗 feel 到 · {meta.feel}
      </Text>
      <Animated.View
        style={[
          styles.mark,
          { transform: [{ scale: pulse }, { translateY }] },
        ]}
      >
        {state === 'dorsal_sad' ? (
          <WatchWindowIcon size={72} />
        ) : (
          <Text style={styles.emoji}>{meta.emoji}</Text>
        )}
      </Animated.View>
      <Text testID="regulate-state-title" style={styles.title}>
        {title}
      </Text>
      <Text testID="regulate-state-sub" style={styles.sub}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  feelChip: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    minHeight: 72,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 30,
  },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
});
