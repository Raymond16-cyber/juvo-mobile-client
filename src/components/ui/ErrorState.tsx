import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./Button";
import { spacing, typography, useAppTheme } from "@/theme";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} style={styles.button} />
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
  title: {
    ...typography.subtitle,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
    minWidth: 140,
  },
});
