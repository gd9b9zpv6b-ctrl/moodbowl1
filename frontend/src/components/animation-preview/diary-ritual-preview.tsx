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
    label: '俾佢飛走 · 放低呢一頁',
    shortLabel: '飛走',
    description: '張紙摺成飛機 · 飛走之前會問清楚',
    result: '預覽完成 · 真正刪除前會再次確認',
    accent: '#78AFC5',
    tint: '#EAF6FA',
    icon: 'send',
  },
  {
    key: 'share',
    label: '放入信封 · 分享出去',
    shortLabel: '分享',
    description: '先預覽內容同收件人 · 確認先送出',
    result: '預覽完成 · 呢度冇傳送任何日記',
    accent: '#C58EA7',
    tint: '#FFF0F5',
    icon: 'mail',
  },
  {
    key: 'garden',
    label: '種入花園 · 等佢慢慢成長',
    shortLabel: '花園',
    description: '日記變成種子 · 私人留低 · 陪住花園成長',
    result: '種低咗一粒屬於今日嘅種子',
    accent: '#7FA889',
    tint: '#EFF8ED',
    icon: 'sun',
  },
  {
    key: 'lock',
    label: '鎖入小盒 · 好好保護',
    shortLabel: '保護',
    description: '收好日記 · 用密碼保護私人內容',
    result: '收好咗 · 只有你解鎖先睇到',
    accent: '#9B87B3',
    tint: '#F5F0FA',
    icon: 'lock',
  },
  {
    key: 'later',
    label: '擺喺枱面 · 遲啲先決定',
    shortLabel: '遲啲',
    description: '而家唔使揀 · 日記會先私人保存',
    result: '已經放好 · 你想幾時再決定都得',
    accent: '#B08F68',
    tint: '#FAF4EA',
    icon: 'clock',
  },
];

const SOFT_EASING = Easing.out(Easing.quad);

export function DiaryRitualPreview() {
  const [activeKey, setActiveKey] = useState<RitualKey>('release');
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const secondary = useRef(new Animated.Value(0)).current;

  const active = RITUALS.find((item) => item.key === activeKey) ?? RITUALS[0];
  const emotion = EMOTION_BY_KEY.anxious;

  const reset = (nextKey?: RitualKey) => {
    progress.stopAnimation();
    secondary.stopAnimation();
    progress.setValue(0);
    secondary.setValue(0);
    setPlaying(false);
    setCompleted(false);
    if (nextKey) setActiveKey(nextKey);
  };

  const play = () => {
    if (playing) return;
    reset();
    setPlaying(true);

    Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.42,
        duration: 360,
        easing: SOFT_EASING,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 400,
          easing: SOFT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(secondary, {
          toValue: 1,
          duration: 400,
          easing: SOFT_EASING,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      setPlaying(false);
      if (finished) setCompleted(true);
    });
  };

  const pageTransform = getPageTransform(activeKey, progress);
  const pageOpacity =
    activeKey === 'release' || activeKey === 'share' || activeKey === 'garden'
      ? progress.interpolate({
          inputRange: [0, 0.64, 1],
          outputRange: [1, 0.92, 0],
        })
      : 1;

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
            secondary={secondary}
          />

          <Animated.View
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
            inputRange: [0, 0.42, 1],
            outputRange: [0, 12, 230],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [0, 5, -130],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [1, 0.72, 0.28],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: ['0deg', '-10deg', '20deg'],
          }),
        },
      ];
    case 'share':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [0, 28, 92],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [1, 0.77, 0.48],
          }),
        },
      ];
    case 'garden':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [0, 36, 98],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [1, 0.66, 0.18],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: ['0deg', '4deg', '16deg'],
          }),
        },
      ];
    case 'lock':
      return [
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [0, 18, 65],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.42, 1],
            outputRange: [1, 0.8, 0.56],
          }),
        },
      ];
    case 'later':
      return [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 25],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 54],
          }),
        },
        {
          rotate: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '-4deg'],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.88],
          }),
        },
      ];
  }
}

function RitualDestination({
  ritual,
  accent,
  progress,
  secondary,
}: {
  ritual: RitualKey;
  accent: string;
  progress: Animated.Value;
  secondary: Animated.Value;
}) {
  const revealOpacity = secondary.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.3, 1],
  });
  const revealScale = secondary.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  if (ritual === 'release') {
    return (
      <Animated.View
        style={[
          styles.flightTrail,
          {
            opacity: revealOpacity,
            transform: [{ scale: revealScale }],
          },
        ]}
      >
        <View style={[styles.trailLine, { borderColor: accent }]} />
        <Feather name="send" size={40} color={accent} />
      </Animated.View>
    );
  }

  if (ritual === 'share') {
    return (
      <Animated.View
        style={[
          styles.destinationBottom,
          { opacity: revealOpacity, transform: [{ scale: revealScale }] },
        ]}
      >
        <View style={[styles.bigEnvelope, { borderColor: accent }]}>
          <View style={[styles.bigEnvelopeFlap, { backgroundColor: accent + '30' }]} />
          <Feather name="heart" size={22} color={accent} />
        </View>
      </Animated.View>
    );
  }

  if (ritual === 'garden') {
    return (
      <View style={styles.destinationBottom}>
        <View style={styles.soil}>
          <Animated.View
            style={{
              opacity: revealOpacity,
              transform: [{ scale: revealScale }, { translateY: -8 }],
            }}
          >
            <Text style={styles.sprout}>🌱</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (ritual === 'lock') {
    return (
      <View style={styles.destinationBottom}>
        <View style={[styles.lockBox, { borderColor: accent, backgroundColor: accent + '22' }]}>
          <Animated.View style={{ opacity: revealOpacity, transform: [{ scale: revealScale }] }}>
            <Feather name="lock" size={27} color={accent} />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.destinationBottom}>
      <View style={[styles.deskEdge, { backgroundColor: accent + '55' }]}>
        <Animated.View
          style={[
            styles.laterClock,
            { opacity: revealOpacity, transform: [{ scale: revealScale }] },
          ]}
        >
          <Feather name="clock" size={23} color={accent} />
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
  destinationBottom: {
    alignItems: 'center',
    bottom: 14,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: '100%',
  },
  flightTrail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    position: 'absolute',
    right: 30,
    top: 38,
  },
  trailLine: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    height: 25,
    opacity: 0.55,
    transform: [{ rotate: '-16deg' }],
    width: 58,
  },
  bigEnvelope: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    height: 78,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 142,
  },
  bigEnvelopeFlap: {
    height: 90,
    position: 'absolute',
    top: -65,
    transform: [{ rotate: '45deg' }],
    width: 90,
  },
  soil: {
    alignItems: 'center',
    backgroundColor: '#BFA17D',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    height: 43,
    justifyContent: 'flex-start',
    width: 158,
  },
  sprout: { fontSize: 48 },
  lockBox: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    width: 145,
  },
  deskEdge: {
    alignItems: 'flex-end',
    borderRadius: RADIUS.sm,
    height: 42,
    justifyContent: 'center',
    paddingRight: 24,
    width: '88%',
  },
  laterClock: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.pill,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    top: -30,
    width: 42,
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
