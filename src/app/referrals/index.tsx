import { useMemo, useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, PageHeader, Screen } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { spacing, typography, useAppTheme } from "@/theme";

export default function ReferralsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const [sharing, setSharing] = useState(false);

  const code = useMemo(() => {
    const seed = (user?.email || user?.fullName || "juvo")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 8);
    return `JUVO-${seed.toUpperCase() || "TRADER"}`;
  }, [user]);

  const onShare = async () => {
    setSharing(true);
    try {
      await Share.share({
        message: `Join me on JUVO with invite code ${code}`,
        title: "JUVO referral",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Referrals" }} />
      <PageHeader
        eyebrow="General"
        title="Referrals"
        description="Invite traders who want a journal, not a signal group."
      />

      <Card style={styles.card}>
        <View
          style={[styles.icon, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="gift-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.heading, { color: colors.text }]}>
          Your invite code
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Share this with a trader who needs process more than predictions.
        </Text>
        <View
          style={[
            styles.codeWrap,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
        </View>
        <Button title="Share code" onPress={() => void onShare()} loading={sharing} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    ...typography.subtitle,
  },
  codeWrap: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  code: {
    ...typography.bodyMedium,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
