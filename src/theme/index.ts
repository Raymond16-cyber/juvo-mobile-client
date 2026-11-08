export { colors, darkColors, lightColors, palette } from "./colors";
export type { AppColors } from "./colors";
export { spacing, radius, hitSlop } from "./spacing";
export { typography } from "./typography";
export { useLayout, BREAKPOINTS } from "@/lib/layout";

import { useColorScheme } from "react-native";
import { darkColors, lightColors, AppColors } from "./colors";
import { useThemeStore } from "@/stores/theme.store";

export function useAppTheme(): { colors: AppColors; isDark: boolean } {
  const scheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);

  const resolved =
    preference === "system" ? (scheme === "light" ? "light" : "dark") : preference;
  const isDark = resolved === "dark";

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
