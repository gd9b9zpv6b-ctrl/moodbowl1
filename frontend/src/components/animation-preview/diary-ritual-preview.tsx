import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { Circle, Ellipse, Path, Rect as SvgRect, Svg } from 'react-native-svg';

type RitualKey = 'release' | 'share' | 'garden' | 'lock' | 'later';
type DestLayer = 'back' | 'front';

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

const PAGE_W = 225;
const PAGE_H = 170;
const HALF_W = 113;
const HALF_H = 85;
const PACKET_H = 43;
const NOTE_W = 44;
const NOTE_H = 18;

const PRESERVE_3D: ViewStyle =
  Platform.OS === 'web' ? ({ transformStyle: 'preserve-3d' } as ViewStyle) : {};

const RITUALS: RitualConfig[] = [
  {
    key: 'release',
    label: '對摺成紙飛機',
    shortLabel: '紙飛機',
    description: '同一頁紙對摺成飛機 · 向住海島飛到唔見',
    result: '紙飛機飛咗去海島 · 真正刪除前會再次確認',
    accent: '#78AFC5',
    tint: '#EAF6FA',
    icon: 'send',
  },
  {
    key: 'share',
    label: '對摺成信 · 放入信封',
    shortLabel: '信封',
    description: '同一頁紙對摺細 · 沿開口滑入信封 · 再合上封口',
    result: '封好咗 · 呢度冇傳送任何日記',
    accent: '#C58EA7',
    tint: '#FFF0F5',
    icon: 'mail',
  },
  {
    key: 'garden',
    label: '將信埋入泥土 · 長成樹苗',
    shortLabel: '樹苗',
    description: '同一頁紙對摺細 · 放入泥洞 · 蓋上之後發芽',
    result: '今日嘅信長成咗一棵小樹苗',
    accent: '#7FA889',
    tint: '#EFF8ED',
    icon: 'sun',
  },
  {
    key: 'lock',
    label: '將信放入盒 · 合上再鎖好',
    shortLabel: '鎖盒',
    description: '同一頁紙對摺細 · 放入打開嘅盒 · 合蓋後上鎖',
    result: '收好咗 · 只有你解鎖先睇到',
    accent: '#9B87B3',
    tint: '#F5F0FA',
    icon: 'lock',
  },
  {
    key: 'later',
    label: '將信放入書枱櫃桶',
    shortLabel: '書枱',
    description: '打開櫃桶 · 將信再對摺細 · 放入櫃桶裏便 · 再關上',
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
      duration: 6400,
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
            layer="back"
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
          <RitualDestination
            layer="front"
            ritual={active.key}
            accent={active.accent}
            progress={progress}
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

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function useProgressFlag(progress: Animated.Value, threshold: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const next = value >= threshold;
      setOn((prev) => (prev === next ? prev : next));
    });
    return () => progress.removeListener(id);
  }, [progress, threshold]);
  return on;
}

function FoldedNote() {
  return (
    <View testID="ritual-folded-note" style={styles.finishedPacket}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 44 18" width="100%">
        <SvgRect fill="#F7F1E4" height="17" rx="2.5" stroke="#D7C6AA" strokeWidth="1" width="43" x="0.5" y="0.5" />
        <Path d="M1 9 H43" stroke="#E3D3B8" strokeWidth="1" />
        <Path d="M22 1 V17" stroke="#EDE1CE" strokeWidth="0.8" />
        <SvgRect fill="#E7A8B8" height="7" rx="1" width="9" x="31" y="5" />
        <Path d="M31 5 L35.5 8.5 L40 5" fill="none" stroke="#F7F1E4" strokeWidth="0.8" />
      </Svg>
    </View>
  );
}

function PaperPlaneMarkings() {
  return (
    <View testID="ritual-plane-markings" style={styles.finishedPacket}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 156 58" width="100%">
        <Path
          d="M4 29 L152 5 L116 29 L152 53 Z"
          fill="#FFFDF8"
          stroke="#E0D1BA"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <Path d="M4 29 L116 29 L152 5 Z" fill="#F3E6D0" />
        <Path d="M4 29 L116 29 L152 53 Z" fill="#E9DCC4" />
        <Path d="M4 29 L152 5" stroke="#CDBDA6" strokeWidth="1.3" />
        <Path d="M4 29 L152 53" stroke="#D5C6B0" strokeWidth="1" />
        <Path d="M116 29 L152 5" stroke="#EFE6D6" strokeWidth="1" />
      </Svg>
    </View>
  );
}

