import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

type SoftScene = {
  image: string;
  line: string;
  tint: string;
};

/**
 * Spec · 「可愛動物照片 slideshow (Pexels streamed)」.
 * Full-bleed photos + soft crossfade / Ken Burns — not emoji placeholders.
 */
const SCENES: SoftScene[] = [
  {
    image:
      'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '有隻小貓瞓得好甜',
    tint: '#FFF3E8',
  },
  {
    image:
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '小狗望住你 · 搖住條尾',
    tint: '#FFF8E7',
  },
  {
    image:
      'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '小兔仔靜靜坐住',
    tint: '#F5F0FF',
  },
  {
    image:
      'https://images.pexels.com/photos/158827/field-corn-air-frisch-158827.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '風輕輕吹過草地',
    tint: '#EAF6EA',
  },
  {
    image:
      'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '天邊有啲暖色',
    tint: '#FFEFE6',
  },
  {
    image:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1200',
    line: '海浪一下一下 · 慢慢嚟',
    tint: '#E8F4FF',
  },
];

const HOLD_MS = 4200;
const FADE_MS = 750;

/**
 * 「同碗睇啲嘢」· soft photo slideshow with cinematic crossfade.
 */
export function SoftScenes({ visible, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const kenBurns = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  const clearAuto = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const playEnter = useCallback(() => {
    fade.setValue(0);
    lineOpacity.setValue(0);
    kenBurns.setValue(0);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: FADE_MS,
        delay: 160,
        useNativeDriver: true,
      }),
      Animated.timing(kenBurns, {
        toValue: 1,
        duration: HOLD_MS + FADE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setPrevIndex(null);
    });
  }, [fade, kenBurns, lineOpacity]);

  const advanceTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= SCENES.length || next === indexRef.current) return;
      clearAuto();
      setPrevIndex(indexRef.current);
      indexRef.current = next;
      setIndex(next);
      playEnter();
    },
    [playEnter],
  );

  const scheduleAuto = useCallback(() => {
    clearAuto();
    autoTimer.current = setTimeout(() => {
      const cur = indexRef.current;
      if (cur < SCENES.length - 1) {
        advanceTo(cur + 1);
      }
    }, HOLD_MS);
  }, [advanceTo]);

  useEffect(() => {
    if (!visible) {
      clearAuto();
      indexRef.current = 0;
      setIndex(0);
      setPrevIndex(null);
      fade.setValue(1);
      lineOpacity.setValue(1);
      kenBurns.setValue(0);
      return;
    }

    indexRef.current = 0;
    setIndex(0);
    setPrevIndex(null);
    fade.setValue(1);
    lineOpacity.setValue(1);
    kenBurns.setValue(0);
    Animated.timing(kenBurns, {
      toValue: 1,
      duration: HOLD_MS + FADE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    scheduleAuto();

    return clearAuto;
  }, [visible, fade, kenBurns, lineOpacity, scheduleAuto]);

  // After each advance, arm the next auto-advance.
  useEffect(() => {
    if (!visible) return;
    if (index >= SCENES.length - 1) {
      clearAuto();
      return;
    }
    scheduleAuto();
    return clearAuto;
  }, [index, visible, scheduleAuto]);

  const scene = SCENES[index] || SCENES[0];
  const prev = prevIndex != null ? SCENES[prevIndex] : null;
  const atEnd = index >= SCENES.length - 1;
  const scale = kenBurns.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: scene.tint }]}>
        {prev && (
          <Image
            source={{ uri: prev.image }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={0}
          />
        )}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: fade, transform: [{ scale }] }]}
        >
          <Image
            source={{ uri: scene.image }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={0}
            priority="high"
          />
        </Animated.View>

        <LinearGradient
          colors={['rgba(20,16,12,0.18)', 'rgba(20,16,12,0.04)', 'rgba(20,16,12,0.75)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <Pressable testID="soft-scenes-close" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>返去</Text>
            </Pressable>
            <Text style={styles.meta}>
              {index + 1} / {SCENES.length}
            </Text>
            <View style={styles.closeSpacer} />
          </View>

          <View style={styles.dots}>
            {SCENES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive, i < index && styles.dotDone]}
              />
            ))}
          </View>

          <View style={styles.bottom}>
            <Animated.Text style={[styles.line, { opacity: lineOpacity }]}>
              {scene.line}
            </Animated.Text>
            <Text style={styles.sub}>慢慢睇 · 唔使諗嘢</Text>

            <Pressable
              testID="soft-scenes-next"
              onPress={() => {
                if (atEnd) {
                  onComplete();
                  return;
                }
                advanceTo(index + 1);
              }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{atEnd ? '睇完啦' : '下一張'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  close: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  closeSpacer: { width: 64 },
  closeText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  meta: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFF',
  },
  dotDone: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  bottom: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  line: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: SPACING.lg,
  },
  cta: {
    height: 52,
    minWidth: 168,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
});
