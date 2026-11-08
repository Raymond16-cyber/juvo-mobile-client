import { StyleSheet, Text, View } from "react-native";

import { typography, useAppTheme } from "@/theme";

type AvatarProps = {
  name?: string | null;
  size?: number;
};

function getInitials(name?: string | null) {
  if (!name?.trim()) return "J";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.primary,
            fontSize: Math.max(12, size * 0.36),
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
