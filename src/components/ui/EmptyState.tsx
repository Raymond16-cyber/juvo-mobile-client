import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./Button";
import { spacing, typography, useAppTheme } from "@/theme";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  icon = "file-tray-outline",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});
