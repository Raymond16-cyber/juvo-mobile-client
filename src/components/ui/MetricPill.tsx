import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography, useAppTheme } from "@/theme";

type MetricPillProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

export function MetricPill({
  label,
  value,
  tone = "neutral",
}: MetricPillProps) {
  const { colors } = useAppTheme();
  const valueColor =
    tone === "positive"
      ? colors.success
      : tone === "negative"
        ? colors.danger
        : colors.text;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 100,
    gap: 2,
  },
  label: {
    ...typography.label,
  },
  value: {
    ...typography.subtitle,
  },
});
