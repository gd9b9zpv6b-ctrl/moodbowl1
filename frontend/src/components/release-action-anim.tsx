import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { BowlWithDecor } from '@/src/components/bowl-with-decor';
import type { PlacedDecoration } from '@/src/constants/bowl-decorations';
import type { BowlReleaseKey } from '@/src/constants/bowl-release';
import type { Emotion } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type Props = {
  action: BowlReleaseKey;
  emotion?: Emotion | null;
  decorations?: PlacedDecoration[];
  /** Diary / no-bowl framing */
  diaryMode?: boolean;
  caption: string;
  onDone: () => void;
};

const DURATION = 1400;

/**
 * Short symbolic animation after picking how to handle today's bowl / diary.
 */
export function ReleaseActionAnim({
  action,
  emotion,
  decorations = [],
  diaryMode,
  caption,
  onDone,
}: Props) {
  const bowlY = useRef(new Animated.Value(0)).current;
  const bowlX = useRef(new Animated.Value(0)).current;
  const bowlRotate = useRef(new Animated.Value(0)).current;
  const bowlScale = useRef(new Animated.Value(1)).current;
  const bowlOpacity = useRef(new Animated.Value(1)).current;
  const fxOpacity = useRef(new Animated.Value(0)).current;
  const fxY = useRef(new Animated.Value(0)).current;
  const fxScale = useRef(new Animated.Value(0.6)).current;
  const splash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bowlY.setValue(0);
    bowlX.setValue(0);
    bowlRotate.setValue(0);
    bowlScale.setValue(1);
    bowlOpacity.setValue(1);
    fxOpacity.setValue(0);
    fxY.setValue(0);
    fxScale.setValue(0.6);
    splash.setValue(0);

    let anim: Animated.CompositeAnimation;

    switch (action) {
      case 'empty':
        // Tip bowl · pour bits downward
        anim = Animated.parallel([
          Animated.timing(bowlRotate, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
              Animated.timing(fxOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(fxY, {
                toValue: 1,
                duration: 900,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(fxScale, {
                toValue: 1.2,
                duration: 900,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(900),
            Animated.timing(fxOpacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
        ]);
        break;

      case 'set_aside':
        // Slide down + lid covers
        anim = Animated.parallel([
          Animated.timing(bowlY, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bowlScale, {
            toValue: 0.85,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(250),
            Animated.parallel([
              Animated.timing(fxOpacity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
              }),
              Animated.timing(fxY, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
        break;

      case 'send_away':
        // Float up and fade · bird flies
        anim = Animated.parallel([
          Animated.timing(bowlY, {
            toValue: -1,
            duration: 1100,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bowlOpacity, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(bowlScale, {
            toValue: 0.55,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(fxOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fxY, {
              toValue: -1,
              duration: 1200,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(fxScale, {
              toValue: 1.4,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ]);
        break;

      case 'let_flow':
      case 'wash':
        // Drift downstream and fade
        anim = Animated.parallel([
          Animated.timing(bowlX, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(bowlY, {
              toValue: -0.18,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(bowlY, {
              toValue: 0.12,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(bowlY, {
              toValue: -0.08,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(bowlY, {
              toValue: 0,
              duration: 260,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(700),
            Animated.timing(bowlOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(fxOpacity, {
            toValue: 0.85,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(splash, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        break;

      case 'keep_hug':
      default:
        // Soft pulse hug
        anim = Animated.parallel([
          Animated.sequence([
            Animated.timing(bowlScale, {
              toValue: 1.18,
              duration: 450,
              easing: Easing.out(Easing.back(1.6)),
              useNativeDriver: true,
            }),
            Animated.timing(bowlScale, {
              toValue: 1.05,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(bowlScale, {
              toValue: 1.12,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(bowlScale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(fxOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.delay(800),
            Animated.timing(fxOpacity, {
              toValue: 0.35,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]);
        break;
    }

    anim.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => {
      anim.stop();
    };
  }, [action, bowlOpacity, bowlRotate, bowlScale, bowlX, bowlY, fxOpacity, fxScale, fxY, onDone, splash]);

  const rotate = bowlRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-42deg'],
  });
  const translateY = bowlY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-120, 0, 70],
  });
  const pourY = fxY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 90],
  });
  const lidY = fxY.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, -8],
  });
  const birdY = fxY.interpolate({
    inputRange: [-1, 0],
    outputRange: [-130, 0],
  });
  const splashScale = splash.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.5],
  });
  const translateX = bowlX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 96],
  });

  const subject = emotion ? (
    <BowlWithDecor emotion={emotion} size={160} radius={RADIUS.lg} decorations={decorations} />
  ) : (
    <View style={styles.diaryCard}>
      <Text style={styles.diaryEmoji}>{diaryMode ? '📔' : '🥣'}</Text>
    </View>
  );

  const fxEmoji =
    action === 'empty'
      ? diaryMode
        ? '📝'
        : '💧'
      : action === 'set_aside'
        ? '🫙'
        : action === 'send_away'
          ? '🕊️'
          : action === 'let_flow' || action === 'wash'
            ? '🌊'
            : '🤗';

  return (
    <View style={styles.wrap} testID={`release-anim-${action}`}>
      <View style={styles.stage}>
        <Animated.View
          style={{
            opacity: bowlOpacity,
            transform: [
              { translateX },
              { translateY },
              { rotate },
              { scale: bowlScale },
            ],
          }}
        >
          {subject}
        </Animated.View>

        {action === 'empty' && (
          <Animated.Text
            style={[
              styles.fx,
              {
                opacity: fxOpacity,
                transform: [{ translateY: pourY }, { scale: fxScale }],
              },
            ]}
          >
            {fxEmoji}
          </Animated.Text>
        )}

        {action === 'set_aside' && (
          <Animated.Text
            style={[
              styles.fx,
              {
                opacity: fxOpacity,
                transform: [{ translateY: lidY }, { scale: 1.2 }],
              },
            ]}
          >
            {fxEmoji}
          </Animated.Text>
        )}

        {action === 'send_away' && (
          <Animated.Text
            style={[
              styles.fx,
              {
                opacity: fxOpacity,
                transform: [{ translateY: birdY }, { translateX: 40 }, { scale: fxScale }],
              },
            ]}
          >
            {fxEmoji}
          </Animated.Text>
        )}

        {(action === 'let_flow' || action === 'wash') && (
          <Animated.Text
            style={[
              styles.fx,
              {
                opacity: fxOpacity,
                top: '62%',
                transform: [{ translateX: 28 }, { scale: splashScale }],
              },
            ]}
          >
            {fxEmoji}
          </Animated.Text>
        )}

        {action === 'keep_hug' && (
          <Animated.Text
            style={[
              styles.fx,
              {
                opacity: fxOpacity,
                transform: [{ scale: bowlScale }],
                top: '8%',
              },
            ]}
          >
            🤗
          </Animated.Text>
        )}
      </View>

      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    minHeight: 280,
  },
  stage: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryCard: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryEmoji: { fontSize: 56 },
  fx: {
    position: 'absolute',
    fontSize: 40,
    top: '42%',
  },
  fxSide: {
    position: 'absolute',
    fontSize: 28,
    top: '40%',
  },
  leftDrop: { left: 18 },
  rightDrop: { right: 18 },
  caption: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
