import { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import {
  getBillingManagementLinkService,
  getBillingOverviewService,
  initializeBillingCheckoutService,
  type BillingOverview,
  type BillingPlan,
} from "@/api/billing";
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import { spacing, typography, useAppTheme } from "@/theme";

const PLAN_DETAILS: Record<
  BillingPlan,
  { name: string; points: string[] }
> = {
  free: {
    name: "Free",
    points: [
      "Daily journaling",
      "Manual trading accounts",
      "Basic analytics",
      "Smart Journal Interviewer",
    ],
  },
  pro: {
    name: "Pro",
    points: [
      "JUVO AI chat",
      "Behavioural insights",
      "Advanced analytics",
      "CSV / JSON export",
    ],
  },
  super: {
    name: "Super",
    points: [
      "Everything in Pro",
      "Goal Coach",
      "Contextual AI check-ins",
      "Priority coaching context",
    ],
  },
};

export default function SubscriptionScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const user = useAuthStore((s) => s.user);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBillingOverviewService();
      setBilling(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load subscription."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const plan =
    billing?.plan ||
    billing?.subscription?.plan ||
    user?.subscription?.plan ||
    "free";
  const status =
    billing?.status ||
    billing?.subscription?.status ||
    user?.subscription?.status ||
    "free";
  const subscriptionId = billing?.subscription?._id;

  const onCheckout = (nextPlan: Exclude<BillingPlan, "free">) => {
    void (async () => {
      setBusy(nextPlan);
      setError(null);
      setNotice(null);
      try {
        const result = await initializeBillingCheckoutService(nextPlan);
        await Linking.openURL(result.authorizationUrl);
        setNotice(
          "Complete payment in the browser, then return here and refresh.",
        );
      } catch (err) {
        setError(getApiErrorMessage(err, "Checkout failed."));
      } finally {
        setBusy(null);
      }
    })();
  };

  const onManage = () => {
    if (!subscriptionId) return;
    void (async () => {
      setBusy("manage");
      setError(null);
      try {
        const result = await getBillingManagementLinkService(subscriptionId);
        const url = result.link || result.url;
        if (!url) {
          throw new Error("No management link was returned.");
        }
        await Linking.openURL(url);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not open billing portal."));
      } finally {
        setBusy(null);
      }
    })();
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Subscription" }} />
        <LoadingState label="Loading subscription…" />
      </Screen>
    );
  }

  if (error && !billing) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Subscription" }} />
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Subscription" }} />

      <PageHeader
        eyebrow="Billing"
        title="Subscription"
        description="Choose the plan that unlocks the coaching and analytics tools you need."
      />

      <Card style={styles.card}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Current plan
        </Text>
        <Text style={[styles.plan, { color: colors.text }]}>
          {String(plan).toUpperCase()}
        </Text>
        <Text style={{ color: colors.textSecondary }}>Status: {status}</Text>
        {billing?.expiresAt ? (
          <Text style={{ color: colors.textMuted }}>
            Renews around your next billing cycle.
          </Text>
        ) : null}
      </Card>

      {error ? (
        <Text style={[styles.banner, { color: colors.danger }]}>{error}</Text>
      ) : null}
      {notice ? (
        <Text style={[styles.banner, { color: colors.primary }]}>{notice}</Text>
      ) : null}

      <View style={[styles.plans, isTablet && styles.plansWide]}>
        {(Object.keys(PLAN_DETAILS) as BillingPlan[]).map((planKey) => {
          const details = PLAN_DETAILS[planKey];
          const isCurrent = planKey === plan;

          return (
            <Card
              key={planKey}
              style={[styles.card, isTablet && styles.planCardWide]}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.section, { color: colors.text }]}>
                  {details.name}
                </Text>
                {isCurrent ? (
                  <Text style={{ color: colors.success, fontWeight: "700" }}>
                    Current
                  </Text>
                ) : null}
              </View>
              {details.points.map((point) => (
                <Text key={point} style={{ color: colors.textSecondary }}>
                  · {point}
                </Text>
              ))}
              {planKey !== "free" && !isCurrent ? (
                <Button
                  title={`Upgrade to ${details.name}`}
                  loading={busy === planKey}
                  disabled={!!busy}
                  onPress={() => onCheckout(planKey)}
                  style={{ marginTop: spacing.md }}
                />
              ) : null}
            </Card>
          );
        })}
      </View>

      {subscriptionId && plan !== "free" ? (
        <Card style={styles.card}>
          <Text style={[styles.section, { color: colors.text }]}>
            Manage billing
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Open Paystack to update your payment method or cancel.
          </Text>
          <Button
            title="Open billing portal"
            variant="secondary"
            loading={busy === "manage"}
            disabled={!!busy}
            onPress={onManage}
          />
          <Button
            title="Refresh plan status"
            variant="ghost"
            disabled={!!busy}
            onPress={() => {
              void load().then(() => fetchCurrentUser());
              Alert.alert(
                "Refreshing",
                "Pulling the latest plan status from the server.",
              );
            }}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  plans: {
    gap: 0,
  },
  plansWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCardWide: {
    width: "31%",
    flexGrow: 1,
    marginBottom: 0,
  },
  label: {
    ...typography.label,
  },
  plan: {
    ...typography.heading,
  },
  section: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  banner: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
});
