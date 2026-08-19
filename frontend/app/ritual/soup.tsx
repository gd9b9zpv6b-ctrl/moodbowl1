import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/src/components/progress-dots';
import { RitualDiaryFooter } from '@/src/components/ritual-diary-escape';
import { SOUPS, type SoupKey } from '@/src/constants/soups';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { wordingFor } from '@/src/lib/i18n/wording-mode';
import { useRitualStore } from '@/src/lib/ritual/ritual-store';

const WANJAI = require('../../assets/mascots/wanjai-base.png');

const SPIRIT_SIZE = 148;
const OFFER_MS = 1100;

export default function RitualSoupScreen() {
  const router = useRouter();
  const ageGroup = useRitualStore((s) => s.ageGroup);
  const setSoup = useRitualStore((s) => s.setSoup);
  const [selected, setSelected] = useState<SoupKey | null>(null);
  const [offering, setOffering] = useState(false);
  const w = wordingFor(ageGroup);

  const idleBob = useRef(new Animated.Value(0)).current;
  const spiritScale = useRef(new Animated.Value(1)).current;
  const drinkX = useRef(new Animated.Value(0)).current;
  const drinkY = useRef(new Animated.Value(0)).current;
  const drinkScale = useRef(new Animated.Value(1)).current;
  const drinkOpacity = useRef(new Animated.Value(0)).current;
  const stageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleBob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleBob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [idleBob]);

  const idleTranslateY = idleBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const pickedSoup = selected ? SOUPS.find((s) => s.key === selected) : null;
  const isSkip = selected === 'no_drink';

  const onPick = (key: SoupKey) => {
    if (selected || offering) return;
    setSelected(key);
    setSoup(key);
    setOffering(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    drinkX.setValue(0);
    drinkY.setValue(120);
    drinkScale.setValue(1.35);
    drinkOpacity.setValue(1);

    const flyUp = isSkip ? -40 : -110;
    const endScale = isSkip ? 0.6 : 0.35;

    Animated.parallel([
      Animated.timing(drinkY, {
        toValue: flyUp,
        duration: OFFER_MS * 0.7,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(drinkX, {
        toValue: isSkip ? 40 : 0,
        duration: OFFER_MS * 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(drinkScale, {
        toValue: endScale,
        duration: OFFER_MS * 0.7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(OFFER_MS * 0.45),
        Animated.parallel([
          Animated.timing(drinkOpacity, {
            toValue: 0,
            duration: OFFER_MS * 0.35,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(spiritScale, {
              toValue: 1.08,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(spiritScale, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    ]).start(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(stageOpacity, {
        toValue: 0.92,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        router.push('/ritual/body');
      });
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          testID="ritual-soup-back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="返去"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <ProgressDots total={3} active={1} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{w.soup_title}</Text>
        <Text style={styles.sub}>{w.soup_sub}</Text>

        <Animated.View
          style={[
            styles.spiritStage,
            {
              opacity: stageOpacity,
              transform: [{ translateY: idleTranslateY }, { scale: spiritScale }],
            },
          ]}
        >
          <Image
            source={WANJAI}
            style={styles.spirit}
            contentFit="contain"
            accessibilityLabel="碗星靈"
          />
          {offering && pickedSoup && (
            <Animated.Text
              style={[
                styles.flyingDrink,
                {
                  opacity: drinkOpacity,
                  transform: [
                    { translateX: drinkX },
                    { translateY: drinkY },
                    { scale: drinkScale },
                  ],
                },
              ]}
            >
              {pickedSoup.emoji}
            </Animated.Text>
          )}
          {offering && pickedSoup && (
            <Text testID="soup-offer-caption" style={styles.offerCaption}>
              {isSkip ? w.soup_offer_skip : w.soup_offer_done(pickedSoup.label)}
            </Text>
          )}
          {!offering && (
            <Text style={styles.spiritHint}>碗星靈等緊你請嘢食</Text>
          )}
        </Animated.View>

        <View style={[styles.grid, offering && { opacity: 0.45 }]} pointerEvents={offering ? 'none' : 'auto'}>
          {SOUPS.map((soup) => {
            const active = selected === soup.key;
            return (
              <Pressable
                key={soup.key}
                testID={`soup-${soup.key}`}
                onPress={() => onPick(soup.key)}
                disabled={offering}
                style={({ pressed }) => [
                  styles.card,
                  active && styles.cardActive,
                  pressed && !offering && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                ]}
              >
                <Text style={styles.emoji}>{soup.emoji}</Text>
                <Text style={styles.label}>{soup.label}</Text>
                <Text style={styles.cardSub}>{w.soup_subs[soup.key]}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <RitualDiaryFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 32,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  spiritStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    minHeight: SPIRIT_SIZE + 56,
  },
  spirit: {
    width: SPIRIT_SIZE,
    height: SPIRIT_SIZE,
  },
  flyingDrink: {
    position: 'absolute',
    fontSize: 44,
    top: '42%',
  },
  offerCaption: {
    marginTop: SPACING.sm,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  spiritHint: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 148,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  emoji: { fontSize: 40, marginBottom: SPACING.sm },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
