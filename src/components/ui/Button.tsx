import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useLayout } from "@/lib/layout";
import { radius, spacing, typography, useAppTheme } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  size?: "md" | "sm";
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
  size = "md",
}: ButtonProps) {
  const { colors } = useAppTheme();
  const { isCompact } = useLayout();
  const isDisabled = disabled || loading;

  const backgrounds: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    ghost: "transparent",
    danger: colors.danger,
  };

  const textColors: Record<Variant, string> = {
    primary: "#FFFFFF",
    secondary: colors.text,
    ghost: colors.primary,
    danger: "#FFFFFF",
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={4}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        size === "sm" ? styles.sm : null,
        {
          backgroundColor: backgrounds[variant],
          borderColor:
            variant === "secondary" || variant === "ghost"
              ? colors.border
              : backgrounds[variant],
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          minHeight: size === "sm" ? 40 : isCompact ? 48 : 52,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text
          style={[
            styles.label,
            size === "sm" && styles.labelSm,
            { color: textColors[variant] },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  sm: {
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    fontWeight: "600",
  },
  labelSm: {
    fontSize: 14,
  },
});
