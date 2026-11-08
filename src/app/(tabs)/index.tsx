import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { getTradingAccountsService } from "@/api/accounts";
import {
  createJournalService,
  getJournalStreakService,
  getTodayJournalStatusService,
  getUserJournalsService,
  upsertNoTradeDayService,
} from "@/api/journals";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricPill,
  PageHeader,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { formatMoney, greetingForHour, titleCase } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import type { TradingAccount } from "@/types/account";
import type {
  JournalHistoryItem,
  JournalListTradeSummary,
  JournalStatusData,
  JournalStreakData,
} from "@/types/journal";
import { spacing, typography, useAppTheme } from "@/theme";

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const { metricColumns, isTablet } = useLayout();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [status, setStatus] = useState<JournalStatusData | null>(null);
  const [streak, setStreak] = useState<JournalStreakData | null>(null);
  const [journals, setJournals] = useState<JournalHistoryItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeAccount =
    accounts.find((a) => a.isActive) || accounts[0] || null;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [accountsRes, statusRes, streakRes, journalsRes] =
        await Promise.all([
          getTradingAccountsService(),
          getTodayJournalStatusService(),
          getJournalStreakService(),
          getUserJournalsService(),
        ]);
      setAccounts(accountsRes.data || []);
      setStatus(statusRes.data);
      setStreak(streakRes.data || statusRes.data.streak || null);
      setJournals(journalsRes.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load dashboard."));
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

  const recentTrades: Array<
    JournalListTradeSummary & { journalId: string }
  > = journals
    .flatMap((journal) =>
      (journal.trades || []).map((trade) => ({
        ...trade,
        journalId: journal._id,
      })),
    )
    .slice(0, 6);

  const todayPnl = journals.find((j) => {
    const day = j.journalDate?.slice(0, 10);
    return day === status?.date || j._id === status?.journal?._id;
  })?.totalProfitLoss;

  const ensureTodayJournal = async () => {
    if (!activeAccount) {
      router.push("/accounts/create");
      return null;
    }
    if (status?.journal?._id) return status.journal._id;
    const created = await createJournalService({
      tradingAccount: activeAccount._id,
    });
    setStatus(created.data);
    return created.data.journal?._id || null;
  };

  const onStartDay = async () => {
    setActionLoading("start");
    try {
      await ensureTodayJournal();
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start day."));
    } finally {
      setActionLoading(null);
    }
  };

  const onAddTrade = async () => {
    setActionLoading("trade");
    try {
      const journalId = await ensureTodayJournal();
      if (journalId) {
        router.push({
          pathname: "/journal/add-trade",
          params: { journalId },
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not open add trade."));
    } finally {
      setActionLoading(null);
    }
  };

  const onNoTrade = async () => {
    setActionLoading("notrade");
    try {
      await upsertNoTradeDayService({
        confirmed: true,
        reason: "no_valid_setup",
        tradingAccount: activeAccount?._id || null,
      });
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not mark no-trade day."));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading dashboard…" />
      </Screen>
    );
  }

  if (error && !accounts.length && !journals.length) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "Trader";
  const currency =
    activeAccount?.accountCurrency || activeAccount?.currency || "USD";

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <PageHeader
            eyebrow={greetingForHour()}
            title={firstName}
            description={
              activeAccount
                ? `${activeAccount.accountName} · keep the process tight today.`
                : "Create a trading account to start your day."
            }
          />
        </View>
        <Avatar name={user?.fullName} size={48} />
      </View>

      {error ? (
        <Text style={{ color: colors.danger, marginBottom: spacing.md }}>
          {error}
        </Text>
      ) : null}

      <Card style={styles.accountCard}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {activeAccount
            ? `${activeAccount.accountName} · ${activeAccount.broker}`
            : "No trading account"}
        </Text>
        {activeAccount ? (
          <View
            style={[
              styles.metricsRow,
              metricColumns > 1 && styles.metricsRowWide,
              isTablet && styles.metricsRowTablet,
            ]}
          >
            <MetricPill
              label="Balance"
              value={formatMoney(activeAccount.currentBalance, currency)}
            />
            <MetricPill
              label="Equity"
              value={formatMoney(activeAccount.currentEquity, currency)}
            />
            <MetricPill
              label="Today P/L"
              value={
                typeof todayPnl === "number"
                  ? formatMoney(todayPnl, currency)
                  : "—"
              }
              tone={
                typeof todayPnl === "number"
                  ? todayPnl > 0
                    ? "positive"
                    : todayPnl < 0
                      ? "negative"
                      : "neutral"
                  : "neutral"
              }
            />
          </View>
        ) : (
          <Button
            title="Create account"
            onPress={() => router.push("/accounts/create")}
            style={{ marginTop: spacing.md }}
          />
        )}
      </Card>

      <Card style={styles.streakCard}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Journal streak
        </Text>
        <Text style={[styles.streakValue, { color: colors.text }]}>
          {streak?.currentStreak ?? user?.stats?.currentJournalStreak ?? 0} days
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          {streak?.message || "Complete today to keep your streak alive."}
        </Text>
      </Card>

      <SectionHeader title="Quick actions" />
      <View style={styles.actions}>
        <Button
          title="Start Day"
          variant="secondary"
          onPress={onStartDay}
          loading={actionLoading === "start"}
          style={styles.actionBtn}
        />
        <Button
          title="Add Trade"
          onPress={onAddTrade}
          loading={actionLoading === "trade"}
          style={styles.actionBtn}
        />
        <Button
          title="No Trade"
          variant="ghost"
          onPress={onNoTrade}
          loading={actionLoading === "notrade"}
          style={styles.actionBtn}
        />
      </View>

      <SectionHeader
        title="Recent trades"
        actionLabel="See all"
        onAction={() => router.push("/(tabs)/journal")}
      />

      {recentTrades.length === 0 ? (
        <EmptyState
          title="No trades yet"
          description="Log your first trade to see it here."
          actionLabel="Add trade"
          onAction={onAddTrade}
        />
      ) : (
        <View style={styles.tradeList}>
          {recentTrades.map((trade) => {
            const pnl = trade.profitLoss || 0;
            return (
              <Pressable
                key={trade._id}
                onPress={() => router.push(`/journal/${trade.journalId}`)}
              >
                <Card style={styles.tradeCard}>
                  <View style={styles.tradeRow}>
                    <View>
                      <Text style={[styles.tradeSymbol, { color: colors.text }]}>
                        {trade.symbol}
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        {titleCase(trade.direction)} · {trade.status}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color:
                          pnl > 0
                            ? colors.success
                            : pnl < 0
                              ? colors.danger
                              : colors.text,
                        fontWeight: "700",
                      }}
                    >
                      {formatMoney(pnl, trade.profitLossCurrency || currency)}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  accountCard: {
    marginBottom: spacing.md,
  },
  streakCard: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricsRowWide: {
    justifyContent: "flex-start",
  },
  metricsRowTablet: {
    gap: spacing.md,
  },
  streakValue: {
    ...typography.heading,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    marginBottom: 0,
  },
  tradeList: {
    gap: spacing.sm,
  },
  tradeCard: {
    paddingVertical: spacing.md,
  },
  tradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tradeSymbol: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
