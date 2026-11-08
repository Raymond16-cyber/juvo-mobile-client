import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import { getAnalyticsService } from "@/api/analytics";
import {
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricPill,
  PageHeader,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import { titleCase } from "@/lib/format";
import { useAuthStore } from "@/stores/auth.store";
import type { AnalyticsData } from "@/types/analytics";
import { spacing, typography, useAppTheme } from "@/theme";

export default function InsightsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsService();
      setData(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load insights."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const challenges = user?.profile?.biggestChallenges || [];

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Insights" }} />
        <LoadingState label="Loading insights…" />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Insights" }} />
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  const summary = data?.summary;

  return (
    <Screen
      scroll
      includeBottomInset
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <Stack.Screen options={{ title: "Insights" }} />
      <PageHeader
        eyebrow="Behavioural Insights"
        title="Trading Behavior Review"
        description="Process scores: plan adherence, revenge trading, overtrading, and session quality."
      />

      <View style={styles.metrics}>
        <MetricPill
          label="Discipline"
          value={`${Math.round(summary?.avgDiscipline || 0)}%`}
        />
        <MetricPill
          label="Revenge days"
          value={String(summary?.revengeDays || 0)}
          tone={(summary?.revengeDays || 0) > 0 ? "negative" : "neutral"}
        />
        <MetricPill
          label="Overtrade days"
          value={String(summary?.overtradeDays || 0)}
          tone={(summary?.overtradeDays || 0) > 0 ? "negative" : "neutral"}
        />
      </View>

      <SectionHeader title="Insight cards" />
      {(data?.insights || []).length === 0 ? (
        <EmptyState
          title="No behavioural cards yet"
          description="Keep journaling sessions to unlock process insights."
        />
      ) : (
        <View style={styles.list}>
          {(data?.insights || []).map((insight, index) => (
            <Card key={insight._id || `${insight.title}-${index}`}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {insight.title}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                {insight.body}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 6 }}>
                {insight.category}
                {typeof insight.score === "number"
                  ? ` · score ${insight.score}`
                  : ""}
              </Text>
            </Card>
          ))}
        </View>
      )}

      <SectionHeader title="Your onboarding challenges" />
      <Card>
        {challenges.length ? (
          <View style={styles.chips}>
            {challenges.map((challenge) => (
              <Chip key={challenge} label={titleCase(challenge)} selected />
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary }}>
            Complete onboarding to pin the leaks you already know about.
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
