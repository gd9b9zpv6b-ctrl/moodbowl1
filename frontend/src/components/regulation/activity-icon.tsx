import { StyleSheet, View } from 'react-native';
import { Circle, Ellipse, Path, Rect, Svg } from 'react-native-svg';

type Props = {
  activityKey: string;
  size?: number;
};

/**
 * Per-activity mark on the regulate list.
 * Soft-scenes is a window looking out · not a generic image tile or a tear drop.
 */
export function RegulateActivityIcon({ activityKey, size = 32 }: Props) {
  const inner = size - 4;
  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <Svg height={inner} viewBox="0 0 40 40" width={inner}>
        {iconFor(activityKey)}
      </Svg>
    </View>
  );
}

export function WatchWindowIcon({ size = 72 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 40 40" width={size}>
      {watchWindow()}
    </Svg>
  );
}

function iconFor(key: string) {
  switch (key) {
    case 'soft_scenes':
      return watchWindow();
    case 'punch_bag':
      return (
        <>
          <Path d="M20 3 V10" stroke="#8B6A4A" strokeLinecap="round" strokeWidth="2.2" />
          <Ellipse cx="20" cy="24" fill="#6B3F2A" rx="9" ry="13" />
          <Ellipse cx="20" cy="20" fill="#8A5340" rx="7" ry="6" />
          <Path d="M13 16 H27" stroke="#C4A27A" strokeWidth="1.4" />
        </>
      );
    case 'ice_breath':
      return (
        <>
          <Path d="M12 14 L20 8 L28 14 L28 26 L20 32 L12 26 Z" fill="#C7E8F6" stroke="#7EB6D0" strokeWidth="1.6" />
          <Path d="M12 14 L28 26 M28 14 L12 26 M20 8 V32" stroke="#EAF6FC" strokeWidth="1.2" />
        </>
      );
    case 'box_breathing':
      return (
        <>
          <Rect x="8" y="8" width="24" height="24" rx="5" fill="#DCE8FF" stroke="#8AA3D6" strokeWidth="2" />
          <Path d="M12 20 H28 M20 12 V28" stroke="#8AA3D6" strokeWidth="1.5" />
        </>
      );
    case 'soft_breath':
    case 'wake_breath':
    case 'savor_breath':
    case 'breath_4_7_8':
      return (
        <>
          <Circle cx="20" cy="20" fill="#D7EEE6" r="13" />
          <Path d="M8 18 C14 12 18 24 26 16 C30 12 34 18 32 22" fill="none" stroke="#6FA08C" strokeLinecap="round" strokeWidth="2" />
        </>
      );
    case 'slideshow_affirmations':
      return (
        <>
          <Path d="M10 8 H24 L30 14 V32 H10 Z" fill="#F4E6C8" stroke="#D7C39A" strokeWidth="1.6" />
          <Path d="M24 8 V14 H30" fill="none" stroke="#D7C39A" strokeWidth="1.6" />
          <Path d="M14 20 H26 M14 25 H22" stroke="#E4D4B8" strokeLinecap="round" strokeWidth="2" />
        </>
      );
    case 'grounding_5_4_3_2_1':
      return (
        <>
          <Circle cx="20" cy="20" fill="#F8E7A6" r="12" />
          <Circle cx="20" cy="20" fill="#F3D56B" r="6" />
          <Path d="M20 6 V10 M20 30 V34 M6 20 H10 M30 20 H34" stroke="#E6C24A" strokeLinecap="round" strokeWidth="2" />
        </>
      );
    case 'gentle_stretch':
      return (
        <>
          <Circle cx="20" cy="10" fill="#F0C7B0" r="5" />
          <Path d="M20 15 L20 26 M20 18 L10 16 M20 18 L30 14 M16 26 L12 34 M24 26 L28 34" stroke="#C48B72" strokeLinecap="round" strokeWidth="2.2" />
        </>
      );
    case 'savor_3_things':
      return (
        <>
          <Rect x="8" y="7" width="24" height="26" rx="4" fill="#FFF8E8" stroke="#E6D3A8" strokeWidth="1.6" />
          <Path d="M14 15 H26 M14 21 H24 M14 27 H20" stroke="#E4D4B8" strokeLinecap="round" strokeWidth="2" />
          <Circle cx="30" cy="11" fill="#F4C96B" r="3" />
        </>
      );
    case 'sit_with_bowl':
      return (
        <>
          <Ellipse cx="20" cy="26" fill="#E8D4B8" rx="12" ry="6" />
          <Path d="M10 24 C10 16 30 16 30 24" fill="#F4E6C8" stroke="#D7C39A" strokeWidth="1.5" />
          <Ellipse cx="20" cy="18" fill="#FBF3DE" rx="8" ry="3" />
        </>
      );
    default:
      return watchWindow();
  }
}

function watchWindow() {
  return (
    <>
      <Rect
        x="4"
        y="5"
        width="32"
        height="30"
        rx="6"
        fill="#D6EEF7"
        stroke="#6FA3B8"
        strokeWidth="2"
      />
      <Rect x="7" y="8" width="26" height="18" rx="3" fill="#B9DFF0" />
      <Circle cx="27" cy="14" fill="#F7E08C" r="4" />
      <Path d="M7 22 C13 18 20 26 33 17 L33 26 L7 26 Z" fill="#8FBF73" />
      <Path d="M7 26 H33 V32 H7 Z" fill="#E8F4C8" />
      <Path d="M20 8 V32" stroke="#6FA3B8" strokeWidth="1.5" />
      <Path d="M7 20 H33" stroke="#6FA3B8" strokeWidth="1.2" />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
