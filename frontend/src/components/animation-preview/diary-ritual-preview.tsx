import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

type RitualKey = 'release' | 'share' | 'garden' | 'lock' | 'later';

type RitualConfig = {
  key: RitualKey;
  label: string;
  shortLabel: string;
  description: string;
  result: string;
  accent: string;
  tint: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const RITUALS: RitualConfig[] = [
  {
    key: 'release',
    label: '一步一步摺成紙飛機',
    shortLabel: '紙飛機',
    description: '先摺左右機翼 · 對摺機身 · 最後先飛走',
    result: '紙飛機飛走咗 · 真正刪除前會再次確認',
    accent: '#78AFC5',
    tint: '#EAF6FA',
    icon: 'send',
  },
  {
    key: 'share',
    label: '摺好封信 · 放入信封',
    shortLabel: '信封',
    description: '日記先對摺成信紙 · 放入信封 · 再合上封口',
    result: '封好咗 · 呢度冇傳送任何日記',
    accent: '#C58EA7',
    tint: '#FFF0F5',
    icon: 'mail',
  },
  {
    key: 'garden',
    label: '將信埋入泥土 · 長成樹苗',
    shortLabel: '樹苗',
    description: '摺好封信 · 放入泥土 · 泥土合上後慢慢發芽',
    result: '今日嘅信長成咗一棵小樹苗',
    accent: '#7FA889',
    tint: '#EFF8ED',
    icon: 'sun',
  },
  {
    key: 'lock',
    label: '將信放入盒 · 合上再鎖好',
    shortLabel: '鎖盒',
    description: '摺好封信 · 放入打開嘅盒 · 合蓋後上鎖',
    result: '收好咗 · 只有你解鎖先睇到',
    accent: '#9B87B3',
    tint: '#F5F0FA',
    icon: 'lock',
  },
  {
    key: 'later',
    label: '將信放入書枱櫃桶',
    shortLabel: '書枱',
    description: '打開櫃桶 · 將摺好嘅信放入去 · 再輕輕關上',
    result: '已經放入書枱 · 你想幾時再決定都得',
    accent: '#B08F68',
    tint: '#FAF4EA',
    icon: 'clock',
  },
];

export function DiaryRitualPreview() {
  const [activeKey, setActiveKey] = useState<RitualKey>('release');
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const active = RITUALS.find((item) => item.key === activeKey) ?? RITUALS[0];
  const emotion = EMOTION_BY_KEY.anxious;

  const reset = (nextKey?: RitualKey) => {
    progress.stopAnimation();
    progress.setValue(0);
    setPlaying(false);
    setCompleted(false);
    if (nextKey) setActiveKey(nextKey);
  };

  const play = () => {
    if (playing) return;
    reset();
    setPlaying(true);

    Animated.timing(progress, {
      toValue: 1,
      duration: 4600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      setPlaying(false);
      if (finished) setCompleted(true);
    });
  };

  const pageTransform = getPageTransform(activeKey, progress);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.eyebrow}>第二組 · 完成日記之後</Text>
      <Text style={styles.sectionTitle}>由你決定 · 呢一頁去邊度</Text>
      <Text style={styles.sectionHint}>
        所有畫面都係安全預覽 · 唔會儲存、刪除或者分享任何內容。
      </Text>

      <View style={styles.ritualList}>
        {RITUALS.map((item) => {
          const selected = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              testID={`ritual-${item.key}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => reset(item.key)}
              style={({ pressed }) => [
                styles.ritualChoice,
                selected && { borderColor: item.accent, backgroundColor: item.tint },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.ritualIcon, { backgroundColor: item.accent + '20' }]}>
                <Feather name={item.icon} size={17} color={item.accent} />
              </View>
              <View style={styles.ritualChoiceCopy}>
                <Text style={styles.ritualShort}>{item.shortLabel}</Text>
                <Text numberOfLines={2} style={styles.ritualChoiceDescription}>
                  {item.description}
                </Text>
              </View>
              {selected && <Feather name="check" size={18} color={item.accent} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.previewCard, { backgroundColor: active.tint }]}>
        <View style={styles.previewHeader}>
          <View style={styles.previewHeaderCopy}>
            <Text style={styles.previewTitle}>{active.label}</Text>
            <Text style={styles.previewDescription}>{active.description}</Text>
          </View>
          <Pressable
            testID="ritual-reset"
            accessibilityLabel="重新播放預覽"
            onPress={() => reset()}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Feather name="rotate-ccw" size={17} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.stage}>
          <RitualDestination
            ritual={active.key}
            accent={active.accent}
            progress={progress}
          />

          <FoldingDiaryPage
            emotion={emotion}
            progress={progress}
            ritual={active.key}
            transform={pageTransform}
          />
        </View>

        {completed ? (
          <View style={styles.completeBanner}>
            <Feather name="check-circle" size={18} color={active.accent} />
            <Text style={styles.completeText}>{active.result}</Text>
          </View>
        ) : (
          <Pressable
            testID="ritual-play"
            disabled={playing}
            onPress={play}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: active.accent },
              (pressed || playing) && styles.pressed,
            ]}
          >
            <Feather name={playing ? 'more-horizontal' : 'play'} size={17} color="#FFF" />
            <Text style={styles.playButtonText}>{playing ? '播放緊…' : '播放呢個預覽'}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.privacyNote}>
        <Feather name="shield" size={18} color={COLORS.primary} />
        <Text style={styles.privacyText}>
          分享俾家長或老師會留到下一階段 · 要先完成收件權限、撤回分享同存取紀錄。
        </Text>
      </View>
    </View>
  );
}

function FoldingDiaryPage({
  emotion,
  progress,
  ritual,
  transform,
}: {
  emotion: (typeof EMOTION_BY_KEY)[string];
  progress: Animated.Value;
  ritual: RitualKey;
  transform: ReturnType<typeof getPageTransform>;
}) {
  const isPlane = ritual === 'release';
  const sheetHeight = isPlane
    ? progress.interpolate({
        inputRange: [0, 0.16, 0.34, 0.52, 1],
        outputRange: [170, 170, 72, 22, 22],
      })
    : progress.interpolate({
        inputRange: [0, 0.12, 0.32, 0.36, 0.54, 1],
        outputRange: [170, 170, 86, 86, 40, 40],
      });
  const sheetWidth = isPlane
    ? progress.interpolate({
        inputRange: [0, 0.16, 0.34, 0.52, 1],
        outputRange: [225, 160, 118, 104, 104],
      })
    : progress.interpolate({
        inputRange: [0, 0.32, 0.54, 0.58, 1],
        outputRange: [225, 225, 168, 112, 112],
      });

  return (
    <Animated.View
      testID="ritual-diary-page"
      style={[
        styles.diaryPage,
        {
          height: sheetHeight,
          overflow: isPlane ? 'visible' : 'hidden',
          transform,
          width: sheetWidth,
        },
      ]}
    >
      <View style={styles.sheetWriting}>
        <View style={styles.pageTop}>
          <EmotionVisual emotion={emotion} size={52} radius={RADIUS.md} />
          <View style={styles.pageHeading}>
            <Text style={styles.pageDate}>今日 · 9月6日</Text>
            <Text style={styles.pageEmotion}>而家覺得 焦慮</Text>
          </View>
        </View>
        <View style={styles.paperLine} />
        <View style={[styles.paperLine, { width: '88%' }]} />
        <View style={[styles.paperLine, { width: '68%' }]} />
      </View>

      {isPlane ? (
        <>
          <Animated.View
            testID="ritual-plane-crease"
            style={[
              styles.planeCenterCrease,
              {
                transform: [
                  {
                    scaleY: progress.interpolate({
                      inputRange: [0, 0.16, 0.28],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            testID="ritual-fold-left-wing"
            style={[
              styles.planeWing,
              styles.planeWingLeft,
              {
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 0.34, 0.5],
                      outputRange: [0, 0, 1],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.34, 0.52],
                      outputRange: ['0deg', '0deg', '-24deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            testID="ritual-fold-right-wing"
            style={[
              styles.planeWing,
              styles.planeWingRight,
              {
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 0.36, 0.52],
                      outputRange: [0, 0, 1],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.36, 0.54],
                      outputRange: ['0deg', '0deg', '24deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            testID="ritual-plane-body"
            style={[
              styles.planeNose,
              {
                transform: [
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 0.42, 0.56],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      ) : (
        <>
          <Animated.View
            testID="ritual-fold-bottom"
            style={[
              styles.letterCrease,
              { top: '48%' },
              {
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 0.12, 0.28],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            testID="ritual-fold-top"
            style={[
              styles.letterCrease,
              { top: 18 },
              {
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 0.36, 0.5],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            testID="ritual-folded-letter"
            style={[
              styles.letterSideCrease,
              {
                transform: [
                  {
                    scaleY: progress.interpolate({
                      inputRange: [0, 0.52, 0.62],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}
    </Animated.View>
  );
}
function getPageTransform(
  ritual: RitualKey,
  progress: Animated.Value,
): (
  | { translateX: Animated.AnimatedInterpolation<number> }
  | { translateY: Animated.AnimatedInterpolation<number> }
  | { rotate: Animated.AnimatedInterpolation<string> }
)[] {
  switch (ritual) {
    case 'release':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.56, 0.72, 1],
            outputRange: [0, 8, 92, 196],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.56, 0.72, 1],
            outputRange: [0, 6, -28, -96],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.56, 0.78, 1],
            outputRange: ['0deg', '-6deg', '-16deg', '-28deg'],
          }),
        },
      ];
    case 'share':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.5, 0.58, 0.84, 1],
            outputRange: [0, 8, 36, 148, 156],
          }),
        },
      ];
    case 'garden':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.5, 0.6, 0.84, 1],
            outputRange: [0, 10, 70, 168, 176],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: ['0deg', '4deg', '10deg'],
          }),
        },
      ];
    case 'lock':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.5, 0.6, 0.84, 1],
            outputRange: [0, 8, 58, 138, 146],
          }),
        },
      ];
    case 'later':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.5, 0.6, 0.84, 1],
            outputRange: [0, 8, 70, 148, 154],
          }),
        },
      ];
  }
}
function RitualDestination({
  ritual,
  accent,
  progress,
}: {
  ritual: RitualKey;
  accent: string;
  progress: Animated.Value;
}) {
  if (ritual === 'release') {
    return null;
  }

  if (ritual === 'share') {
    return (
      <View testID="ritual-envelope" style={styles.destinationBottom}>
          <Animated.View
            testID="ritual-envelope-flap-open"
            style={[
              styles.envelopeFlapOpen,
              { borderBottomColor: accent + '66' },
              {
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.18, 0.48, 0.62],
                      outputRange: [-8, -18, -10, 8],
                    }),
                  },
                  {
                    scaleY: progress.interpolate({
                      inputRange: [0, 0.18, 0.48, 0.62],
                      outputRange: [0.7, 1, 1, 0],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={[styles.bigEnvelope, { borderColor: accent }]}>
            <View style={[styles.envelopeInner, { backgroundColor: accent + '16' }]} />
            <View style={styles.envelopeSlot} />
            <Animated.View
              style={{
                opacity: progress.interpolate({
                  inputRange: [0, 0.62, 0.78, 1],
                  outputRange: [0, 0, 1, 1],
                }),
              }}
            >
              <Feather name="heart" size={22} color={accent} />
            </Animated.View>
            <Animated.View
              testID="ritual-envelope-flap"
              style={[
                styles.envelopeFlapClosed,
                { backgroundColor: accent + '66' },
                {
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 0.42, 0.62, 1],
                        outputRange: [-28, -28, 0, 0],
                      }),
                    },
                    {
                      scaleY: progress.interpolate({
                        inputRange: [0, 0.42, 0.62, 1],
                        outputRange: [0, 0, 1, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
    );
  }

  if (ritual === 'garden') {
    return (
      <View testID="ritual-sapling" style={styles.destinationBottom}>
          <View style={styles.soil}>
            <Animated.View
              testID="ritual-soil-hole"
              style={[
                styles.soilHole,
                {
                  opacity: progress.interpolate({
                    inputRange: [0, 0.18, 0.46, 0.62],
                    outputRange: [0.4, 1, 1, 0],
                  }),
                  transform: [
                    {
                      scaleX: progress.interpolate({
                        inputRange: [0, 0.2, 0.48, 0.64],
                        outputRange: [0.7, 1, 0.85, 0.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              testID="ritual-soil-cover"
              style={[
                styles.soilCover,
                {
                  opacity: progress.interpolate({
                    inputRange: [0, 0.36, 0.52, 1],
                    outputRange: [0, 0, 1, 1],
                  }),
                  transform: [
                    {
                      scaleX: progress.interpolate({
                        inputRange: [0, 0.36, 0.58, 1],
                        outputRange: [0.35, 0.35, 1, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              testID="ritual-grown-sapling"
              style={[
                styles.sapling,
                {
                  opacity: progress.interpolate({
                    inputRange: [0, 0.48, 0.58, 1],
                    outputRange: [0, 0, 1, 1],
                  }),
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 0.48, 0.72, 1],
                        outputRange: [42, 42, 8, -18],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 0.48, 0.72, 1],
                        outputRange: [0.18, 0.18, 0.62, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.saplingCrown}>
                <View style={[styles.saplingLeaf, styles.saplingLeafLeft]} />
                <View style={[styles.saplingLeaf, styles.saplingLeafRight]} />
              </View>
              <View style={styles.saplingTrunk} />
            </Animated.View>
          </View>
        </View>
    );
  }

  if (ritual === 'lock') {
    return (
      <View testID="ritual-lock-box" style={styles.destinationBottom}>
          <View style={[styles.lockBox, { borderColor: accent, backgroundColor: accent + '22' }]}>
            <View style={styles.lockBoxOpening} />
            <Animated.View
              testID="ritual-box-lid"
              style={[
                styles.lockBoxLid,
                { backgroundColor: accent + '88', borderColor: accent },
                {
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 0.2, 0.48, 0.68, 1],
                        outputRange: [-42, -42, -42, 0, 0],
                      }),
                    },
                    {
                      rotate: progress.interpolate({
                        inputRange: [0, 0.2, 0.48, 0.68, 1],
                        outputRange: ['-16deg', '-16deg', '-16deg', '0deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              testID="ritual-box-lock"
              style={{
                opacity: progress.interpolate({
                  inputRange: [0, 0.58, 0.72, 1],
                  outputRange: [0, 0, 1, 1],
                }),
                transform: [
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 0.58, 0.78, 1],
                      outputRange: [0.55, 0.55, 1.08, 1],
                    }),
                  },
                ],
              }}
            >
              <Feather name="lock" size={27} color={accent} />
            </Animated.View>
          </View>
      </View>
    );
  }

  return (
    <View testID="ritual-desk" style={styles.destinationBottom}>
        <View style={[styles.deskUnit, { backgroundColor: accent + '44' }]}>
          <View style={styles.drawerCavity} />
          <Animated.View
            testID="ritual-drawer-front"
            style={[
              styles.drawerFront,
              {
                backgroundColor: accent,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.16, 0.58, 0.78, 1],
                      outputRange: [0, 34, 34, 0, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.drawerHandle} />
          </Animated.View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: SPACING.xxl },
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
  ritualList: { gap: SPACING.sm, marginVertical: SPACING.lg },
  ritualChoice: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: 12,
  },
  ritualIcon: {
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  ritualChoiceCopy: { flex: 1 },
  ritualShort: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  ritualChoiceDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  pressed: { opacity: 0.85 },
  previewCard: { borderRadius: RADIUS.lg, padding: SPACING.md },
  previewHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: SPACING.sm },
  previewHeaderCopy: { flex: 1 },
  previewTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  previewDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFB8',
    borderRadius: RADIUS.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stage: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.md,
    height: 310,
    justifyContent: 'flex-start',
    marginTop: SPACING.md,
    overflow: 'hidden',
    paddingTop: 28,
    position: 'relative',
  },
  diaryPage: {
    backgroundColor: '#FFFEFA',
    borderColor: '#E8E4DA',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    elevation: 2,
    height: 170,
    padding: 0,
    shadowColor: '#4C4C4C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    width: 225,
    zIndex: 2,
  },
  sheetWriting: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    padding: 14,
  },
  pageTop: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm },
  pageHeading: { flex: 1 },
  pageDate: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  pageEmotion: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  paperLine: {
    backgroundColor: '#D8E3E0',
    borderRadius: RADIUS.pill,
    height: 4,
    marginTop: 13,
    opacity: 0.8,
    width: '100%',
  },
  planeCenterCrease: {
    backgroundColor: '#C9B79A',
    bottom: 2,
    left: '50%',
    position: 'absolute',
    top: 2,
    width: 1,
  },
  planeWing: {
    backgroundColor: '#FFFEFA',
    borderColor: '#E8E4DA',
    borderWidth: 1,
    height: 12,
    position: 'absolute',
    top: 4,
    width: 46,
  },
  planeWingLeft: {
    left: -38,
  },
  planeWingRight: {
    right: -38,
  },
  planeNose: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 11,
    borderLeftColor: '#FFFEFA',
    borderLeftWidth: 26,
    borderTopColor: 'transparent',
    borderTopWidth: 11,
    height: 0,
    position: 'absolute',
    right: -18,
    top: 0,
    width: 0,
  },
  letterCrease: {
    alignSelf: 'center',
    backgroundColor: '#C9B79A',
    height: 1,
    left: 10,
    position: 'absolute',
    right: 10,
  },
  letterSideCrease: {
    backgroundColor: '#C9B79A',
    bottom: 4,
    position: 'absolute',
    right: '50%',
    top: 4,
    width: 1,
  },
  destinationBottom: {
    alignItems: 'center',
    bottom: 8,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: '100%',
    zIndex: 3,
  },
  foldSteps: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    width: '100%',
  },
  foldStep: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: RADIUS.pill,
    fontSize: 9,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  paperPlaneFlight: {
    height: 58,
    left: '50%',
    position: 'absolute',
    top: 92,
    width: 82,
    zIndex: 4,
  },
  planeTrail: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    height: 12,
    left: -48,
    opacity: 0.55,
    position: 'absolute',
    top: 31,
    width: 54,
  },
  paperPlaneBody: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 18,
    borderLeftWidth: 58,
    borderTopColor: 'transparent',
    borderTopWidth: 18,
    height: 0,
    left: 4,
    position: 'absolute',
    top: 10,
    width: 0,
  },
  paperPlaneWing: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 37,
    borderRightColor: 'transparent',
    borderRightWidth: 6,
    borderTopWidth: 27,
    height: 0,
    left: 13,
    position: 'absolute',
    top: 26,
    transform: [{ rotate: '-8deg' }],
    width: 0,
  },
  bigEnvelope: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 78,
    justifyContent: 'center',
    position: 'relative',
    width: 142,
  },
  envelopeInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.sm,
  },
  envelopeSlot: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8C7D0',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 10,
    position: 'absolute',
    top: 10,
    width: 108,
  },
  envelopeFlapOpen: {
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderLeftWidth: 52,
    borderRightColor: 'transparent',
    borderRightWidth: 52,
    height: 0,
    marginBottom: 4,
    width: 0,
  },
  envelopeFlapClosed: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    height: 38,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 138,
    zIndex: 3,
  },
  soil: {
    alignItems: 'center',
    backgroundColor: '#BFA17D',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    height: 62,
    justifyContent: 'flex-start',
    overflow: 'visible',
    position: 'relative',
    width: 176,
  },
  soilHole: {
    backgroundColor: '#6F5338',
    borderRadius: RADIUS.pill,
    height: 18,
    position: 'absolute',
    top: 10,
    width: 72,
  },
  soilCover: {
    backgroundColor: '#A98763',
    borderRadius: RADIUS.pill,
    height: 18,
    position: 'absolute',
    top: 8,
    width: 96,
  },
  sapling: {
    alignItems: 'center',
    bottom: 16,
    height: 86,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: 82,
  },
  saplingCrown: {
    height: 48,
    position: 'relative',
    width: 78,
  },
  saplingLeaf: {
    backgroundColor: '#78A66E',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 7,
    height: 38,
    position: 'absolute',
    width: 46,
  },
  saplingLeafLeft: {
    left: 1,
    transform: [{ rotate: '-18deg' }],
  },
  saplingLeafRight: {
    right: 1,
    transform: [{ rotate: '108deg' }],
  },
  saplingTrunk: {
    backgroundColor: '#8E6B4D',
    borderRadius: RADIUS.pill,
    height: 43,
    marginTop: -9,
    width: 8,
  },
  lockBox: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    height: 86,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: 145,
  },
  lockBoxOpening: {
    backgroundColor: '#3F3348',
    borderRadius: RADIUS.sm,
    height: 28,
    opacity: 0.18,
    position: 'absolute',
    top: 10,
    width: 108,
  },
  lockBoxLid: {
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 26,
    left: -2,
    position: 'absolute',
    top: -2,
    width: 145,
    zIndex: 2,
  },
  deskUnit: {
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    height: 82,
    justifyContent: 'flex-start',
    paddingTop: 13,
    position: 'relative',
    width: 220,
  },
  drawerCavity: {
    backgroundColor: '#57483F',
    borderRadius: RADIUS.sm,
    height: 48,
    width: 166,
  },
  drawerFront: {
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    top: 13,
    width: 166,
    zIndex: 3,
  },
  drawerHandle: {
    backgroundColor: '#FFFFFF99',
    borderRadius: RADIUS.pill,
    height: 5,
    width: 38,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 48,
  },
  playButtonText: { color: COLORS.textInverse, fontSize: 14, fontWeight: '800' },
  completeBanner: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFBB',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  completeText: { color: COLORS.textPrimary, flex: 1, fontSize: 12, fontWeight: '700' },
  privacyNote: {
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight + '66',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  privacyText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
