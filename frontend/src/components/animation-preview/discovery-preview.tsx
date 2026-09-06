import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY, EMOTIONS, EmotionCategory } from '@/src/constants/emotions';
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

const DISCOVERIES: DiscoveryConfig[] = [
  {
    key: 'anger',
    label: '憤怒',
    title: '輕輕放走個波',
    instruction: '撳一下氣球 · 睇下藏住邊隻飯碗',
    emotionKey: 'angry',
    tint: '#FFF0EC',
    accent: '#E98D83',
    icon: 'circle',
  },
  {
    key: 'nervous',
    label: '緊張',
    title: '慢慢撥開啲沙',
    instruction: '用手指來回捽 · 或者輕觸三下',
    emotionKey: 'anxious',
    tint: '#FFF7E9',
    accent: '#D9B46E',
    icon: 'wind',
  },
  {
    key: 'sad',
    label: '傷心',
    title: '抹走窗上嘅雨',
    instruction: '左右掃一掃 · 或者輕觸三下',
    emotionKey: 'sad',
    tint: '#EEF7FF',
    accent: '#82B9D8',
    icon: 'cloud-rain',
  },
  {
    key: 'wound',
    label: '自我懷疑',
    title: '輕輕撈起一尾小金魚',
    instruction: '睇準小金魚 · 撳一下紙網慢慢撈起',
    emotionKey: 'insecure',
    tint: '#F0F8FF',
    accent: '#6FA8C4',
    icon: 'circle',
  },
  {
    key: 'unspoken',
    label: '講唔出',
    title: '撥開眼前嘅霧',
    instruction: '來回掃一掃 · 或者輕觸三下',
    emotionKey: 'foggy',
    tint: '#F1F3F6',
    accent: '#9AA8B6',
    icon: 'cloud',
  },
  {
    key: 'warm',
    label: '溫暖',
    title: '淋水俾小花',
    instruction: '撳三下水滴 · 睇下邊份力量正在生長',
    emotionKey: 'grateful',
    tint: '#F0F8EF',
    accent: '#7FA889',
    icon: 'sun',
  },
];

const SOFT_EASING = Easing.out(Easing.quad);

