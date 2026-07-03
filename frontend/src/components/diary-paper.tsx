import { Defs, Line, Pattern, Rect, Svg } from 'react-native-svg';
import { StyleSheet, View, ViewStyle } from 'react-native';

export type PaperKind = 'ruled' | 'grid' | 'dot';

type Props = {
  kind?: PaperKind;
  color?: string;      // line color
  spacing?: number;    // px between lines
  strokeWidth?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * Diary-paper background. Renders horizontal ruled lines, grid squares, or
 * dot grid depending on `kind`. Uses SVG pattern so it tiles at any size
 * without perf hits.
 */
export function DiaryPaper({
  kind = 'ruled',
  color = '#B4B0A2',
  spacing = 34,
  strokeWidth = 0.8,
  style,
  children,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="paper-pattern"
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            {kind === 'ruled' && (
              <Line
                x1="0"
                y1={spacing}
                x2={spacing}
                y2={spacing}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.4}
              />
            )}
            {kind === 'grid' && (
              <>
                <Line
                  x1="0"
                  y1={spacing}
                  x2={spacing}
                  y2={spacing}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={0.35}
                />
                <Line
                  x1={spacing}
                  y1="0"
                  x2={spacing}
                  y2={spacing}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={0.35}
                />
              </>
            )}
            {kind === 'dot' && (
              <Rect
                x={spacing / 2 - 1}
                y={spacing / 2 - 1}
                width={2}
                height={2}
                fill={color}
                opacity={0.45}
                rx={1}
              />
            )}
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#paper-pattern)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
});
