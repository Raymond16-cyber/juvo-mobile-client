import { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useLayout } from "@/lib/layout";
import { radius, useAppTheme } from "@/theme";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
};

export function Card({
  children,
  style,
  onPress,
  padded = true,
  elevated = true,
}: CardProps) {
  const { colors, isDark } = useAppTheme();
  const { cardPad } = useLayout();

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding: padded ? cardPad : 0,
          shadowOpacity: elevated ? (isDark ? 0.25 : 0.08) : 0,
          elevation: elevated ? 2 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
});