export function DiscoveryPreview() {
  const [activeKey, setActiveKey] = useState<DiscoveryKey>('anger');
  const [revealed, setRevealed] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const [selectedEmotionKey, setSelectedEmotionKey] = useState<string | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const balloonFloat = useRef(new Animated.Value(0)).current;
  const fishSwim = useRef(new Animated.Value(0)).current;
  const scoopMove = useRef(new Animated.Value(0)).current;
  const waterPour = useRef(new Animated.Value(0)).current;
  const assistTaps = useRef(0);
  const gestureDistance = useRef(0);
  const lastGesture = useRef({ x: 0, y: 0 });

  const active = DISCOVERIES.find((item) => item.key === activeKey) ?? DISCOVERIES[0];
  const categoryEmotions = EMOTIONS.filter((item) => item.category === activeKey);
  const emotion = EMOTION_BY_KEY[selectedEmotionKey ?? active.emotionKey];

  const reset = (nextKey?: DiscoveryKey) => {
    if (nextKey) setActiveKey(nextKey);
    setRevealed(false);
    setWaterCount(0);
    setSelectedEmotionKey(null);
    assistTaps.current = 0;
    gestureDistance.current = 0;
    reveal.setValue(0);
    overlay.setValue(1);
    scoopMove.setValue(0);
    waterPour.setValue(0);
  };

  const finishReveal = () => {
    if (revealed) return;
    setRevealed(true);
    setSelectedEmotionKey(active.emotionKey);
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 0,
        duration: 280,
        easing: SOFT_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 320,
        easing: SOFT_EASING,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    reset();
    // Animated values are stable refs; activeKey intentionally resets the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useEffect(() => {
    if (activeKey !== 'anger' || revealed) {
      balloonFloat.setValue(0);
      return;
    }
    const movement = Animated.loop(
      Animated.sequence([
        Animated.timing(balloonFloat, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(balloonFloat, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    movement.start();
    return () => movement.stop();
  }, [activeKey, balloonFloat, revealed]);

  useEffect(() => {
    if (activeKey !== 'wound' || revealed) {
      fishSwim.setValue(0);
      return;
    }
    const movement = Animated.loop(
      Animated.sequence([
        Animated.timing(fishSwim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fishSwim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    movement.start();
    return () => movement.stop();
  }, [activeKey, fishSwim, revealed]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Let a stationary touch reach Pressable's accessible tap fallback.
        // A moving touch is claimed below for the intended rub/swipe interaction.
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          (activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') &&
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderGrant: (_, gesture) => {
          lastGesture.current = { x: gesture.moveX, y: gesture.moveY };
        },
        onPanResponderMove: (_, gesture) => {
          const dx = gesture.moveX - lastGesture.current.x;
          const dy = gesture.moveY - lastGesture.current.y;
          gestureDistance.current += Math.sqrt(dx * dx + dy * dy);
          lastGesture.current = { x: gesture.moveX, y: gesture.moveY };
          const progress = Math.min(gestureDistance.current / 240, 1);
          overlay.setValue(1 - progress * 0.9);
          reveal.setValue(progress);
          if (progress >= 0.92) finishReveal();
        },
        onPanResponderRelease: () => {
          if (gestureDistance.current >= 90) finishReveal();
        },
        onPanResponderTerminate: () => {
          if (gestureDistance.current >= 90) finishReveal();
        },
      }),
    // Rebuild responders as the interaction style changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeKey, revealed],
  );

  const handleTap = () => {
    if (activeKey === 'anger') {
      finishReveal();
      return;
    }
    if (activeKey === 'wound') {
      Animated.timing(scoopMove, {
        toValue: 1,
        duration: 760,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) finishReveal();
      });
      return;
    }
    if (activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') {
      const next = assistTaps.current + 1;
      const nextProgress = Math.min(next / 3, 1);
      assistTaps.current = next;
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1 - nextProgress * 0.9,
          duration: 240,
          easing: SOFT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(reveal, {
          toValue: nextProgress,
          duration: 260,
          easing: SOFT_EASING,
          useNativeDriver: true,
        }),
      ]).start();
      if (next >= 3) finishReveal();
      return;
    }
    if (activeKey === 'warm') {
      const next = waterCount + 1;
      setWaterCount(next);
      waterPour.setValue(0);
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: next / 3,
          duration: 260,
          easing: SOFT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(waterPour, {
          toValue: 1,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      if (next >= 3) finishReveal();
    }
  };

  const bowlScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const bowlOpacity = reveal.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.08, 0.35, 1],
  });

  return (
    <View>
      <Text style={styles.eyebrow}>第一組 · 尋找合適飯碗</Text>
      <Text style={styles.sectionTitle}>每組感受 · 有自己嘅發現方式</Text>
      <Text style={styles.sectionHint}>
        呢個預覽唔會記錄你嘅選擇。試下撳、掃或者捽開畫面。
      </Text>

      <View style={styles.chips}>
        {DISCOVERIES.map((item) => {
          const selected = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              testID={`discovery-${item.key}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => reset(item.key)}
              style={({ pressed }) => [
                styles.chip,
                selected && { backgroundColor: item.accent, borderColor: item.accent },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.stageCard, { backgroundColor: active.tint }]}>
        <View style={styles.stageHeader}>
          <View style={[styles.iconBadge, { backgroundColor: active.accent + '22' }]}>
            <Feather name={active.icon} size={18} color={active.accent} />
          </View>
          <View style={styles.stageHeading}>
            <Text style={styles.stageTitle}>{active.title}</Text>
            <Text style={styles.stageInstruction}>{active.instruction}</Text>
          </View>
          <Pressable
            testID="discovery-reset"
            accessibilityLabel="重新開始預覽"
            onPress={() => reset()}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Feather name="rotate-ccw" size={17} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          testID={`discovery-stage-${activeKey}`}
          accessibilityRole="button"
          accessibilityLabel={active.instruction}
          onPress={handleTap}
          style={styles.scene}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.bowlReveal,
              { opacity: bowlOpacity, transform: [{ scale: bowlScale }] },
            ]}
          >
            <EmotionVisual emotion={emotion} size={138} radius={RADIUS.lg} />
          </Animated.View>

          {activeKey === 'anger' && (
            <Animated.View
              style={[
                styles.balloonWrap,
                {
                  opacity: overlay,
                  transform: [
                    {
                      translateX: balloonFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 6],
                      }),
                    },
                    {
                      translateY: balloonFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, -9],
                      }),
                    },
                    {
                      rotate: balloonFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-2deg', '3deg'],
                      }),
                    },
                    {
                      scale: overlay.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.14, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.balloon, { backgroundColor: active.accent }]}>
                <View style={styles.balloonShine} />
              </View>
              <View style={[styles.balloonKnot, { borderTopColor: active.accent }]} />
              <View style={styles.balloonString} />
            </Animated.View>
          )}

          {activeKey === 'nervous' && (
            <Animated.View style={[styles.coverLayer, styles.sandCover, { opacity: overlay }]}>
              {Array.from({ length: 34 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.sandDot,
                    {
                      left: `${(index * 29) % 96}%`,
                      top: `${(index * 47) % 90}%`,
                      transform: [{ scale: 0.65 + (index % 4) * 0.16 }],
                    },
                  ]}
                />
              ))}
              <Text style={styles.coverPrompt}>用手指慢慢捽開</Text>
            </Animated.View>
          )}

          {activeKey === 'sad' && (
            <Animated.View style={[styles.coverLayer, styles.rainWindow, { opacity: overlay }]}>
              {Array.from({ length: 18 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.rainDrop,
                    {
                      left: `${8 + ((index * 23) % 84)}%`,
                      top: `${5 + ((index * 37) % 78)}%`,
                      height: 18 + (index % 3) * 9,
                    },
                  ]}
                />
              ))}
              <Text style={styles.coverPrompt}>左右掃走啲雨水</Text>
            </Animated.View>
          )}

          {activeKey === 'wound' && (
            <Animated.View style={[styles.fishPond, { opacity: overlay }]}>
              <View style={styles.pondRippleLarge} />
              <View style={styles.pondRippleSmall} />
              <Animated.Text
                style={[
                  styles.goldfish,
                  styles.goldfishOne,
                  {
                    transform: [
                      {
                        translateX: fishSwim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 35],
                        }),
                      },
                    ],
                  },
                ]}
              >
                🐠
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.goldfish,
                  styles.goldfishTwo,
                  {
                    transform: [
                      {
                        translateX: fishSwim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [28, -24],
                        }),
                      },
                      { rotateY: '180deg' },
                    ],
                  },
                ]}
              >
                🐠
              </Animated.Text>
              <Animated.View
                style={[
                  styles.scoopNet,
                  {
                    transform: [
                      {
                        translateX: scoopMove.interpolate({
                          inputRange: [0, 0.62, 1],
                          outputRange: [0, -46, -20],
                        }),
                      },
                      {
                        translateY: scoopMove.interpolate({
                          inputRange: [0, 0.62, 1],
                          outputRange: [0, 48, -22],
                        }),
                      },
                      {
                        rotate: scoopMove.interpolate({
                          inputRange: [0, 0.62, 1],
                          outputRange: ['-24deg', '-8deg', '-17deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.scoopRing}>
                  <View style={styles.scoopMeshVertical} />
                  <View style={styles.scoopMeshHorizontal} />
                </View>
                <View style={styles.scoopHandle} />
              </Animated.View>
              <Text style={styles.pondPrompt}>撳一下紙網 · 輕輕撈起</Text>
            </Animated.View>
          )}

          {activeKey === 'unspoken' && (
            <Animated.View style={[styles.coverLayer, styles.fogCover, { opacity: overlay }]}>
              <View style={[styles.fogBand, { top: 50, left: -20 }]} />
              <View style={[styles.fogBand, { top: 112, right: -30, width: '82%' }]} />
              <View style={[styles.fogBand, { top: 168, left: 6, width: '92%' }]} />
              <Text style={styles.coverPrompt}>未講得出 · 都可以慢慢搵</Text>
            </Animated.View>
          )}

          {activeKey === 'warm' && (
            <View style={styles.gardenScene}>
              <View style={styles.wateringCan}>
                <View style={styles.canDrawing}>
                  <View style={[styles.canHandle, { borderColor: active.accent }]} />
                  <View style={[styles.canBody, { backgroundColor: active.accent }]}>
                    <View style={styles.canHighlight} />
                  </View>
                  <View style={[styles.canSpout, { backgroundColor: active.accent }]} />
                  <View style={[styles.canRose, { backgroundColor: active.accent }]} />
                </View>
                <Text style={styles.waterCount}>{Math.min(waterCount, 3)} / 3</Text>
                <View style={styles.waterStream}>
                  {[0, 1, 2].map((index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waterDrop,
                        {
                          left: index * 12,
                          opacity: waterPour.interpolate({
                            inputRange: [0, 0.08 + index * 0.08, 0.72, 1],
                            outputRange: [0, 0, 1, 0],
                          }),
                          transform: [
                            {
                              translateY: waterPour.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 72 + index * 7],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Animated.View
                style={[
                  styles.flowerRow,
                  {
                    opacity: reveal,
                    transform: [
                      {
                        scale: reveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.flower}>🌱</Text>
                <Text style={styles.flower}>🌼</Text>
                <Text style={styles.flower}>🌱</Text>
              </Animated.View>
            </View>
          )}
        </Pressable>

        {!revealed &&
          (activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') && (
            <Pressable
              testID="discovery-reveal-fallback"
              accessibilityRole="button"
              onPress={finishReveal}
              style={({ pressed }) => [
                styles.fallbackButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="eye" size={14} color={COLORS.textSecondary} />
              <Text style={styles.fallbackButtonText}>用唔到手勢？撳呢度揭曉</Text>
            </Pressable>
          )}

        {revealed ? (
          <Animated.View style={[styles.results, { opacity: reveal }]}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultLabel}>呢一組全部飯碗</Text>
                <Text style={styles.resultsCount}>
                  {categoryEmotions.length} 隻 · 左右掃嚟比較
                </Text>
              </View>
              <Feather name="arrow-right" size={17} color={COLORS.textSecondary} />
            </View>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bowlRail}
            >
              {categoryEmotions.map((item) => {
                const selected = item.key === emotion.key;
                return (
                  <Pressable
                    key={item.key}
                    testID={`discovery-bowl-${item.key}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedEmotionKey(item.key)}
                    style={({ pressed }) => [
                      styles.bowlOption,
                      selected && {
                        backgroundColor: item.color + '55',
                        borderColor: active.accent,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <EmotionVisual emotion={item} size={66} radius={RADIUS.md} />
                    <Text numberOfLines={1} style={styles.bowlOptionLabel}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.resultCard}>
              <View style={styles.resultCopy}>
                <Text style={styles.resultLabel}>你而家揀緊</Text>
                <Text style={styles.resultName}>{emotion.label}</Text>
                <Text style={styles.resultDescription}>{emotion.description}</Text>
              </View>
              <Pressable
                testID="discovery-choose"
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.chooseButton,
                  { backgroundColor: active.accent },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chooseButtonText}>似我而家</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Text style={styles.safetyHint}>可以隨時停低 · 冇分數 · 冇答錯</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 30,
  },
  sectionHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: SPACING.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  chip: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: COLORS.textInverse },
  pressed: { opacity: 0.85 },
  stageCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  stageHeader: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  iconBadge: {
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stageHeading: { flex: 1 },
  stageTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  stageInstruction: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFB8',
    borderRadius: RADIUS.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scene: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF88',
    borderRadius: RADIUS.md,
    height: 260,
    justifyContent: 'center',
    marginTop: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  bowlReveal: { alignItems: 'center', justifyContent: 'center' },
  balloonWrap: { alignItems: 'center', position: 'absolute', top: 35 },
  balloon: {
    alignItems: 'flex-start',
    borderRadius: 65,
    height: 142,
    justifyContent: 'flex-start',
    padding: 24,
    width: 122,
  },
  balloonShine: {
    backgroundColor: '#FFFFFF88',
    borderRadius: RADIUS.pill,
    height: 34,
    transform: [{ rotate: '20deg' }],
    width: 12,
  },
  balloonKnot: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    borderTopWidth: 13,
    height: 0,
    marginTop: -2,
    width: 0,
  },
  balloonString: {
    backgroundColor: '#9A8D86',
    height: 48,
    opacity: 0.5,
    width: 1,
  },
  coverLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandCover: { backgroundColor: '#E7CF9A' },
  sandDot: {
    backgroundColor: '#C9A866',
    borderRadius: RADIUS.pill,
    height: 7,
    opacity: 0.48,
    position: 'absolute',
    width: 7,
  },
  rainWindow: { backgroundColor: '#D9EAF4F2' },
  rainDrop: {
    backgroundColor: '#FFFFFFAA',
    borderRadius: RADIUS.pill,
    position: 'absolute',
    transform: [{ rotate: '8deg' }],
    width: 4,
  },
  coverPrompt: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.pill,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fishPond: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#CDEBF3',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pondRippleLarge: {
    borderColor: '#FFFFFF88',
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    height: 150,
    position: 'absolute',
    width: 260,
  },
  pondRippleSmall: {
    borderColor: '#FFFFFFAA',
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    height: 92,
    position: 'absolute',
    width: 175,
  },
  goldfish: { fontSize: 38, position: 'absolute' },
  goldfishOne: { left: '24%', top: 48 },
  goldfishTwo: { right: '22%', top: 134 },
  scoopNet: {
    alignItems: 'center',
    position: 'absolute',
    right: 52,
    top: 40,
  },
  scoopRing: {
    alignItems: 'center',
    backgroundColor: '#FFF9E899',
    borderColor: '#E8D9B7',
    borderRadius: RADIUS.pill,
    borderWidth: 4,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  scoopMeshVertical: {
    backgroundColor: '#D8C79D99',
    height: 68,
    position: 'absolute',
    width: 1,
  },
  scoopMeshHorizontal: {
    backgroundColor: '#D8C79D99',
    height: 1,
    position: 'absolute',
    width: 68,
  },
  scoopHandle: {
    backgroundColor: '#B69063',
    borderRadius: RADIUS.pill,
    height: 82,
    width: 7,
  },
  pondPrompt: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.pill,
    bottom: 20,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
  },
  fogCover: { backgroundColor: '#E3E6E9EE' },
  fogBand: {
    backgroundColor: '#F9FAFBCC',
    borderRadius: RADIUS.pill,
    height: 46,
    position: 'absolute',
    width: '88%',
  },
  gardenScene: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingTop: 30,
  },
  wateringCan: { alignItems: 'center', height: 105, position: 'relative' },
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
  flowerRow: { flexDirection: 'row', gap: 26 },
  flower: { fontSize: 34 },
  results: {
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
    paddingVertical: SPACING.md,
  },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  resultsCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  bowlRail: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  bowlOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFCC',
    borderColor: 'transparent',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    padding: 7,
    width: 86,
  },
  bowlOptionLabel: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
    width: '100%',
  },
  resultCard: {
    alignItems: 'center',
    borderTopColor: COLORS.borderLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  resultCopy: { flex: 1 },
  resultLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  resultName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  resultDescription: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  chooseButton: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  chooseButtonText: { color: COLORS.textInverse, fontSize: 13, fontWeight: '800' },
  safetyHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  fallbackButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFFAA',
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  fallbackButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
