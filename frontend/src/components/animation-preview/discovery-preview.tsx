import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, Mask, Path, Rect } from 'react-native-svg';

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
    instruction: '用手指來回捽開沙面 · 逐隻搵',
    emotionKey: 'anxious',
    tint: '#FFF7E9',
    accent: '#D9B46E',
    icon: 'wind',
  },
  {
    key: 'sad',
    label: '傷心',
    title: '抹走窗上嘅雨',
    instruction: '用手指抹走雨水 · 睇下邊隻似你',
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
    instruction: '用手指逐處撥開霧 · 慢慢搵',
    emotionKey: 'foggy',
    tint: '#F1F3F6',
    accent: '#9AA8B6',
    icon: 'cloud',
  },
  {
    key: 'warm',
    label: '溫暖',
    title: '淋水俾小花',
    instruction: '揀一塊泥土淋水 · 每次發現一隻',
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
  const [selectedEmotionKey, setSelectedEmotionKey] = useState<string | null>(null);
  const [discoveredKeys, setDiscoveredKeys] = useState<string[]>([]);
  const [poppedBalloonKeys, setPoppedBalloonKeys] = useState<string[]>([]);
  const [scratchPath, setScratchPath] = useState('');
  const reveal = useRef(new Animated.Value(0)).current;
  const balloonFloat = useRef(new Animated.Value(0)).current;
  const fishSwim = useRef(new Animated.Value(0)).current;
  const scoopMove = useRef(new Animated.Value(0)).current;
  const waterPour = useRef(new Animated.Value(0)).current;
  const sceneSize = useRef({ width: 320, height: 340 });
  const lastScratchPoint = useRef({ x: 0, y: 0 });

  const active = DISCOVERIES.find((item) => item.key === activeKey) ?? DISCOVERIES[0];
  const categoryEmotions = EMOTIONS.filter((item) => item.category === activeKey);
  const emotion = EMOTION_BY_KEY[selectedEmotionKey ?? active.emotionKey];

  const reset = (nextKey?: DiscoveryKey) => {
    if (nextKey) setActiveKey(nextKey);
    setRevealed(false);
    setSelectedEmotionKey(null);
    setDiscoveredKeys([]);
    setPoppedBalloonKeys([]);
    setScratchPath('');
    reveal.setValue(0);
    scoopMove.setValue(0);
    waterPour.setValue(0);
  };

  const discoverEmotion = (emotionKey: string) => {
    setDiscoveredKeys((current) =>
      current.includes(emotionKey) ? current : [...current, emotionKey],
    );
    setSelectedEmotionKey(emotionKey);
    if (!revealed) {
      setRevealed(true);
      Animated.timing(reveal, {
        toValue: 1,
        duration: 280,
        easing: SOFT_EASING,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    reset();
    // Animated values are stable refs; activeKey intentionally resets the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useEffect(() => {
    if (activeKey !== 'anger') {
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
  }, [activeKey, balloonFloat]);

  useEffect(() => {
    if (activeKey !== 'wound') {
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
  }, [activeKey, fishSwim]);

  const discoverAtPoint = (x: number, y: number) => {
    const count = categoryEmotions.length;
    const columns = count > 12 ? 5 : count > 6 ? 4 : count > 4 ? 3 : 2;
    const rows = Math.ceil(count / columns);
    const column = Math.max(
      0,
      Math.min(columns - 1, Math.floor(x / (sceneSize.current.width / columns))),
    );
    const row = Math.max(
      0,
      Math.min(rows - 1, Math.floor(y / (sceneSize.current.height / rows))),
    );
    const item = categoryEmotions[row * columns + column];
    if (item) discoverEmotion(item.key);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken',
        onMoveShouldSetPanResponder: (_, gesture) =>
          (activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') &&
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderGrant: (event) => {
          const { locationX: x, locationY: y } = event.nativeEvent;
          lastScratchPoint.current = { x, y };
          setScratchPath((current) => `${current} M ${x.toFixed(1)} ${y.toFixed(1)}`);
        },
        onPanResponderMove: (event) => {
          const { locationX: x, locationY: y } = event.nativeEvent;
          const dx = x - lastScratchPoint.current.x;
          const dy = y - lastScratchPoint.current.y;
          if (Math.sqrt(dx * dx + dy * dy) < 7) return;
          lastScratchPoint.current = { x, y };
          setScratchPath((current) => `${current} L ${x.toFixed(1)} ${y.toFixed(1)}`);
          discoverAtPoint(x, y);
        },
      }),
    // Rebuild when the category changes so hit-testing uses the correct bowl set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeKey],
  );

  const popBalloon = (emotionKey: string) => {
    setPoppedBalloonKeys((current) =>
      current.includes(emotionKey) ? current : [...current, emotionKey],
    );
    discoverEmotion(emotionKey);
  };

  const catchFish = (emotionKey: string) => {
    scoopMove.setValue(0);
    Animated.timing(scoopMove, {
      toValue: 1,
      duration: 760,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) discoverEmotion(emotionKey);
    });
  };

  const waterEmotion = (emotionKey: string) => {
    waterPour.setValue(0);
    Animated.timing(waterPour, {
      toValue: 1,
      duration: 900,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) discoverEmotion(emotionKey);
    });
  };

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

        <View
          testID={`discovery-stage-${activeKey}`}
          style={styles.scene}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            sceneSize.current = { width, height };
          }}
          {...panResponder.panHandlers}
        >
          {(activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') && (
            <Animated.View
              pointerEvents="none"
              style={styles.sceneBowlField}
            >
              {categoryEmotions.map((item) => {
                const dense = categoryEmotions.length > 12;
                const compact = categoryEmotions.length > 8;
                const selected = item.key === emotion.key;
                return (
                  <Pressable
                    key={item.key}
                    testID={`scene-bowl-${item.key}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.sceneBowl,
                      {
                        width: dense ? '19%' : compact ? '24%' : '31%',
                      },
                      selected && {
                        backgroundColor: item.color + '66',
                        borderColor: active.accent,
                      },
                      discoveredKeys.includes(item.key) && styles.discoveredSceneBowl,
                      pressed && styles.pressed,
                    ]}
                  >
                    <EmotionVisual
                      emotion={item}
                      size={dense ? 38 : compact ? 43 : 51}
                      radius={RADIUS.sm}
                    />
                    <Text numberOfLines={1} style={styles.sceneBowlLabel}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {activeKey === 'anger' && (
            <View style={styles.balloonField}>
              {categoryEmotions.map((item, index) => {
                const popped = poppedBalloonKeys.includes(item.key);
                const selected = item.key === selectedEmotionKey;
                return (
                  <Animated.View
                    key={item.key}
                    style={[
                      styles.balloonSlot,
                      {
                        transform: [
                          {
                            translateX: balloonFloat.interpolate({
                              inputRange: [0, 1],
                              outputRange:
                                index % 3 === 0
                                  ? [-4, 5]
                                  : index % 3 === 1
                                    ? [4, -3]
                                    : [-2, 4],
                            }),
                          },
                          {
                            translateY: balloonFloat.interpolate({
                              inputRange: [0, 1],
                              outputRange:
                                index % 2 === 0 ? [7, -8] : [-6, 8],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Pressable
                      testID={`anger-balloon-${item.key}`}
                      accessibilityRole="button"
                      accessibilityLabel={
                        popped ? `${item.label}飯碗` : `第 ${index + 1} 個氣球`
                      }
                      onPress={() => popBalloon(item.key)}
                      style={({ pressed }) => [
                        styles.miniBalloonPressable,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.miniBalloon,
                          { backgroundColor: item.color + 'E8' },
                          popped && styles.miniBalloonPopped,
                          selected && { borderColor: active.accent },
                        ]}
                      >
                        {popped ? (
                          <EmotionVisual emotion={item} size={58} radius={RADIUS.sm} />
                        ) : (
                          <View style={styles.miniBalloonShine} />
                        )}
                      </View>
                      {!popped ? (
                        <>
                          <View style={[styles.miniBalloonKnot, { borderTopColor: item.color }]} />
                          <View style={styles.miniBalloonString} />
                        </>
                      ) : (
                        <Text numberOfLines={1} style={styles.poppedBalloonLabel}>
                          {item.label}
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {activeKey === 'nervous' && (
            <View pointerEvents="none" style={styles.interactionLayer}>
              <ScratchCover
                id="sand-search-mask"
                path={scratchPath}
                color="#E7CF9A"
              />
              <Text style={styles.coverPrompt}>用手指捽開啲沙 · 逐隻慢慢搵</Text>
            </View>
          )}

          {activeKey === 'sad' && (
            <View pointerEvents="none" style={styles.interactionLayer}>
              <ScratchCover
                id="rain-search-mask"
                path={scratchPath}
                color="#D9EAF4"
              />
              <View style={styles.rainDecoration}>
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
              </View>
              <Text style={styles.coverPrompt}>用手指抹開雨水 · 逐隻慢慢搵</Text>
            </View>
          )}

          {activeKey === 'wound' && (
            <View style={styles.fishPond}>
              <View style={styles.pondRippleLarge} />
              <View style={styles.pondRippleSmall} />
              <View style={styles.fishSearchField}>
                {categoryEmotions.map((item, index) => {
                  const found = discoveredKeys.includes(item.key);
                  return (
                    <Animated.View
                      key={item.key}
                      style={[
                        styles.fishSlot,
                        {
                          transform: [
                            {
                              translateX: fishSwim.interpolate({
                                inputRange: [0, 1],
                                outputRange:
                                  index % 2 === 0 ? [-5, 7] : [6, -5],
                              }),
                            },
                            {
                              translateY: fishSwim.interpolate({
                                inputRange: [0, 1],
                                outputRange:
                                  index % 3 === 0 ? [4, -5] : [-3, 4],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Pressable
                        testID={`goldfish-${item.key}`}
                        accessibilityLabel={found ? `${item.label}飯碗` : '游緊嘅小金魚'}
                        onPress={() => catchFish(item.key)}
                        style={({ pressed }) => [
                          styles.fishButton,
                          found && { borderColor: active.accent },
                          pressed && styles.pressed,
                        ]}
                      >
                        {found ? (
                          <EmotionVisual emotion={item} size={36} radius={RADIUS.sm} />
                        ) : (
                          <Text style={styles.smallGoldfish}>🐠</Text>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
              <Animated.View
                pointerEvents="none"
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
              <Text pointerEvents="none" style={styles.pondPrompt}>
                追住小金魚 · 用紙網逐條撈
              </Text>
            </View>
          )}

          {activeKey === 'unspoken' && (
            <View pointerEvents="none" style={styles.interactionLayer}>
              <ScratchCover
                id="fog-search-mask"
                path={scratchPath}
                color="#E3E6E9"
              />
              <View style={[styles.fogBand, { top: 50, left: -20 }]} />
              <View style={[styles.fogBand, { top: 112, right: -30, width: '82%' }]} />
              <View style={[styles.fogBand, { top: 168, left: 6, width: '92%' }]} />
              <Text style={styles.coverPrompt}>用手指撥開啲霧 · 逐隻慢慢搵</Text>
            </View>
          )}

          {activeKey === 'warm' && (
            <View style={styles.gardenScene}>
              <View pointerEvents="none" style={styles.wateringCan}>
                <View style={styles.canDrawing}>
                  <View style={[styles.canHandle, { borderColor: active.accent }]} />
                  <View style={[styles.canBody, { backgroundColor: active.accent }]}>
                    <View style={styles.canHighlight} />
                  </View>
                  <View style={[styles.canSpout, { backgroundColor: active.accent }]} />
                  <View style={[styles.canRose, { backgroundColor: active.accent }]} />
                </View>
                <Text style={styles.waterCount}>
                  {discoveredKeys.length} / {categoryEmotions.length}
                </Text>
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
              <View style={styles.gardenSearchField}>
                {categoryEmotions.map((item) => {
                  const found = discoveredKeys.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      testID={`garden-patch-${item.key}`}
                      accessibilityLabel={found ? `${item.label}飯碗` : '等緊淋水嘅泥土'}
                      onPress={() => waterEmotion(item.key)}
                      style={({ pressed }) => [
                        styles.gardenPatch,
                        found && { borderColor: active.accent },
                        pressed && styles.pressed,
                      ]}
                    >
                      {found ? (
                        <EmotionVisual emotion={item} size={39} radius={RADIUS.sm} />
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
          )}
        </View>


        {revealed ? (
          <Animated.View style={[styles.results, { opacity: reveal }]}>
            <Text style={styles.inSceneCount}>
              已經搵到 {discoveredKeys.length} / {categoryEmotions.length} 隻飯碗
            </Text>
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

function ScratchCover({
  id,
  path,
  color,
}: {
  id: string;
  path: string;
  color: string;
}) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <Mask id={id}>
          <Rect width="100%" height="100%" fill="#FFF" />
          <Path
            d={path || 'M -10 -10'}
            fill="none"
            stroke="#000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={58}
          />
        </Mask>
      </Defs>
      <Rect
        width="100%"
        height="100%"
        fill={color}
        mask={`url(#${id})`}
      />
    </Svg>
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
    height: 340,
    justifyContent: 'center',
    marginTop: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  interactionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  sceneBowlField: {
    ...StyleSheet.absoluteFillObject,
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    padding: SPACING.sm,
    zIndex: 1,
  },
  warmBowlField: { paddingTop: 96 },
  sceneBowl: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    justifyContent: 'center',
    marginVertical: 2,
    minHeight: 58,
    padding: 3,
  },
  discoveredSceneBowl: { backgroundColor: '#FFFFFFCC' },
  sceneBowlLabel: {
    color: COLORS.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  balloonField: {
    ...StyleSheet.absoluteFillObject,
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  balloonSlot: {
    alignItems: 'center',
    height: 152,
    justifyContent: 'center',
    width: '32%',
  },
  miniBalloonPressable: { alignItems: 'center', justifyContent: 'flex-start' },
  miniBalloon: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 44,
    borderWidth: 3,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 76,
  },
  miniBalloonPopped: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.md,
  },
  miniBalloonShine: {
    backgroundColor: '#FFFFFF88',
    borderRadius: RADIUS.pill,
    height: 22,
    left: 13,
    position: 'absolute',
    top: 11,
    transform: [{ rotate: '20deg' }],
    width: 7,
  },
  miniBalloonKnot: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 6,
    borderRightColor: 'transparent',
    borderRightWidth: 6,
    borderTopWidth: 9,
    height: 0,
    marginTop: -2,
    width: 0,
  },
  miniBalloonString: {
    backgroundColor: '#9A8D86',
    height: 30,
    opacity: 0.5,
    width: 1,
  },
  poppedBalloonLabel: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
    maxWidth: 86,
    textAlign: 'center',
  },
  rainDecoration: { ...StyleSheet.absoluteFillObject },
  rainDrop: {
    backgroundColor: '#FFFFFFAA',
    borderRadius: RADIUS.pill,
    position: 'absolute',
    transform: [{ rotate: '8deg' }],
    width: 4,
  },
  coverPrompt: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFFCC',
    bottom: 20,
    borderRadius: RADIUS.pill,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
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
  fishSearchField: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: '100%',
    justifyContent: 'space-evenly',
    paddingBottom: 52,
    paddingHorizontal: 6,
    paddingTop: 8,
    width: '100%',
  },
  fishSlot: {
    alignItems: 'center',
    height: 74,
    justifyContent: 'center',
    width: '19%',
  },
  fishButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF66',
    borderColor: 'transparent',
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    height: 49,
    justifyContent: 'center',
    width: 49,
  },
  smallGoldfish: { fontSize: 27 },
  scoopNet: {
    alignItems: 'center',
    position: 'absolute',
    right: 52,
    top: 40,
    zIndex: 3,
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
    zIndex: 4,
  },
  fogCover: { backgroundColor: '#E3E6E9EE' },
  fogBand: {
    backgroundColor: '#F9FAFBCC',
    borderRadius: RADIUS.pill,
    height: 46,
    opacity: 0.38,
    position: 'absolute',
    width: '88%',
  },
  gardenScene: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 12,
  },
  wateringCan: {
    alignItems: 'center',
    height: 105,
    position: 'absolute',
    top: 8,
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
    alignContent: 'center',
    alignItems: 'center',
    bottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 225,
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
    position: 'absolute',
    width: '100%',
  },
  gardenPatch: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 68,
    justifyContent: 'center',
    position: 'relative',
    width: '23%',
  },
  seedling: { fontSize: 24, marginBottom: -5, zIndex: 2 },
  gardenSoil: {
    backgroundColor: '#BFA17D',
    borderRadius: RADIUS.pill,
    height: 13,
    width: 44,
  },
  results: {
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
    paddingVertical: SPACING.md,
  },
  inSceneCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    textAlign: 'center',
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
