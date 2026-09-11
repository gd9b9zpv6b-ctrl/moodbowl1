import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY, EMOTIONS, type Emotion, type EmotionCategory } from '@/src/constants/emotions';
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
    instruction: '撳一下氣球 · 睇下藏住邊隻碗',
    emotionKey: 'angry',
    tint: '#FFF0EC',
    accent: '#E98D83',
    icon: 'circle',
  },
  {
    key: 'nervous',
    label: '緊張',
    title: '慢慢撥開啲沙',
    instruction: '撳一下沙堆 · 睇下藏住邊隻碗',
    emotionKey: 'anxious',
    tint: '#FFF7E9',
    accent: '#D9B46E',
    icon: 'wind',
  },
  {
    key: 'sad',
    label: '悲傷',
    title: '抹走窗上嘅雨',
    instruction: '撳一下雨點 · 睇下藏住邊隻碗',
    emotionKey: 'sad',
    tint: '#EEF4FF',
    accent: '#7E9ED6',
    icon: 'cloud-rain',
  },
  {
    key: 'wound',
    label: '受傷',
    title: '輕輕撈起一尾小金魚',
    instruction: '撳一下金魚 · 撈起先見到碗',
    emotionKey: 'ashamed',
    tint: '#F3F7FF',
    accent: '#8AA4D6',
    icon: 'heart',
  },
  {
    key: 'unspoken',
    label: '講唔出',
    title: '撥開眼前嘅霧',
    instruction: '撳一下霧團 · 睇下藏住邊隻碗',
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

function HideSeekField({
  items,
  variant,
  accent,
  onChoose,
}: {
  items: Emotion[];
  variant: DiscoveryKey;
  accent: string;
  onChoose: (emotion: Emotion) => void;
}) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [watering, setWatering] = useState(false);
  const [waterFromRight, setWaterFromRight] = useState(false);
  const [waterX, setWaterX] = useState(0);
  const [fieldWidth, setFieldWidth] = useState(320);
  const waterPour = useRef(new Animated.Value(0)).current;
  const itemKey = items.map((item) => item.key).join('|');

  useEffect(() => {
    setRevealed([]);
    setWatering(false);
    waterPour.stopAnimation();
    waterPour.setValue(0);
  }, [itemKey, variant, waterPour]);

  const reveal = (key: string) => {
    setRevealed((current) => (current.includes(key) ? current : [...current, key]));
  };

  const pourThenReveal = (key: string, index: number) => {
    if (watering || revealed.includes(key)) return;
    const col = index % 3;
    const fromRight = col >= 2;
    const patchCenter = ((col + 0.5) * fieldWidth) / 3;
    const streamOrigin = fieldWidth / 2 + (fromRight ? 40 : -40);
    setWatering(true);
    setWaterFromRight(fromRight);
    setWaterX(patchCenter - streamOrigin);
    waterPour.setValue(0);
    Animated.timing(waterPour, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      reveal(key);
      setWatering(false);
      waterPour.setValue(0);
    }, 420);
  };

  const onPressTile = (item: Emotion, index: number) => {
    if (revealed.includes(item.key)) {
      onChoose(item);
      return;
    }
    if (variant === 'warm') {
      pourThenReveal(item.key, index);
      return;
    }
    reveal(item.key);
  };

  const hiddenLabel =
    variant === 'anger'
      ? '氣球'
      : variant === 'nervous'
        ? '沙堆'
        : variant === 'sad'
          ? '雨點'
          : variant === 'wound'
            ? '小金魚'
            : variant === 'unspoken'
              ? '霧團'
              : '等緊淋水嘅泥土';

  return (
    <View
      style={variant === 'warm' ? styles.gardenScene : styles.field}
      onLayout={(event) => setFieldWidth(event.nativeEvent.layout.width)}
    >
      {variant === 'warm' ? (
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
                    outputRange: [0, waterX, waterX, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.canDrawing,
              { transform: [{ scaleX: waterFromRight ? -1 : 1 }] },
            ]}
          >
            <View style={[styles.canHandle, { borderColor: accent }]} />
            <View style={[styles.canBody, { backgroundColor: accent }]}>
              <View style={styles.canHighlight} />
            </View>
            <View style={[styles.canSpout, { backgroundColor: accent }]} />
            <View style={[styles.canRose, { backgroundColor: accent }]} />
          </View>
          <Text style={styles.waterCount}>
            {revealed.length} / {items.length}
          </Text>
        </Animated.View>
      ) : null}

      {variant === 'sad'
        ? [0, 1, 2, 3, 4].map((drop) => (
            <View
              key={drop}
              pointerEvents="none"
              style={[styles.rainDrop, { left: 18 + drop * 56 }]}
            />
          ))
        : null}

      <View style={styles.tileRow}>
        {items.map((item, index) => {
          const found = revealed.includes(item.key);
          return (
            <Pressable
              key={item.key}
              testID={found ? `bowl-discover-${item.key}` : `discover-hide-${variant}-${item.key}`}
              accessibilityRole="button"
              accessibilityLabel={found ? item.label : hiddenLabel}
              onPress={() => onPressTile(item, index)}
              style={[styles.hideTile, found && { borderColor: accent }]}
            >
              {found ? (
                <>
                  <EmotionVisual emotion={item} size={72} />
                  <Text style={styles.bowlCaption}>{item.label}</Text>
                </>
              ) : variant === 'anger' ? (
                <>
                  <View style={[styles.miniBalloon, { backgroundColor: `${item.color}E8` }]}>
                    <View style={styles.miniBalloonShine} />
                  </View>
                  <View style={[styles.miniBalloonKnot, { borderTopColor: item.color }]} />
                  <View style={styles.miniBalloonString} />
                </>
              ) : variant === 'nervous' ? (
                <>
                  <Text style={styles.hideEmoji}>🏜️</Text>
                  <View style={styles.sandMound} />
                </>
              ) : variant === 'sad' ? (
                <>
                  <Text style={styles.hideEmoji}>🌧️</Text>
                  <View style={styles.puddle} />
                </>
              ) : variant === 'wound' ? (
                <>
                  <Text style={styles.hideEmoji}>🐠</Text>
                  <Text style={styles.hideHint}>撳一下撈起</Text>
                </>
              ) : variant === 'unspoken' ? (
                <>
                  <View style={styles.fogBlob} />
                  <Text style={styles.hideHint}>撳開啲霧</Text>
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
  const family = EMOTIONS.filter((item) => item.category === category);
  const items = emotions.length ? emotions : hero ? [hero, ...family.filter((item) => item.key !== hero.key)].slice(0, 6) : family.slice(0, 6);

  return (
    <View testID={`bowl-discovery-${discovery.key}`} style={[styles.scene, { backgroundColor: discovery.tint }]}>
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
      {items.length === 0 ? (
        <Text style={styles.instruction}>呢個分類暫時未有碗 · 試下第二個</Text>
      ) : (
        <HideSeekField
          items={items}
          variant={discovery.key}
          accent={discovery.accent}
          onChoose={onChoose}
        />
      )}
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
  field: {
    position: 'relative',
    minHeight: 168,
    overflow: 'visible',
  },
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  hideTile: {
    width: 104,
    minHeight: 124,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(45, 49, 66, 0.06)',
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  bowlCaption: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  hideEmoji: {
    fontSize: 34,
    marginBottom: 6,
  },
  hideHint: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  miniBalloon: {
    width: 64,
    height: 74,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
  },
  miniBalloonShine: {
    marginTop: 12,
    width: 18,
    height: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  miniBalloonKnot: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  miniBalloonString: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(120,90,80,0.4)',
  },
  sandMound: {
    width: 72,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(214,176,112,0.85)',
  },
  puddle: {
    width: 72,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(140,176,230,0.55)',
  },
  fogBlob: {
    width: 78,
    height: 58,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(140,176,230,0.45)',
  },
  seedling: { fontSize: 28, marginBottom: -4, zIndex: 2 },
  gardenSoil: {
    backgroundColor: '#BFA17D',
    borderRadius: RADIUS.pill,
    height: 16,
    width: 56,
  },
  gardenScene: {
    position: 'relative',
    minHeight: 220,
    overflow: 'visible',
    paddingTop: 88,
  },
  wateringCan: {
    alignItems: 'center',
    height: 96,
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
  waterCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
});
