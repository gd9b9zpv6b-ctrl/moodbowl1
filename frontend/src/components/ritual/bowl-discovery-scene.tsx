import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
    title: '淋水俾小花',
    instruction: '揀一塊泥土淋水 · 碗會慢慢出嚟',
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
      <View style={styles.bowlVisual} pointerEvents="none">
        <EmotionVisual emotion={emotion} size={92} />
      </View>
      <Text style={styles.bowlCaption}>{emotion.label}</Text>
    </Pressable>
  );
}

function GardenBed({
  items,
  accent,
  onChoose,
}: {
  items: Emotion[];
  accent: string;
  onChoose: (emotion: Emotion) => void;
}) {
  const [wateredKeys, setWateredKeys] = useState<string[]>([]);
  const [wateringKey, setWateringKey] = useState<string | null>(null);
  const [waterTarget, setWaterTarget] = useState({ fromRight: false, x: 0 });
  const [fieldWidth, setFieldWidth] = useState(320);
  const waterPour = useRef(new Animated.Value(0)).current;
  const itemKey = items.map((item) => item.key).join('|');

  useEffect(() => {
    setWateredKeys([]);
    setWateringKey(null);
    waterPour.stopAnimation();
    waterPour.setValue(0);
  }, [itemKey, waterPour]);

  const waterPatch = (emotionKey: string, index: number) => {
    if (wateringKey || wateredKeys.includes(emotionKey)) return;
    const col = index % 3;
    const fromRight = col >= 2;
    const patchCenter = ((col + 0.5) * fieldWidth) / 3;
    const streamOrigin = fieldWidth / 2 + (fromRight ? 40 : -40);
    setWateringKey(emotionKey);
    setWaterTarget({ fromRight, x: patchCenter - streamOrigin });
    waterPour.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(waterPour, {
        toValue: 1,
        duration: 1450,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setWateredKeys((current) =>
            current.includes(emotionKey) ? current : [...current, emotionKey],
          );
        }
        setWateringKey(null);
        waterPour.setValue(0);
      });
    });
  };

  return (
    <View
      style={styles.gardenScene}
      onLayout={(event) => setFieldWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        testID="watering-can"
        pointerEvents="none"
        style={[
          styles.wateringCan,
          {
            transform: [
              {
                translateX: waterPour.interpolate({
                  inputRange: [0, 0.26, 0.86, 1],
                  outputRange: [0, waterTarget.x, waterTarget.x, 0],
                }),
              },
              {
                translateY: waterPour.interpolate({
                  inputRange: [0, 0.26, 0.86, 1],
                  outputRange: [0, 5, 5, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.canDrawing,
            {
              transform: [
                { scaleX: waterTarget.fromRight ? -1 : 1 },
                {
                  rotate: waterPour.interpolate({
                    inputRange: [0, 0.3, 0.42, 0.86, 1],
                    outputRange: waterTarget.fromRight
                      ? ['0deg', '0deg', '14deg', '14deg', '0deg']
                      : ['0deg', '0deg', '-14deg', '-14deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.canHandle, { borderColor: accent }]} />
          <View style={[styles.canBody, { backgroundColor: accent }]}>
            <View style={styles.canHighlight} />
          </View>
          <View style={[styles.canSpout, { backgroundColor: accent }]} />
          <View style={[styles.canRose, { backgroundColor: accent }]} />
        </Animated.View>
        <Text style={styles.waterCount}>
          {wateredKeys.length} / {items.length}
        </Text>
        <View style={[styles.waterStream, waterTarget.fromRight && styles.waterStreamFromRight]}>
          {[0, 1, 2].map((drop) => (
            <Animated.View
              key={drop}
              testID={`water-drop-${drop}`}
              style={[
                styles.waterDrop,
                {
                  left: drop * 12,
                  opacity: waterPour.interpolate({
                    inputRange: [0, 0.4 + drop * 0.04, 0.82, 0.92, 1],
                    outputRange: [0, 0, 1, 0, 0],
                  }),
                  transform: [
                    {
                      translateY: waterPour.interpolate({
                        inputRange: [0, 0.4, 0.9, 1],
                        outputRange: [0, 0, 74 + drop * 7, 82 + drop * 7],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      <View style={styles.gardenSearchField}>
        {items.map((item, index) => {
          const found = wateredKeys.includes(item.key);
          return (
            <Pressable
              key={item.key}
              testID={found ? `bowl-discover-${item.key}` : `garden-patch-${item.key}`}
              accessibilityRole="button"
              accessibilityLabel={found ? item.label : '等緊淋水嘅泥土'}
              disabled={Boolean(wateringKey) && !found}
              onPress={() => {
                if (found) onChoose(item);
                else waterPatch(item.key, index);
              }}
              style={[styles.gardenPatch, found && { borderColor: accent }]}
            >
              {found ? (
                <>
                  <EmotionVisual emotion={item} size={72} />
                  <Text style={styles.bowlCaption}>{item.label}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.seedling}>🌱</Text>
                  <View style={styles.gardenSoil} />
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
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
        <GardenBed items={items} accent={discovery.accent} onChoose={onChoose} />
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
    minHeight: 220,
    overflow: 'visible',
    paddingTop: 88,
  },
  wateringCan: {
    alignItems: 'center',
    height: 105,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  canDrawing: { height: 54, position: 'relative', width: 100 },
  canBody: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 42,
    position: 'absolute',
    right: 7,
    top: 8,
    width: 52,
  },
  canHighlight: {
    backgroundColor: '#FFFFFF55',
    borderRadius: RADIUS.pill,
    height: 27,
    left: 9,
    position: 'absolute',
    top: 7,
    width: 7,
  },
  canHandle: {
    borderRadius: RADIUS.pill,
    borderWidth: 6,
    height: 40,
    position: 'absolute',
    right: -5,
    top: 2,
    width: 35,
  },
  canSpout: {
    borderRadius: RADIUS.pill,
    height: 10,
    left: 9,
    position: 'absolute',
    top: 23,
    transform: [{ rotate: '-18deg' }],
    width: 48,
  },
  canRose: {
    borderRadius: RADIUS.pill,
    height: 23,
    left: 0,
    position: 'absolute',
    top: 15,
    transform: [{ rotate: '-18deg' }],
    width: 13,
  },
  waterStream: {
    height: 82,
    left: 2,
    position: 'absolute',
    top: 33,
    width: 42,
  },
  waterStreamFromRight: {
    left: 'auto',
    right: 2,
  },
  waterDrop: {
    backgroundColor: '#74BDE0',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    height: 12,
    position: 'absolute',
    top: 0,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },
  waterCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  gardenSearchField: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    overflow: 'visible',
  },
  gardenPatch: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    justifyContent: 'flex-end',
    minHeight: 118,
    paddingBottom: 8,
    width: 104,
  },
  seedling: { fontSize: 28, marginBottom: -4, zIndex: 2 },
  gardenSoil: {
    backgroundColor: '#BFA17D',
    borderRadius: RADIUS.pill,
    height: 16,
    width: 56,
  },
});
