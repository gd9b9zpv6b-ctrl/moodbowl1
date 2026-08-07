import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { LAYOUT, SPACING } from '@/src/constants/theme';

export type ResponsiveLayout = {
  width: number;
  isTablet: boolean;
  isDesktop: boolean;
  /** Centered content width · never exceeds LAYOUT.contentMaxWidth */
  contentMaxWidth: number;
  /** Horizontal page padding */
  pagePadding: number;
  /** Emotion grid columns · mobile 3 · tablet 4 · desktop 5 */
  emotionColumns: number;
  emotionTileWidth: `${number}%`;
};

/**
 * Mobile-first layout helper for MoodBowl screens.
 * Keeps a single vertical column · widens grids on larger viewports.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= LAYOUT.tabletMinWidth;
    const isDesktop = width >= LAYOUT.desktopMinWidth;
    const pagePadding = isDesktop ? SPACING.xl : isTablet ? SPACING.lg : SPACING.lg;
    const emotionColumns = isDesktop ? 5 : isTablet ? 4 : 3;
    const gapShare = 0; // gaps handled by space-between in the grid
    const tilePct = Math.floor((100 - gapShare) / emotionColumns) - (emotionColumns > 3 ? 1 : 0);

    return {
      width,
      isTablet,
      isDesktop,
      contentMaxWidth: LAYOUT.contentMaxWidth,
      pagePadding,
      emotionColumns,
      emotionTileWidth: `${Math.max(tilePct, 18)}%` as `${number}%`,
    };
  }, [width]);
}
