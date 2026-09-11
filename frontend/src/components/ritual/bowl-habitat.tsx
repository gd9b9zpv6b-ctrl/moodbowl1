import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { EmotionCategory } from '@/src/constants/emotions';

/**
 * Soft sand / fog / rain around a bowl — no square card behind it.
 */
export function BowlHabitat({
  category,
  children,
  style,
}: {
  category?: EmotionCategory | null;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View testID={category ? `bowl-habitat-${category}` : 'bowl-habitat'} style={[styles.wrap, style]}>
      {category === 'nervous' ? (
        <>
          <View style={[styles.sand, styles.sandBack]} />
          <View style={[styles.sand, styles.sandLeft]} />
          <View style={[styles.sand, styles.sandRight]} />
          <View style={[styles.sand, styles.sandFront]} />
        </>
      ) : null}
      {category === 'unspoken' ? (
        <>
          <View style={[styles.fog, styles.fogWide]} />
          <View style={[styles.fog, styles.fogMid]} />
          <View style={[styles.fog, styles.fogLow]} />
        </>
      ) : null}
      {category === 'sad' ? (
        <>
          <View style={[styles.rain, { left: 28, height: 36 }]} />
          <View style={[styles.rain, { left: 58, height: 48, top: 8 }]} />
          <View style={[styles.rain, { right: 36, height: 40, top: 4 }]} />
          <View style={[styles.rain, { right: 64, height: 28, top: 18 }]} />
        </>
      ) : null}
      <View style={styles.child}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  child: { zIndex: 2 },
  sand: {
    backgroundColor: '#E3C88A',
    borderRadius: 999,
    position: 'absolute',
    zIndex: 1,
  },
  sandBack: { bottom: 18, height: 70, width: 200 },
  sandLeft: { bottom: 28, height: 86, left: '12%', width: 120 },
  sandRight: { bottom: 24, height: 78, right: '12%', width: 110 },
  sandFront: { backgroundColor: '#DDBF7F', bottom: 8, height: 46, width: 168 },
  fog: {
    backgroundColor: '#E4E7EACC',
    borderRadius: 999,
    position: 'absolute',
    zIndex: 1,
  },
  fogWide: { height: 70, top: 36, width: '92%' },
  fogMid: { backgroundColor: '#F1F3F6DD', height: 54, top: 78, width: '78%' },
  fogLow: { backgroundColor: '#D9DEE2BB', bottom: 22, height: 48, width: '88%' },
  rain: {
    backgroundColor: '#FFFFFF99',
    borderRadius: 999,
    position: 'absolute',
    top: 12,
    transform: [{ rotate: '12deg' }],
    width: 4,
    zIndex: 1,
  },
});
