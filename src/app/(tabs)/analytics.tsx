import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import Svg, { Polyline } from "react-native-svg";

import { periodReviewService } from "@/api/ai";
import { getAnalyticsService } from "@/api/analytics";
import {
  Button,
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
import { formatMoney, formatPercent } from "@/lib/format";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { AnalyticsData } from "@/types/analytics";
import { spacing, typography, useAppTheme } from "@/theme";

type PeriodReview = {
  headline?: string;
  narrative?: string;
  summary?: string;
  wins?: string[];
  leaks?: string[];
  improvements?: string[];
  attention?: string[];
  patterns?: string[];
  comparison?: string;
  nextFocus?: string;
  insufficientData?: boolean;
  cached?: boolean;
  stats?: {
    periodPnl?: number;
    periodTrades?: number;
    journalDays?: number;
  };
};

function Sparkline({
  points,
  color,
  width = 320,
  height = 80,
}: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const { metricColumns, isTablet } = useLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [review, setReview] = useState<PeriodReview | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsService();
      setData(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load analytics."));
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

  const equityPoints = useMemo(
    () => (data?.equityCurve || []).map((p) => p.equity),
    [data],
  );

  const onPeriodReview = async (forceRefresh = false) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await periodReviewService({ period, forceRefresh });
      setReview(res.data || null);
    } catch (err) {
      const code = getApiErrorCode(err);
      const message = getApiErrorMessage(err, "Period review failed.");
      if (
        code === "FEATURE_LOCKED" ||
        code === "ENTITLEMENT_REQUIRED" ||
        /upgrade|pro|entitlement|access|trial/i.test(message)
      ) {
        setReviewError("Period review needs Pro/Super or an active AI trial.");
      } else {
        setReviewError(message);
      }
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading analytics…" />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <EmptyState
          title="No analytics yet"
          description="Add trades to unlock performance insights."
        />
      </Screen>
    );
  }

  const currency = data.reportingCurrency || data.currency || "USD";
  const summary = data.summary;
  const topSymbols = (data.bySymbol || []).slice(0, 5);

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Equity, win rate, and behaviour signals from your journals."
      />

      <Card style={styles.reviewCard}>
        <Text style={[styles.reviewTitle, { color: colors.text }]}>
          AI period review
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Narrative summary grounded in your journals and analytics.
        </Text>
        <View style={styles.periodChips}>
          <Chip
            label="Weekly"
            selected={period === "week"}
            onPress={() => {
              setPeriod("week");
              setReview(null);
            }}
          />
          <Chip
            label="Monthly"
            selected={period === "month"}
            onPress={() => {
              setPeriod("month");
              setReview(null);
            }}
          />
        </View>
        <Button
          title={reviewLoading ? "Generating…" : "Generate review"}
          onPress={() => void onPeriodReview(false)}
          loading={reviewLoading}
          style={{ marginTop: spacing.sm }}
        />
        {reviewError ? (
          <Text style={{ color: colors.danger, marginTop: spacing.sm }}>
            {reviewError}
          </Text>
        ) : null}
        {review ? (
          <View style={styles.reviewBody}>
            {review.insufficientData ? (
              <Text style={{ color: colors.textSecondary }}>
                Not enough journal data for a confident review yet.
              </Text>
            ) : null}
            {review.headline ? (
              <Text style={[styles.reviewTitle, { color: colors.text }]}>
                {review.headline}
              </Text>
            ) : null}
            {review.narrative || review.summary ? (
              <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                {review.narrative || review.summary}
              </Text>
            ) : null}
            {review.nextFocus ? (
              <Text style={{ color: colors.primary, marginTop: spacing.xs }}>
                Next focus: {review.nextFocus}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Card>

      <View
        style={[
          styles.metrics,
          metricColumns > 1 && styles.metricsWide,
          isTablet && styles.metricsTablet,
        ]}
      >
        <MetricPill
          label="Net P/L"
          value={formatMoney(summary.netPnl, currency)}
          tone={
            summary.netPnl > 0
              ? "positive"
              : summary.netPnl < 0
                ? "negative"
                : "neutral"
          }
        />
        <MetricPill
          label="Win rate"
          value={formatPercent(summary.winRate)}
        />
        <MetricPill
          label="Profit factor"
          value={summary.profitFactor.toFixed(2)}
        />
        <MetricPill label="Trades" value={String(summary.trades)} />
        <MetricPill
          label="Max DD"
          value={formatMoney(summary.maxDrawdown, currency)}
          tone="negative"
        />
        <MetricPill label="Avg R:R" value={summary.avgRr.toFixed(2)} />
      </View>

      <SectionHeader title="Equity" />
      <Card style={styles.chartCard}>
        {equityPoints.length > 1 ? (
          <Sparkline points={equityPoints} color={colors.primary} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>
            Not enough closed trades for a curve yet.
          </Text>
        )}
      </Card>

      <SectionHeader title="Top symbols" />
      {topSymbols.length === 0 ? (
        <EmptyState title="No symbol breakdown yet" />
      ) : (
        <View style={[styles.list, isTablet && styles.listWide]}>
          {topSymbols.map((item) => (
            <Card
              key={item.symbol}
              style={isTablet ? styles.listItemWide : undefined}
            >
              <View style={styles.row}>
                <View>
                  <Text style={[styles.symbol, { color: colors.text }]}>
                    {item.symbol}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {item.trades} trades · {formatPercent(item.winRate)} WR
                  </Text>
                </View>
                <Text
                  style={{
                    fontWeight: "700",
                    color:
                      item.pnl > 0
                        ? colors.success
                        : item.pnl < 0
                          ? colors.danger
                          : colors.text,
                  }}
                >
                  {formatMoney(item.pnl, currency)}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionHeader title="Behaviour" />
      <View
        style={[
          styles.metrics,
          metricColumns > 1 && styles.metricsWide,
          isTablet && styles.metricsTablet,
        ]}
      >
        <MetricPill
          label="Revenge days"
          value={String(summary.revengeDays || 0)}
          tone={summary.revengeDays > 0 ? "negative" : "neutral"}
        />
        <MetricPill
          label="Overtrade days"
          value={String(summary.overtradeDays || 0)}
          tone={summary.overtradeDays > 0 ? "negative" : "neutral"}
        />
        <MetricPill
          label="Avg discipline"
          value={summary.avgDiscipline?.toFixed(0) || "—"}
        />
      </View>

      {(data.insights || []).length > 0 ? (
        <View style={[styles.list, { marginTop: spacing.md }]}>
          {(data.insights || []).slice(0, 4).map((insight, index) => (
            <Card key={insight._id || `${insight.title}-${index}`}>
              <Text style={[styles.symbol, { color: colors.text }]}>
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
      ) : (
        <Text style={{ color: colors.textSecondary }}>
          Behavioural insight cards appear as you journal more sessions.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  reviewTitle: {
    ...typography.subtitle,
  },
  periodChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  reviewBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricsWide: {
    justifyContent: "flex-start",
  },
  metricsTablet: {
    gap: spacing.md,
  },
  chartCard: {
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listItemWide: {
    width: "48%",
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  symbol: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
