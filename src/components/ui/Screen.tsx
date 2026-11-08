import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLayout } from "@/lib/layout";
import { spacing, useAppTheme } from "@/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ("top" | "right" | "bottom" | "left")[];
  /** Include bottom safe area (useful for stack screens without a tab bar). */
  includeBottomInset?: boolean;
  centered?: boolean;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  edges,
  includeBottomInset = false,
  centered = false,
}: ScreenProps) {
  const { colors } = useAppTheme();
  const { gutter, contentMaxWidth, insets } = useLayout();

  const resolvedEdges =
    edges ||
    (includeBottomInset
      ? (["top", "left", "right", "bottom"] as const)
      : (["top", "left", "right"] as const));

  const paddingStyle = padded
    ? {
        paddingHorizontal: gutter,
        paddingTop: spacing.md,
        paddingBottom: includeBottomInset
          ? spacing.xxl
          : spacing.xxxl + Math.max(insets.bottom, spacing.sm),
      }
    : undefined;

  const constrained = contentMaxWidth
    ? { width: "100%" as const, maxWidth: contentMaxWidth, alignSelf: "center" as const }
    : undefined;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        paddingStyle,
        constrained,
        centered && styles.centered,
        contentStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        paddingStyle,
        constrained,
        centered && styles.centered,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={[...resolvedEdges]}
      style={[styles.fill, { backgroundColor: colors.background }, style]}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: "center",
  },
});
