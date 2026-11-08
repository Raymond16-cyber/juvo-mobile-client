import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/theme";

export const BREAKPOINTS = {
  phone: 0,
  largePhone: 390,
  tablet: 768,
  desktop: 1024,
} as const;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const isTablet = width >= BREAKPOINTS.tablet;
    const isLargePhone = width >= BREAKPOINTS.largePhone;
    const contentMaxWidth = isTablet ? 720 : undefined;
    const gutter = isTablet ? spacing.xxl : isLargePhone ? spacing.lg : spacing.md;
    const columns = isTablet ? 2 : 1;

    return {
      width,
      height,
      insets,
      isTablet,
      isLargePhone,
      isCompact: width < BREAKPOINTS.largePhone,
      contentMaxWidth,
      gutter,
      columns,
      metricColumns: width >= 520 ? 2 : 1,
      cardPad: isTablet ? spacing.xl : spacing.lg,
      sectionGap: isTablet ? spacing.xl : spacing.lg,
      bottomTabPad: Math.max(insets.bottom, spacing.sm),
    };
  }, [height, insets, width]);
}