function planeClipPolygon(t: number) {
  const pts = [
    [lerp(100, 96, t), lerp(0, 8, t)],
    [lerp(0, 4, t), lerp(0, 38, t)],
    [lerp(0, 42, t), lerp(100, 54, t)],
    [lerp(100, 62, t), lerp(100, 96, t)],
  ];
  return `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}

function usePlaneClip(progress: Animated.Value, enabled: boolean) {
  const [clip, setClip] = useState('none');

  useEffect(() => {
    if (!enabled) {
      setClip('none');
      return;
    }
    const update = (value: number) => {
      if (value < 0.36) {
        setClip('none');
        return;
      }
      setClip(planeClipPolygon(Math.min(1, (value - 0.36) / 0.18)));
    };
    const id = progress.addListener(({ value }) => update(value));
    return () => progress.removeListener(id);
  }, [enabled, progress]);

  return clip;
}

function DiaryWriting({
  emotion,
  offsetX = 0,
  offsetY = 0,
}: {
  emotion: (typeof EMOTION_BY_KEY)[string];
  offsetX?: number;
  offsetY?: number;
}) {
  return (
    <View style={[styles.sheetWriting, { left: offsetX, top: offsetY }]}>
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
  );
}

function PaperBack() {
  return (
    <View style={styles.paperBackFill}>
      <View style={styles.paperBackGrain} />
    </View>
  );
}

function FoldFlap({
  testID,
  axis,
  hingeSize,
  angle,
  style,
  front,
  back,
}: {
  testID?: string;
  axis: 'x' | 'y';
  hingeSize: number;
  angle: Animated.AnimatedInterpolation<string>;
  style: ViewStyle | ViewStyle[];
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  const hinge = hingeSize / 2;
  return (
    <Animated.View
      testID={testID}
      style={[
        styles.flap,
        style,
        PRESERVE_3D,
        {
          transform:
            axis === 'y'
              ? [
                  { perspective: 1600 },
                  { translateX: hinge },
                  { rotateY: angle },
                  { translateX: -hinge },
                ]
              : [
                  { perspective: 1600 },
                  { translateY: hinge },
                  { rotateX: angle },
                  { translateY: -hinge },
                ],
        },
      ]}
    >
      <View style={[styles.face, styles.faceFront]}>{front}</View>
      <View
        style={[
          styles.face,
          styles.faceBack,
          PRESERVE_3D,
          {
            transform: axis === 'y' ? [{ rotateY: '180deg' }] : [{ rotateX: '180deg' }],
          },
        ]}
      >
        {back}
      </View>
    </Animated.View>
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
  const planeClip = usePlaneClip(progress, isPlane);
  const packetReady = useProgressFlag(progress, isPlane ? 0.48 : 0.81);
  const firstFold = progress.interpolate({
    inputRange: [0.04, 0.22],
    outputRange: ['0deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const secondFold = progress.interpolate({
    inputRange: [0.28, 0.4],
    outputRange: ['0deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const thirdFold = progress.interpolate({
    inputRange: [0.46, 0.56],
    outputRange: ['0deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const fourthFold = progress.interpolate({
    inputRange: [0.62, 0.7],
    outputRange: ['0deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const fifthFold = progress.interpolate({
    inputRange: [0.74, 0.8],
    outputRange: ['0deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const sheetHeight = isPlane
    ? progress.interpolate({
        inputRange: [0, 0.32, 0.36, 0.52, 1],
        outputRange: [PAGE_H, PAGE_H, PAGE_H, 58, 58],
      })
    : progress.interpolate({
        inputRange: [0, 0.22, 0.26, 0.4, 0.44, 0.7, 0.73, 1],
        outputRange: [PAGE_H, PAGE_H, HALF_H, HALF_H, PACKET_H, PACKET_H, NOTE_H, NOTE_H],
      });
  const sheetWidth = progress.interpolate({
    inputRange: isPlane
      ? [0, 0.28, 0.32, 0.52, 1]
      : [0, 0.56, 0.6, 0.8, 0.83, 1],
    outputRange: isPlane
      ? [PAGE_W, PAGE_W, HALF_W, 156, 156]
      : [PAGE_W, PAGE_W, HALF_W, HALF_W, NOTE_W, NOTE_W],
  });
  const sheetZ = isPlane
    ? 3
    : progress.interpolate({
        inputRange: [0, 0.9, 0.92],
        outputRange: [3, 3, 0],
        extrapolate: 'clamp',
      });

  return (
    <Animated.View
      testID="ritual-diary-page"
      style={[
        styles.diaryPage,
        styles.foldPage,
        PRESERVE_3D,
        {
          height: sheetHeight,
          overflow: packetReady ? 'hidden' : 'visible',
          transform,
          width: sheetWidth,
          zIndex: sheetZ,
          ...(isPlane && !packetReady && planeClip !== 'none' ? { clipPath: planeClip } : null),
        } as ViewStyle,
      ]}
    >
      <View
        style={[
          styles.foldInner,
          styles.foldInnerAnchor,
          !packetReady && PRESERVE_3D,
          packetReady && styles.hiddenPacket,
        ]}
      >
        {isPlane ? (
          <>
            <View testID="ritual-plane-body" style={[styles.stayPanel, styles.panelRight]}>
              <DiaryWriting emotion={emotion} offsetX={-(PAGE_W - HALF_W)} />
            </View>
            <FoldFlap
              testID="ritual-fold-left-wing"
              axis="y"
              hingeSize={HALF_W}
              angle={firstFold}
              style={styles.panelLeft}
              front={<DiaryWriting emotion={emotion} />}
              back={<PaperBack />}
            />
            <View style={styles.verticalCrease} />
            <Animated.View
              testID="ritual-plane-spine"
              style={[
                styles.planeSpine,
                {
                  opacity: progress.interpolate({
                    inputRange: [0.38, 0.5],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </>
        ) : (
          <>
            <View style={[styles.stayPanel, styles.panelBottom]}>
              <DiaryWriting emotion={emotion} offsetY={-HALF_H} />
            </View>
            <FoldFlap
              testID="ritual-fold-bottom"
              axis="x"
              hingeSize={HALF_H}
              angle={firstFold}
              style={styles.panelTop}
              front={<DiaryWriting emotion={emotion} />}
              back={
                <View testID="ritual-folded-letter" style={[styles.secondFoldClip, PRESERVE_3D]}>
                  <View style={[styles.stayPanel, styles.secondPanelBottom]}>
                    <PaperBack />
                  </View>
                  <FoldFlap
                    testID="ritual-fold-top"
                    axis="x"
                    hingeSize={PACKET_H}
                    angle={secondFold}
                    style={styles.secondPanelTop}
                    front={<PaperBack />}
                    back={<PaperBack />}
                  />
                  <View style={styles.secondCrease} />
                </View>
              }
            />
            <FoldFlap
              testID="ritual-fold-side"
              axis="y"
              hingeSize={HALF_W}
              angle={thirdFold}
              style={styles.panelThird}
              front={<PaperBack />}
              back={<PaperBack />}
            />
            <FoldFlap
              testID="ritual-fold-note-top"
              axis="x"
              hingeSize={NOTE_H}
              angle={fourthFold}
              style={styles.panelFourth}
              front={<PaperBack />}
              back={<PaperBack />}
            />
            <FoldFlap
              testID="ritual-fold-note-side"
              axis="y"
              hingeSize={NOTE_W}
              angle={fifthFold}
              style={styles.panelFifth}
              front={<PaperBack />}
              back={<PaperBack />}
            />
            <View style={styles.horizontalCrease} />
          </>
        )}
      </View>
      {packetReady ? isPlane ? <PaperPlaneMarkings /> : <FoldedNote /> : null}
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
  | { scale: Animated.AnimatedInterpolation<number> }
)[] {
  switch (ritual) {
    case 'release':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.48, 0.58, 0.76, 0.9, 1],
            outputRange: [0, 0, 18, 62, 96, 118],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.48, 0.58, 0.76, 0.9, 1],
            outputRange: [0, 0, -10, -28, -44, -58],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.46, 0.54, 1],
            outputRange: ['0deg', '0deg', '-34deg', '-36deg'],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.48, 0.66, 0.84, 0.94, 1],
            outputRange: [1, 1, 0.62, 0.32, 0.1, 0],
          }),
        },
      ];
    case 'share':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.84, 0.93, 1],
            outputRange: [0, 0, 198, 206],
          }),
        },
      ];
    case 'garden':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.84, 0.93, 1],
            outputRange: [0, 0, 206, 214],
          }),
        },
      ];
    case 'lock':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.84, 0.93, 1],
            outputRange: [0, 0, 188, 196],
          }),
        },
      ];
    case 'later':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.84, 0.93, 1],
            outputRange: [0, 0, 212, 220],
          }),
        },
      ];
  }
}

const ISLAND_BOB = new Animated.Value(0);
let islandBobRunning = false;

function ensureIslandBob() {
  if (islandBobRunning) return;
  islandBobRunning = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(ISLAND_BOB, {
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(ISLAND_BOB, {
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        toValue: 0,
        useNativeDriver: false,
      }),
    ]),
  ).start();
}

function IslandArt({ layer }: { layer: DestLayer }) {
  useEffect(() => {
    ensureIslandBob();
  }, []);

  const bob = {
    transform: [
      {
        translateY: ISLAND_BOB.interpolate({
          inputRange: [0, 1],
          outputRange: [0, layer === 'back' ? 3 : 4],
        }),
      },
    ],
  };

  if (layer === 'back') {
    return (
      <Animated.View style={bob}>
        <Svg height={132} viewBox="0 0 164 132" width={164}>
        <Ellipse cx="82" cy="108" rx="80" ry="20" fill="#9FD0DC" />
        <Ellipse cx="82" cy="112" rx="74" ry="16" fill="#6FAEBF" />
        <Ellipse cx="82" cy="116" rx="62" ry="10" fill="#5A9AAD" />
        <Ellipse cx="46" cy="104" rx="16" ry="3.5" fill="#F4FBFC" opacity="0.75" />
        <Ellipse cx="118" cy="110" rx="11" ry="2.6" fill="#E7F6F8" opacity="0.65" />
        <Ellipse cx="88" cy="118" rx="8" ry="2" fill="#D4EEF2" opacity="0.5" />
        <Ellipse cx="82" cy="92" rx="54" ry="18" fill="#F3D7A4" />
        <Ellipse cx="82" cy="90" rx="46" ry="13" fill="#E8C48A" />
        <Ellipse cx="64" cy="74" rx="30" ry="24" fill="#8FBE96" />
        <Ellipse cx="98" cy="78" rx="22" ry="18" fill="#7AAD84" />
        <Circle cx="40" cy="22" r="10" fill="#FFFFFF" opacity="0.72" />
        <Circle cx="52" cy="22" r="7" fill="#FFFFFF" opacity="0.62" />
        <Circle cx="30" cy="26" r="6" fill="#FFFFFF" opacity="0.5" />
      </Svg>
      </Animated.View>
    );
  }

    return (
      <Animated.View style={bob}>
        <Svg height={132} viewBox="0 0 164 132" width={164}>
          <Ellipse cx="84" cy="84" rx="26" ry="15" fill="#6FA07A" />
          <Path
            d="M70 90 Q73 68 68 48"
            fill="none"
            stroke="#C49A6C"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <Path d="M68 50 Q46 34 32 46 Q52 42 68 54" fill="#5D9A6A" />
          <Path d="M68 50 Q56 24 68 14 Q72 34 70 52" fill="#74B07E" />
          <Path d="M68 50 Q90 26 108 40 Q88 40 70 54" fill="#5D9A6A" />
          <Path d="M68 52 Q90 48 106 62 Q86 52 70 56" fill="#4E8A5F" />
          <Path d="M68 52 Q48 50 36 66 Q54 54 68 56" fill="#4E8A5F" />
          <Path
            d="M102 92 Q106 76 104 58"
            fill="none"
            stroke="#B58A5C"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <Path d="M104 58 Q90 44 80 52 Q96 52 104 62" fill="#5D9A6A" />
          <Path d="M104 58 Q108 38 118 32 Q112 50 106 60" fill="#74B07E" />
          <Path d="M104 58 Q122 46 134 56 Q116 52 106 62" fill="#5D9A6A" />
          <Ellipse cx="58" cy="90" rx="8" ry="5" fill="#81B489" />
          <Ellipse cx="112" cy="94" rx="7" ry="4.5" fill="#81B489" />
          <Circle cx="54" cy="88" r="2.2" fill="#E89B8C" />
          <Circle cx="116" cy="92" r="2" fill="#E8B07A" />
        </Svg>
      </Animated.View>
    );
}

function DeskArt() {
  return (
    <Svg height={112} viewBox="0 0 240 112" width={240}>
      <SvgRect fill="#8A6848" height="22" rx="3" width="11" x="32" y="88" />
      <SvgRect fill="#8A6848" height="22" rx="3" width="11" x="197" y="88" />
      <SvgRect fill="#7A5B3E" height="6" rx="2" width="15" x="30" y="106" />
      <SvgRect fill="#7A5B3E" height="6" rx="2" width="15" x="195" y="106" />
      <SvgRect fill="#C4A07A" height="64" rx="12" width="208" x="16" y="26" />
      <SvgRect fill="#B38D68" height="64" rx="12" width="8" x="16" y="26" />
      <SvgRect fill="#D7B48A" height="64" rx="12" width="8" x="216" y="26" />
      <SvgRect fill="#EFD9B0" height="20" rx="10" width="224" x="8" y="12" />
      <SvgRect fill="#F7E8C8" height="8" rx="4" width="212" x="14" y="16" />
      <SvgRect fill="#3F2E26" height="40" rx="8" width="168" x="36" y="46" />
      <SvgRect fill="#5C4336" height="32" rx="5" width="156" x="42" y="50" />
      <SvgRect fill="#D7C09A" height="4" rx="2" width="148" x="46" y="74" />
      <SvgRect fill="#C4A07A" height="7" rx="2" width="5" x="48" y="18" />
      <Ellipse cx="50.5" cy="14" fill="#8FBE96" rx="8" ry="6" />
      <Ellipse cx="46" cy="13" fill="#7AA97F" rx="5" ry="4" />
      <Circle cx="198" cy="20" r="5" fill="#F4D0C9" />
      <SvgRect fill="#E8C97A" height="3" rx="1.5" width="3" x="196.5" y="20" />
    </Svg>
  );
}

function RitualDestination({
  ritual,
  accent,
  progress,
  layer,
}: {
  ritual: RitualKey;
  accent: string;
  progress: Animated.Value;
  layer: DestLayer;
}) {
  if (ritual === 'release') {
    if (layer === 'back') {
      return (
        <View testID="ritual-island" style={styles.islandScene}>
          <IslandArt layer="back" />
        </View>
      );
    }
    return (
      <View testID="ritual-island-front" style={styles.islandFrontLayer}>
        <IslandArt layer="front" />
      </View>
    );
  }

  if (ritual === 'share') {
    if (layer === 'back') {
      return (
        <View testID="ritual-envelope-back" style={[styles.destinationDock, { zIndex: 1 }]}>
          <View style={[styles.bigEnvelope, { backgroundColor: '#F3E6EC', borderColor: accent }]} />
        </View>
      );
    }
    return (
      <View testID="ritual-envelope" style={[styles.destinationDock, styles.destinationFront]}>
        <Animated.View
          testID="ritual-envelope-flap-open"
          style={[
            styles.envelopeFlapOpen,
            { borderBottomColor: accent + '66' },
            {
              transform: [
                {
                  scaleY: progress.interpolate({
                    inputRange: [0, 0.18, 0.84, 0.94],
                    outputRange: [0.7, 1, 1, 0],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={[styles.envelopeFront, { borderColor: accent }]}>
          <View style={styles.envelopeMouth} />
          <View style={[styles.envelopeBelly, { backgroundColor: '#FFFDF9' }]} />
          <Animated.View
            style={{
              opacity: progress.interpolate({
                inputRange: [0, 0.9, 0.96, 1],
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
                      inputRange: [0, 0.92, 0.98, 1],
                      outputRange: [-28, -28, 0, 0],
                    }),
                  },
                  {
                    scaleY: progress.interpolate({
                      inputRange: [0, 0.92, 0.98, 1],
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
    if (layer === 'back') {
      return (
        <View testID="ritual-sapling-back" style={[styles.destinationDock, { zIndex: 1 }]}>
          <View style={styles.soil}>
            <Animated.View
              testID="ritual-soil-hole"
              style={[
                styles.soilHole,
                {
                  opacity: progress.interpolate({
                    inputRange: [0, 0.18, 0.84, 0.94],
                    outputRange: [0.45, 1, 1, 0.2],
                  }),
                },
              ]}
            />
          </View>
        </View>
      );
    }
    return (
      <View testID="ritual-sapling" style={[styles.destinationDock, styles.destinationFront]}>
        <View style={styles.soilFront}>
          <Animated.View
            testID="ritual-soil-cover"
            style={[
              styles.soilCover,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 0.92, 0.97, 1],
                  outputRange: [0, 0, 1, 1],
                }),
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 0.92, 0.97, 1],
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
                  inputRange: [0, 0.9, 0.95, 1],
                  outputRange: [0, 0, 1, 1],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.9, 0.96, 1],
                      outputRange: [42, 42, 8, -18],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 0.9, 0.96, 1],
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
    if (layer === 'back') {
      return (
        <View testID="ritual-lock-box-back" style={[styles.destinationDock, { zIndex: 1 }]}>
          <View style={[styles.lockBox, { borderColor: accent, backgroundColor: accent + '22' }]}>
            <View style={styles.lockBoxOpening} />
          </View>
        </View>
      );
    }
    return (
      <View testID="ritual-lock-box" style={[styles.destinationDock, styles.destinationFront]}>
        <View style={styles.lockBoxFront}>
          <View style={[styles.lockBoxFace, { backgroundColor: accent + '77', borderColor: accent }]} />
          <Animated.View
            testID="ritual-box-lid"
            style={[
              styles.lockBoxLid,
              { backgroundColor: accent + '88', borderColor: accent },
              {
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.2, 0.84, 0.94, 1],
                      outputRange: [-42, -42, -42, 0, 0],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.2, 0.84, 0.94, 1],
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
                inputRange: [0, 0.9, 0.96, 1],
                outputRange: [0, 0, 1, 1],
              }),
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.9, 0.96, 1],
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

  if (layer === 'back') {
    return (
      <View testID="ritual-desk-back" style={[styles.destinationDock, { zIndex: 1 }]}>
        <DeskArt />
      </View>
    );
  }

  return (
    <View testID="ritual-desk" style={[styles.destinationDock, styles.destinationFront]}>
      <View style={styles.deskFront}>
        <Animated.View
          testID="ritual-drawer-front"
          style={[
            styles.drawerFront,
            {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.16, 0.84, 0.94, 1],
                    outputRange: [0, 42, 42, 0, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.drawerWood}>
            <View style={styles.drawerGrain} />
            <View style={[styles.drawerGrain, { top: 16 }]} />
            <View style={styles.drawerHandleWrap}>
              <View style={styles.drawerHandle} />
              <View style={styles.drawerHandleShine} />
            </View>
          </View>
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
    overflow: 'visible',
    paddingTop: 28,
    position: 'relative',
  },
  diaryPage: {
    backgroundColor: '#FFFEFA',
    borderColor: '#E8E4DA',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    elevation: 2,
    height: PAGE_H,
    padding: 0,
    shadowColor: '#4C4C4C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    width: PAGE_W,
    zIndex: 2,
  },
  foldPage: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    overflow: 'visible',
    shadowOpacity: 0,
  },
  finishedPacket: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  hiddenPacket: {
    opacity: 0,
  },
  foldInner: {
    height: PAGE_H,
    position: 'absolute',
    width: PAGE_W,
  },
  foldInnerAnchor: {
    bottom: 0,
    right: 0,
  },
  flap: {
    overflow: 'visible',
    position: 'absolute',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  faceFront: {
    backgroundColor: '#FFFEFA',
    borderColor: '#E8E4DA',
    borderWidth: 1,
  },
  faceBack: {
    backgroundColor: '#EFE8DC',
    borderColor: '#D9D0C2',
    borderWidth: 1,
  },
  stayPanel: {
    backgroundColor: '#FFFEFA',
    borderColor: '#E8E4DA',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
  },
  panelLeft: {
    height: PAGE_H,
    left: 0,
    top: 0,
    width: HALF_W,
    zIndex: 4,
  },
  panelRight: {
    height: PAGE_H,
    right: 0,
    top: 0,
    width: HALF_W,
    zIndex: 1,
  },
  panelTop: {
    height: HALF_H,
    left: 0,
    top: 0,
    width: PAGE_W,
    zIndex: 4,
  },
  panelBottom: {
    bottom: 0,
    height: HALF_H,
    left: 0,
    width: PAGE_W,
    zIndex: 1,
  },
  panelThird: {
    bottom: 0,
    height: PACKET_H,
    left: 0,
    width: HALF_W,
    zIndex: 6,
  },
  panelFourth: {
    bottom: NOTE_H,
    height: NOTE_H,
    right: 0,
    width: HALF_W,
    zIndex: 7,
  },
  panelFifth: {
    bottom: 0,
    height: NOTE_H,
    left: PAGE_W - HALF_W,
    width: NOTE_W,
    zIndex: 8,
  },
  secondFoldClip: {
    height: HALF_H,
    overflow: 'visible',
    width: PAGE_W,
  },
  secondPanelTop: {
    height: PACKET_H,
    left: 0,
    top: 0,
    width: PAGE_W,
    zIndex: 3,
  },
  secondPanelBottom: {
    bottom: 0,
    height: PACKET_H,
    left: 0,
    width: PAGE_W,
    zIndex: 1,
  },
  sheetWriting: {
    height: PAGE_H,
    overflow: 'hidden',
    padding: 14,
    position: 'absolute',
    width: PAGE_W,
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
  paperBackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EFE8DC',
  },
  paperBackGrain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E4D8C8',
    margin: 10,
    opacity: 0.28,
  },
  verticalCrease: {
    backgroundColor: '#C9B79A',
    height: PAGE_H,
    left: PAGE_W / 2 - 0.5,
    position: 'absolute',
    top: 0,
    width: 1,
    zIndex: 5,
  },
  planeSpine: {
    backgroundColor: '#C4B49A',
    height: 2,
    left: '6%',
    position: 'absolute',
    top: '48%',
    transform: [{ rotate: '16deg' }],
    width: '82%',
    zIndex: 8,
  },
  horizontalCrease: {
    backgroundColor: '#C9B79A',
    height: 1,
    left: 0,
    position: 'absolute',
    top: HALF_H,
    width: PAGE_W,
    zIndex: 5,
  },
  secondCrease: {
    backgroundColor: '#C9B79A',
    height: 1,
    left: 0,
    position: 'absolute',
    top: PACKET_H,
    width: PAGE_W,
    zIndex: 5,
  },
  destinationDock: {
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 8,
    justifyContent: 'flex-end',
    pointerEvents: 'none',
    position: 'absolute',
  },
  destinationFront: {
    elevation: 24,
    transform: [{ translateX: 0 }],
    zIndex: 40,
  },
  islandScene: {
    position: 'absolute',
    right: 2,
    top: 2,
    zIndex: 1,
  },
  islandFrontLayer: {
    elevation: 24,
    position: 'absolute',
    right: 2,
    top: 2,
    transform: [{ translateX: 0 }],
    zIndex: 8,
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
  envelopeFront: {
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 78,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 142,
  },
  envelopeMouth: {
    height: 20,
    left: 12,
    position: 'absolute',
    right: 12,
    top: 0,
  },
  envelopeBelly: {
    borderTopColor: '#D8C7D0',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 18,
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
  soilFront: {
    alignItems: 'center',
    height: 62,
    justifyContent: 'flex-start',
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
    height: 36,
    position: 'absolute',
    top: 4,
    width: 132,
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
  lockBoxFront: {
    alignItems: 'center',
    height: 86,
    justifyContent: 'center',
    position: 'relative',
    width: 145,
  },
  lockBoxFace: {
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 24,
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
  deskFront: {
    height: 112,
    position: 'relative',
    width: 240,
  },
  drawerFront: {
    height: 40,
    left: 36,
    position: 'absolute',
    top: 46,
    width: 168,
    zIndex: 3,
  },
  drawerWood: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#D2B08A',
    borderColor: '#B08A62',
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drawerGrain: {
    alignSelf: 'stretch',
    backgroundColor: '#C49A72',
    height: 1,
    marginHorizontal: 12,
    opacity: 0.45,
    position: 'absolute',
    top: 10,
  },
  drawerHandleWrap: {
    alignItems: 'center',
    height: 10,
    justifyContent: 'center',
    width: 42,
  },
  drawerHandle: {
    backgroundColor: '#E8C97A',
    borderRadius: RADIUS.pill,
    height: 7,
    width: 36,
  },
  drawerHandleShine: {
    backgroundColor: '#FFF6D8',
    borderRadius: RADIUS.pill,
    height: 2,
    position: 'absolute',
    top: 2,
    width: 14,
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
