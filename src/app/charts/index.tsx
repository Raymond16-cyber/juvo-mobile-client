import { Linking, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, PageHeader, Screen } from "@/components/ui";
import { spacing, typography, useAppTheme } from "@/theme";

const TRADINGVIEW_URL = "https://www.tradingview.com/chart/";

export default function ChartsScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Charts" }} />
      <PageHeader
        eyebrow="Workspace"
        title="Juvo Charts"
        description="Read price action alongside your journal. Mobile opens TradingView in the browser."
      />

      <Card style={styles.card}>
        <View
          style={[styles.icon, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="analytics-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.heading, { color: colors.text }]}>
          TradingView workspace
        </Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
          The full embedded chart lives on web. On mobile, open TradingView to
          review levels, then return to JUVO to log the trade and review
          discipline.
        </Text>
        <Button
          title="Open TradingView"
          onPress={() => void Linking.openURL(TRADINGVIEW_URL)}
          style={{ marginTop: spacing.sm }}
        />
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
});
