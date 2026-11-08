import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLayout } from "@/lib/layout";
import { spacing, typography, useAppTheme } from "@/theme";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();

  return (
    <View style={[styles.wrap, isTablet && styles.wrapWide]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  wrapWide: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
  },
  title: {
    ...typography.title,
  },
  description: {
    ...typography.body,
  },
  action: {
    flexShrink: 0,
  },
});
