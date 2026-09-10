import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY, type Emotion, type EmotionCategory } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type DiscoveryKey = EmotionCategory;

type DiscoveryConfig = {
  key: DiscoveryKey;
  label: string;
  title: string;
  instruction: string;
  emotionKey: string;
  tint: string;
  accent: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

export const DISCOVERIES: DiscoveryConfig[] = [
  {
    key: 'anger',
    label: '憤怒',
    title: '輕輕放走個波',
    instruction: '撳你似嘅碗',
    emotionKey: 'angry',
    tint: '#FFF0EC',
    accent: '#E98D83',
    icon: 'circle',
  },
  {
    key: 'nervous',
    label: '緊張',
    title: '沙裏面嘅碗',
    instruction: '撳你似嘅碗',
    emotionKey: 'anxious',
    tint: '#FFF7E9',
    accent: '#D9B46E',
    icon: 'wind',
  },
  {
    key: 'sad',
    label: '悲傷',
    title: '雨裏面嘅碗',
    instruction: '撳你似嘅碗',
    emotionKey: 'sad',
    tint: '#EEF4FF',
    accent: '#7E9ED6',
    icon: 'cloud-rain',
  },
  {
    key: 'wound',
    label: '受傷',
    title: '池裏面嘅碗',
    instruction: '撳你似嘅碗',
    emotionKey: 'ashamed',
    tint: '#F3F7FF',
    accent: '#8AA4D6',
    icon: 'heart',
  },
  {
    key: 'unspoken',
    label: '講唔出',
    title: '霧裏面嘅碗',
    instruction: '撳你似嘅碗',
    emotionKey: 'foggy',
    tint: '#F4F1FF',
    accent: '#A999D6',
    icon: 'cloud',
  },
  {
    key: 'warm',
    label: '溫暖',
    title: '花圃裏面嘅碗',
    instruction: '撳你似嘅碗',
    emotionKey: 'happy',
    tint: '#FFF6EA',
    accent: '#E2B36A',
    icon: 'sun',
  },
];

function floatLoop(value: Animated.Value, toValue: number, duration: number, delay = 0) {
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue,
        duration,
        delay,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  ).start();
}

function BowlTile({
  emotion,
  onChoose,
  variant,
}: {
  emotion: Emotion;
  onChoose: (emotion: Emotion) => void;
  variant: DiscoveryKey;
}) {
  return (
    <Pressable
      testID={`bowl-discover-${emotion.key}`}
      accessibilityRole="button"
      accessibilityLabel={emotion.label}
      onPress={() => onChoose(emotion)}
      style={[styles.bowlSlot, variant === 'anger' && styles.balloonSlot]}
    >
      {variant === 'anger' ? (
        <View style={styles.balloonShell} pointerEvents="none">
          <View style={styles.balloonGlow} />
          <View style={styles.balloonBody} />
          <View style={styles.balloonKnot} />
          <View style={styles.balloonString} />
        </View>
      ) : null}
      {variant === 'wound' ? (
        <View pointerEvents="none" style={styles.fishEmojiWrap}>
          <Text style={styles.fishEmoji}>🐠</Text>
        </View>
      ) : null}
      {variant === 'warm' ? (
        <View pointerEvents="none" style={styles.seedEmojiWrap}>
          <Text style={styles.seedEmoji}>🌱</Text>
        </View>
      ) : null}
      <View style={styles.bowlVisual} pointerEvents="none">
        <EmotionVisual emotion={emotion} size={92} />
      </View>
      <Text style={styles.bowlCaption}>{emotion.label}</Text>
    </Pressable>
  );
}

