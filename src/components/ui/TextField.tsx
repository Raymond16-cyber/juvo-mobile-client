import { ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { radius, spacing, typography, useAppTheme } from "@/theme";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  left?: ReactNode;
  right?: ReactNode;
};

export function TextField({
  label,
  error,
  hint,
  left,
  right,
  style,
  ...props
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.input,
            borderColor: error
              ? colors.danger
              : focused
                ? colors.primary
                : colors.border,
          },
        ]}
      >
        {left}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }, style]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {right}
      </View>
      {error ? (
        <Text style={[styles.meta, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
  },
  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  meta: {
    ...typography.caption,
  },
});
