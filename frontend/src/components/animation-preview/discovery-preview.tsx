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

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY, EmotionCategory } from '@/src/constants/emotions';
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
    title: '打開一封俾自己嘅信',
    instruction: '撳信封 · 入面可能有一隻明白你嘅飯碗',
    emotionKey: 'insecure',
    tint: '#F7F0FF',
    accent: '#AE91C5',
    icon: 'mail',
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
  const [assistTaps, setAssistTaps] = useState(0);
  const reveal = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const gestureDistance = useRef(0);
  const lastGesture = useRef({ x: 0, y: 0 });

  const active = DISCOVERIES.find((item) => item.key === activeKey) ?? DISCOVERIES[0];
  const emotion = EMOTION_BY_KEY[active.emotionKey];

  const reset = (nextKey?: DiscoveryKey) => {
    if (nextKey) setActiveKey(nextKey);
    setRevealed(false);
    setWaterCount(0);
    setAssistTaps(0);
    gestureDistance.current = 0;
    reveal.setValue(0);
    overlay.setValue(1);
  };

  const finishReveal = () => {
    if (revealed) return;
    setRevealed(true);
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken',
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
    if (activeKey === 'anger' || activeKey === 'wound') {
      finishReveal();
      return;
    }
    if (activeKey === 'nervous' || activeKey === 'sad' || activeKey === 'unspoken') {
      const next = assistTaps + 1;
      const nextProgress = Math.min(next / 3, 1);
      setAssistTaps(next);
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
      Animated.timing(reveal, {
        toValue: next / 3,
        duration: 260,
        easing: SOFT_EASING,
        useNativeDriver: true,
      }).start();
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
            <Animated.View style={[styles.envelopeWrap, { opacity: overlay }]}>
              <View style={styles.letterEnvelope}>
                <View style={styles.envelopeFlap} />
                <Feather name="heart" size={25} color={active.accent} />
                <Text style={styles.envelopeText}>俾而家嘅你</Text>
              </View>
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
                <Feather name="cloud-drizzle" size={34} color={active.accent} />
                <Text style={styles.waterCount}>{Math.min(waterCount, 3)} / 3</Text>
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

        {revealed ? (
          <Animated.View style={[styles.resultCard, { opacity: reveal }]}>
            <View style={styles.resultCopy}>
              <Text style={styles.resultLabel}>可能似你嘅飯碗</Text>
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
  envelopeWrap: { alignItems: 'center', position: 'absolute' },
  letterEnvelope: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderColor: '#E6D7E9',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 135,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 190,
  },
  envelopeFlap: {
    backgroundColor: '#F0E2F2',
    height: 100,
    left: 20,
    position: 'absolute',
    top: -67,
    transform: [{ rotate: '45deg' }],
    width: 100,
  },
  envelopeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: SPACING.sm,
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
  wateringCan: { alignItems: 'center' },
  waterCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  flowerRow: { flexDirection: 'row', gap: 26 },
  flower: { fontSize: 34 },
  resultCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
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
});