export function BowlDiscoveryScene({
  category,
  emotions,
  onChoose,
}: {
  category: EmotionCategory;
  emotions: Emotion[];
  onChoose: (emotion: Emotion) => void;
}) {
  const discovery = DISCOVERIES.find((item) => item.key === category) ?? DISCOVERIES[4];
  const hero = EMOTION_BY_KEY[discovery.emotionKey];
  const items = emotions.length ? emotions : hero ? [hero] : [];
  const drift = useRef(new Animated.Value(0)).current;
  const rain = useRef(new Animated.Value(0)).current;
  const mist = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    floatLoop(drift, 8, 2200);
    Animated.loop(
      Animated.timing(rain, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    floatLoop(mist, 10, 2800);
  }, [drift, rain, mist]);

  return (
    <View style={[styles.scene, { backgroundColor: discovery.tint }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${discovery.accent}22` }]}>
          <Feather name={discovery.icon} size={16} color={discovery.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{discovery.label}</Text>
          <Text style={styles.title}>{discovery.title}</Text>
        </View>
      </View>
      <Text style={styles.instruction}>{discovery.instruction}</Text>

      {discovery.key === 'anger' ? (
        <View style={styles.balloonField}>
          {items.map((item) => (
            <BowlTile key={item.key} emotion={item} onChoose={onChoose} variant="anger" />
          ))}
        </View>
      ) : null}

      {discovery.key === 'nervous' || discovery.key === 'sad' || discovery.key === 'unspoken' ? (
        <View style={styles.coverSearchField}>
          {discovery.key === 'sad'
            ? [0, 1, 2, 3, 4].map((drop) => (
                <Animated.View
                  key={drop}
                  pointerEvents="none"
                  style={[
                    styles.rainDrop,
                    {
                      left: 18 + drop * 56,
                      transform: [
                        {
                          translateY: rain.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 220],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))
            : null}
          {discovery.key === 'unspoken' ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.mist,
                {
                  opacity: mist.interpolate({ inputRange: [0, 10], outputRange: [0.18, 0.42] }),
                  transform: [{ translateX: mist }],
                },
              ]}
            />
          ) : null}
          {items.map((item, index) => (
            <View key={item.key} style={styles.coverSearchSlot}>
              {discovery.key === 'nervous' ? (
                <View
                  pointerEvents="none"
                  style={[styles.sandPatch, index % 2 ? styles.sandPatchAlt : null]}
                />
              ) : null}
              {discovery.key === 'sad' ? <View pointerEvents="none" style={styles.puddle} /> : null}
              {discovery.key === 'unspoken' ? <View pointerEvents="none" style={styles.fogPatch} /> : null}
              <BowlTile emotion={item} onChoose={onChoose} variant={discovery.key} />
            </View>
          ))}
        </View>
      ) : null}

      {discovery.key === 'wound' ? (
        <View style={styles.fishPond}>
          <Animated.View
            pointerEvents="none"
            style={[styles.pondWater, { transform: [{ translateY: drift }] }]}
          />
          {items.map((item) => (
            <BowlTile key={item.key} emotion={item} onChoose={onChoose} variant="wound" />
          ))}
        </View>
      ) : null}

      {discovery.key === 'warm' ? (
        <View style={styles.gardenScene}>
          <View style={styles.soilBed} pointerEvents="none" />
          {items.map((item) => (
            <BowlTile key={item.key} emotion={item} onChoose={onChoose} variant="warm" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    gap: 10,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  instruction: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  balloonField: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    minHeight: 168,
  },
  balloonSlot: {
    width: 108,
    minHeight: 148,
  },
  balloonShell: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 4,
  },
  balloonGlow: {
    position: 'absolute',
    top: 10,
    width: 78,
    height: 90,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  balloonBody: {
    width: 78,
    height: 90,
    borderRadius: 39,
    backgroundColor: 'rgba(255,184,168,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(233,141,131,0.45)',
  },
  balloonKnot: {
    width: 10,
    height: 8,
    backgroundColor: 'rgba(233,141,131,0.7)',
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  balloonString: {
    width: 1.5,
    height: 28,
    backgroundColor: 'rgba(120,90,80,0.35)',
    marginTop: 2,
  },
  bowlSlot: {
    width: 112,
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  bowlVisual: {
    zIndex: 2,
  },
  bowlCaption: {
    marginTop: 2,
    zIndex: 2,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fishEmojiWrap: {
    position: 'absolute',
    top: 8,
  },
  fishEmoji: {
    fontSize: 22,
    opacity: 0.55,
  },
  seedEmojiWrap: {
    position: 'absolute',
    top: 10,
  },
  seedEmoji: {
    fontSize: 20,
    opacity: 0.7,
  },
  coverSearchField: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    minHeight: 168,
    overflow: 'visible',
  },
  coverSearchSlot: {
    width: 112,
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sandPatch: {
    position: 'absolute',
    width: 104,
    height: 48,
    borderRadius: 28,
    backgroundColor: 'rgba(214,176,112,0.28)',
    bottom: 18,
  },
  sandPatchAlt: {
    backgroundColor: 'rgba(196,154,90,0.24)',
    transform: [{ rotate: '-6deg' }],
  },
  puddle: {
    position: 'absolute',
    width: 96,
    height: 28,
    borderRadius: 16,
    backgroundColor: 'rgba(140,176,230,0.22)',
    bottom: 22,
  },
  fogPatch: {
    position: 'absolute',
    width: 108,
    height: 70,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.28)',
    bottom: 24,
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(140,176,230,0.45)',
    zIndex: 3,
  },
  mist: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 1,
  },
  fishPond: {
    position: 'relative',
    minHeight: 176,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    overflow: 'visible',
  },
  pondWater: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(186,214,255,0.45)',
    borderRadius: RADIUS.md,
  },
  gardenScene: {
    position: 'relative',
    minHeight: 176,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    overflow: 'visible',
  },
  soilBed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    backgroundColor: '#C4A574',
  },
});
