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
      duration: 2600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      setPlaying(false);
      if (finished) setCompleted(true);
    });
  };

  const pageTransform = getPageTransform(activeKey, progress);
  const pageOpacity =
    progress.interpolate({
      inputRange: [0, 0.68, 0.86, 1],
      outputRange: [1, 1, 0.12, 0],
    });

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

          <Animated.View
            testID="ritual-diary-page"
            style={[
              styles.diaryPage,
              {
                opacity: pageOpacity,
                transform: pageTransform,
              },
            ]}
          >
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
            {activeKey === 'release' && (
              <View pointerEvents="none" style={styles.foldOverlay}>
                <Animated.View
                  style={[
                    styles.foldWing,
                    styles.foldWingLeft,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.08, 0.5, 0.58],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: progress.interpolate({
                            inputRange: [0, 0.28, 0.5],
                            outputRange: [0, 0, 48],
                          }),
                        },
                        {
                          rotate: progress.interpolate({
                            inputRange: [0, 0.28, 0.5],
                            outputRange: ['0deg', '0deg', '24deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.foldWing,
                    styles.foldWingRight,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.08, 0.5, 0.58],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: progress.interpolate({
                            inputRange: [0, 0.28, 0.5],
                            outputRange: [0, 0, -48],
                          }),
                        },
                        {
                          rotate: progress.interpolate({
                            inputRange: [0, 0.28, 0.5],
                            outputRange: ['0deg', '0deg', '-24deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.foldCrease} />
              </View>
            )}
            {activeKey !== 'release' && (
              <View pointerEvents="none" style={styles.foldOverlay}>
                <Animated.View
                  testID="ritual-folded-letter"
                  style={[
                    styles.letterFoldPanel,
                    styles.letterFoldPanelTop,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.1, 0.58, 0.72],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          translateY: progress.interpolate({
                            inputRange: [0, 0.12, 0.5],
                            outputRange: [0, 0, 34],
                          }),
                        },
                        {
                          scaleY: progress.interpolate({
                            inputRange: [0, 0.12, 0.5],
                            outputRange: [1, 1, 0.32],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.letterFoldPanel,
                    styles.letterFoldPanelBottom,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.1, 0.58, 0.72],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          translateY: progress.interpolate({
                            inputRange: [0, 0.12, 0.5],
                            outputRange: [0, 0, -34],
                          }),
                        },
                        {
                          scaleY: progress.interpolate({
                            inputRange: [0, 0.12, 0.5],
                            outputRange: [1, 1, 0.32],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            )}
          </Animated.View>
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

function getPageTransform(
  ritual: RitualKey,
  progress: Animated.Value,
): (
  | { translateX: Animated.AnimatedInterpolation<number> }
  | { translateY: Animated.AnimatedInterpolation<number> }
  | { scale: Animated.AnimatedInterpolation<number> }
  | { rotate: Animated.AnimatedInterpolation<string> }
)[] {
  switch (ritual) {
    case 'release':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.48, 0.72, 1],
            outputRange: [0, 0, 18, 42],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.48, 0.72, 1],
            outputRange: [0, 8, 34, 42],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.24, 0.5, 0.72, 1],
            outputRange: [1, 0.96, 0.64, 0.28, 0.2],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.24, 0.5, 1],
            outputRange: ['0deg', '-2deg', '8deg', '18deg'],
          }),
        },
      ];
    case 'share':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.3, 0.56, 0.86, 1],
            outputRange: [0, 10, 42, 158, 164],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.3, 0.56, 0.86, 1],
            outputRange: [1, 0.82, 0.56, 0.38, 0.34],
          }),
        },
      ];
    case 'garden':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.32, 0.62, 0.84, 1],
            outputRange: [0, 12, 82, 176, 182],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.32, 0.62, 0.84, 1],
            outputRange: [1, 0.78, 0.48, 0.22, 0.18],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.62, 1],
            outputRange: ['0deg', '4deg', '12deg'],
          }),
        },
      ];
    case 'lock':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.32, 0.62, 0.84, 1],
            outputRange: [0, 12, 68, 148, 152],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.32, 0.62, 0.84, 1],
            outputRange: [1, 0.8, 0.54, 0.34, 0.3],
          }),
        },
      ];
    case 'later':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.48, 0.82, 1],
            outputRange: [0, 0, 18, 22],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.34, 0.62, 0.84, 1],
            outputRange: [0, 12, 78, 154, 158],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.62, 1],
            outputRange: ['0deg', '-3deg', '-5deg'],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.34, 0.62, 0.84, 1],
            outputRange: [1, 0.8, 0.52, 0.34, 0.3],
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
    return (
      <>
        <View pointerEvents="none" style={styles.foldSteps}>
          {['摺機翼', '對摺機身', '完成起飛'].map((label, index) => (
            <Animated.Text
              key={label}
              style={[
                styles.foldStep,
                {
                  color: accent,
                  opacity: progress.interpolate({
                    inputRange: [
                      Math.max(0, index * 0.22 - 0.05),
                      index * 0.22 + 0.06,
                      index * 0.22 + 0.26,
                      Math.min(1, index * 0.22 + 0.38),
                    ],
                    outputRange: [0.2, 1, 1, 0.25],
                  }),
                },
              ]}
            >
              {index + 1}. {label}
            </Animated.Text>
          ))}
        </View>
        <Animated.View
          testID="ritual-paper-plane"
          style={[
            styles.paperPlaneFlight,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.58, 0.94, 1],
                outputRange: [0, 0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.52, 1],
                    outputRange: [-80, -65, 205],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.52, 1],
                    outputRange: [92, 82, -68],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 0.62, 1],
                    outputRange: ['5deg', '-8deg', '-24deg'],
                  }),
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.58, 1],
                    outputRange: [0.65, 1, 0.72],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.planeTrail, { borderColor: accent }]} />
          <View style={[styles.paperPlaneBody, { borderLeftColor: accent }]} />
          <View style={[styles.paperPlaneWing, { borderTopColor: accent + '88' }]} />
        </Animated.View>
      </>
    );
  }

  if (ritual === 'share') {
    return (
      <View testID="ritual-envelope" style={styles.destinationBottom}>
        <View style={[styles.bigEnvelope, { borderColor: accent }]}>
          <View style={[styles.envelopeInner, { backgroundColor: accent + '16' }]} />
          <Feather name="heart" size={22} color={accent} />
          <Animated.View
            testID="ritual-envelope-flap"
            style={[
              styles.bigEnvelopeFlap,
              { borderTopColor: accent + '55' },
              {
                transform: [
                  { perspective: 500 },
                  {
                    rotateX: progress.interpolate({
                      inputRange: [0, 0.72, 0.9, 1],
                      outputRange: ['-78deg', '-78deg', '0deg', '0deg'],
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
            testID="ritual-soil-cover"
            style={[
              styles.soilCover,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 0.7, 0.84, 1],
                  outputRange: [0, 0, 1, 1],
                }),
              },
            ]}
          />
          <Animated.View
            testID="ritual-grown-sapling"
            style={[
              styles.sapling,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 0.78, 0.86, 1],
                  outputRange: [0, 0, 1, 1],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.78, 1],
                      outputRange: [35, 35, -22],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 0.78, 1],
                      outputRange: [0.2, 0.2, 1],
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
          <Animated.View
            testID="ritual-box-lid"
            style={[
              styles.lockBoxLid,
              { backgroundColor: accent + '55', borderColor: accent },
              {
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.7, 0.88, 1],
                      outputRange: [-35, -35, 0, 0],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.7, 0.88, 1],
                      outputRange: ['-9deg', '-9deg', '0deg', '0deg'],
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
                inputRange: [0, 0.86, 0.94, 1],
                outputRange: [0, 0, 1, 1],
              }),
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.86, 1],
                    outputRange: [0.7, 0.7, 1],
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
                    inputRange: [0, 0.18, 0.7, 0.9, 1],
                    outputRange: [0, 28, 28, 0, 0],
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
    padding: 14,
    shadowColor: '#4C4C4C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    width: 225,
    zIndex: 2,
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
  foldOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  foldWing: {
    backgroundColor: '#F7F3EACC',
    borderColor: '#C9BFAF',
    borderStyle: 'dashed',
    borderWidth: 1,
    height: '100%',
    position: 'absolute',
    top: 0,
    width: '50%',
  },
  foldWingLeft: {
    borderBottomLeftRadius: RADIUS.sm,
    borderTopLeftRadius: RADIUS.sm,
    left: 0,
  },
  foldWingRight: {
    borderBottomRightRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
    right: 0,
  },
  foldCrease: {
    borderLeftColor: '#AFA598',
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    height: '100%',
    left: '50%',
    opacity: 0.65,
    position: 'absolute',
  },
  letterFoldPanel: {
    backgroundColor: '#FAF7F0F2',
    borderColor: '#C9BFAF',
    borderStyle: 'dashed',
    height: '50%',
    left: 0,
    position: 'absolute',
    width: '100%',
  },
  letterFoldPanelTop: {
    borderBottomWidth: 1,
    top: 0,
  },
  letterFoldPanelBottom: {
    borderTopWidth: 1,
    bottom: 0,
  },
  destinationBottom: {
    alignItems: 'center',
    bottom: 14,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: '100%',
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
  bigEnvelopeFlap: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 69,
    borderRightColor: 'transparent',
    borderRightWidth: 69,
    borderTopWidth: 52,
    height: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 0,
    zIndex: 3,
  },
  soil: {
    alignItems: 'center',
    backgroundColor: '#BFA17D',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    height: 43,
    justifyContent: 'flex-start',
    position: 'relative',
    width: 158,
  },
  soilCover: {
    backgroundColor: '#A98763',
    borderRadius: RADIUS.pill,
    height: 16,
    position: 'absolute',
    top: 4,
    width: 84,
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
    height: 80,
    justifyContent: 'center',
    position: 'relative',
    width: 145,
  },
  lockBoxLid: {
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 24,
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
