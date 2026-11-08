import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  activateTradingAccountService,
  archiveTradingAccountService,
  getArchivedTradingAccountsService,
  getTradingAccountsService,
  restoreTradingAccountService,
} from "@/api/accounts";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { formatMoney, titleCase } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { TradingAccount } from "@/types/account";
import { spacing, typography, useAppTheme } from "@/theme";

export default function AccountsScreen() {
  const { colors } = useAppTheme();
  const { isTablet, metricColumns } = useLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [archived, setArchived] = useState<TradingAccount[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        getTradingAccountsService(),
        getArchivedTradingAccountsService().catch(() => ({ data: [] as TradingAccount[], message: "" })),
      ]);
      setAccounts(activeRes.data || []);
      setArchived(archivedRes.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load accounts."));
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

  const onActivate = async (accountId: string) => {
    setBusyId(accountId);
    try {
      await activateTradingAccountService(accountId);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not activate account."));
    } finally {
      setBusyId(null);
    }
  };

  const onArchive = (account: TradingAccount) => {
    Alert.alert(
      "Archive account",
      `Archive ${account.accountName}? Journals and trades stay in history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () =>
            void (async () => {
              setBusyId(account._id);
              try {
                await archiveTradingAccountService(account._id);
                await load(true);
              } catch (err) {
                setError(
                  getApiErrorMessage(err, "Could not archive account."),
                );
              } finally {
                setBusyId(null);
              }
            })(),
        },
      ],
    );
  };

  const onRestore = async (accountId: string) => {
    setBusyId(accountId);
    try {
      await restoreTradingAccountService(accountId);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not restore account."));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Accounts" }} />
        <LoadingState label="Loading accounts…" />
      </Screen>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Accounts" }} />
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      includeBottomInset
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <Stack.Screen options={{ title: "Accounts" }} />

      <PageHeader
        eyebrow="Workspace"
        title="Trading accounts"
        description="Manual accounts power journaling. Connect MT5 or cTrader when you want live sync."
        action={
          <Button
            title="Add"
            variant="ghost"
            fullWidth={false}
            size="sm"
            onPress={() => router.push("/accounts/create")}
          />
        }
      />

      <Card style={styles.intro}>
        <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
          Keep one active account for daily journaling, then archive accounts you
          are not using right now.
        </Text>
        <Button
          title="Broker connections"
          variant="secondary"
          onPress={() => router.push("/brokers/index")}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {accounts.length === 0 ? (
        <EmptyState
          title="No trading accounts"
          description="Create an account to start journaling trades."
          actionLabel="Create account"
          onAction={() => router.push("/accounts/create")}
        />
      ) : null}

      {error && accounts.length > 0 ? (
        <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>
          {error}
        </Text>
      ) : null}

      <View style={[styles.list, isTablet && styles.listWide]}>
        {accounts.map((account) => {
          const currency = account.accountCurrency || account.currency;
          const pnl = account.totalProfitLoss || 0;

          return (
            <Card
              key={account._id}
              style={isTablet ? styles.cardWide : undefined}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {account.accountName}
                    {account.isActive ? " · Active" : ""}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {account.broker} · {titleCase(account.accountType)} ·{" "}
                    {account.platform}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                    #{account.accountNumber}
                    {account.server ? ` · ${account.server}` : ""}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.metrics,
                  metricColumns === 1 && styles.metricsStack,
                ]}
              >
                <Metric
                  label="Balance"
                  value={formatMoney(account.currentBalance, currency)}
                  colors={colors}
                />
                <Metric
                  label="Equity"
                  value={formatMoney(account.currentEquity, currency)}
                  colors={colors}
                />
                <Metric
                  label="P/L"
                  value={formatMoney(pnl, currency)}
                  colors={colors}
                  tone={pnl > 0 ? "up" : pnl < 0 ? "down" : "flat"}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={{ color: colors.textMuted }}>
                  {account.tradesCount || 0} trades
                  {account.status ? ` · ${account.status}` : ""}
                  {account.isConnected ? " · Broker linked" : ""}
                </Text>
              </View>

              <View style={styles.actions}>
                {!account.isActive ? (
                  <Button
                    title="Set active"
                    variant="secondary"
                    fullWidth={false}
                    loading={busyId === account._id}
                    disabled={!!busyId}
                    onPress={() => void onActivate(account._id)}
                    style={styles.actionBtn}
                  />
                ) : null}
                <Button
                  title="Archive"
                  variant="ghost"
                  fullWidth={false}
                  disabled={!!busyId}
                  onPress={() => onArchive(account)}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          );
        })}
      </View>

      <SectionHeader title="Archived" />
      <Button
        title={
          showArchived
            ? `Hide archived (${archived.length})`
            : `Show archived (${archived.length})`
        }
        variant="ghost"
        onPress={() => setShowArchived((v) => !v)}
        style={{ marginBottom: spacing.sm }}
      />
      {showArchived ? (
        archived.length === 0 ? (
          <EmptyState title="No archived accounts" />
        ) : (
          <View style={styles.list}>
            {archived.map((account) => {
              const currency = account.accountCurrency || account.currency;
              return (
                <Card key={account._id}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {account.accountName}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {account.broker} · {formatMoney(account.currentBalance, currency)}
                  </Text>
                  <Button
                    title="Restore"
                    variant="secondary"
                    fullWidth={false}
                    loading={busyId === account._id}
                    disabled={!!busyId}
                    onPress={() => void onRestore(account._id)}
                    style={{ ...styles.actionBtn, marginTop: spacing.md }}
                  />
                </Card>
              );
            })}
          </View>
        )
      ) : null}
    </Screen>
  );
}

function Metric({
  label,
  value,
  colors,
  tone = "flat",
}: {
  label: string;
  value: string;
  colors: { text: string; textMuted: string; success: string; danger: string };
  tone?: "up" | "down" | "flat";
}) {
  const valueColor =
    tone === "up"
      ? colors.success
      : tone === "down"
        ? colors.danger
        : colors.text;

  return (
    <View style={styles.metric}>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: valueColor, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWide: {
    width: "48%",
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metricsStack: {
    flexWrap: "wrap",
  },
  metric: {
    flex: 1,
    gap: 2,
    minWidth: 88,
  },
  metaRow: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    minWidth: 110,
    paddingHorizontal: spacing.md,
  },
});
