export const palette = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#DBEAFE",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const darkColors = {
  background: "#0B1220",
  surface: "#111827",
  surfaceElevated: "#1F2937",
  border: "#1F2937",
  borderStrong: "#374151",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: "#1E3A5F",
  success: palette.success,
  danger: palette.danger,
  warning: palette.warning,
  overlay: "rgba(0,0,0,0.55)",
  card: "#111827",
  input: "#0F172A",
  tabBar: "#0B1220",
  tabInactive: "#64748B",
} as const;

export const lightColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,
  success: palette.success,
  danger: palette.danger,
  warning: palette.warning,
  overlay: "rgba(15,23,42,0.45)",
  card: "#FFFFFF",
  input: "#FFFFFF",
  tabBar: "#FFFFFF",
  tabInactive: "#94A3B8",
} as const;

export type AppColors = typeof darkColors | typeof lightColors;

export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;
