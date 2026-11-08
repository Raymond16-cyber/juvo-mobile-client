import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { Card, PageHeader, Screen } from "@/components/ui";
import { useLayout } from "@/lib/layout";
import { spacing, typography, useAppTheme } from "@/theme";

const FAQS = [
  {
    q: "What is JUVO?",
    a: "JUVO is a trading journal and performance system. Record trades, reflect daily, and understand your behaviour over time.",
  },
  {
    q: "How do I start my day?",
    a: "From Home, tap Start Day. JUVO creates today’s journal for your active trading account so you can log trades and close the day with a review.",
  },
  {
    q: "How do I add a trade?",
    a: "Use Add Trade from Home or from an open journal. Enter symbol, direction, entry, stop loss, risk %, and optional notes.",
  },
  {
    q: "What is a no-trade day?",
    a: "If there is no valid setup, mark No Trade. That protects your streak when you stay disciplined and skip forced trades.",
  },
  {
    q: "Does mobile sync with the web app?",
    a: "Yes. Mobile and web share the same account and database. Trades and journals created on one appear on the other.",
  },
  {
    q: "What does JUVO AI require?",
    a: "JUVO AI needs Pro, Super, or an active AI trial. Free includes basic journaling and the Smart Journal Interviewer.",
  },
  {
    q: "How do I connect MetaTrader?",
    a: "Open More → Settings → Brokers (or More → Brokers), tap Pair MetaTrader 5, then attach the JUVO Connector EA in your desktop MT5 terminal using that code and ApiUrl.",
  },
  {
    q: "How do I connect cTrader?",
    a: "Open More → Settings → Brokers, tap Connect cTrader, finish authorization in the browser, then return to Settings and refresh the Brokers tab.",
  },
  {
    q: "Where do I change theme and reminders?",
    a: "Open More → Settings. Use Appearance for theme and Rhythm for week start plus journal reminder time.",
  },
  {
    q: "Why do I see Network Error on sign in?",
    a: "Your phone cannot reach the API. Use your computer LAN IP in EXPO_PUBLIC_API_URL (not localhost), keep the server on port 5001, and stay on the same Wi-Fi as your computer.",
  },
];

export default function HelpScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Help" }} />
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Quick answers for the mobile trading workflow."
      />

      <View style={[styles.list, isTablet && styles.listWide]}>
        {FAQS.map((item) => (
          <Card
            key={item.q}
            style={[styles.card, isTablet && styles.cardWide]}
          >
            <Text style={[styles.q, { color: colors.text }]}>{item.q}</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              {item.a}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    gap: spacing.sm,
  },
  cardWide: {
    width: "48%",
    flexGrow: 1,
  },
  q: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
