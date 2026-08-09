import { StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '@/src/constants/theme';

type Props = {
  total: number;
  active: number; // 1-based
  testID?: string;
};

export function ProgressDots({ total, active, testID }: Props) {
  return (
    <View style={styles.row} testID={testID || 'progress-dots'}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < active;
        return (
          <View
            key={i}
            style={[styles.dot, on ? styles.dotOn : styles.dotOff]}
            accessibilityLabel={on ? '已完成' : '未完成'}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dotOn: {
    backgroundColor: COLORS.primary,
  },
  dotOff: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
