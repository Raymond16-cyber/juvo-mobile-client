import { useCallback, useMemo, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import { getTradingAccountsService } from "@/api/accounts";
import {
  attemptBinaryJournalExport,
  shareJournalsJsonExport,
} from "@/api/export";
import { getUserJournalsService } from "@/api/journals";
import {
  Button,
  Card,
  Chip,
  PageHeader,
  Screen,
  TextField,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import type { JournalHistoryItem } from "@/types/journal";
import type { TradingAccount } from "@/types/account";
import { spacing, typography, useAppTheme } from "@/theme";

function csvCell(value: unknown) {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  let text = String(value);
  if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function accountIdOf(journal: JournalHistoryItem) {
  const account = journal.tradingAccount;
  return typeof account === "string" ? account : account?._id || "";
}

function buildJournalsCsv(journals: JournalHistoryItem[]) {
  const rows: unknown[][] = [
    [
      "Date",
      "Journal ID",
      "Status",
      "Trades",
      "Open",
      "Closed",
      "Reporting P/L",
      "Currency",
    ],
  ];
  for (const journal of journals) {
    rows.push([
      String(journal.journalDate || "").slice(0, 10),
      journal._id,
      journal.status,
      journal.tradesCount ?? journal.trades?.length ?? 0,
      journal.openTrades ?? 0,
      journal.closedTrades ?? 0,
      journal.totalProfitLossReporting ?? journal.totalProfitLoss ?? 0,
      journal.reportingCurrency || "",
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export default function ExportScreen() {
  const { colors } = useAppTheme();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [busy, setBusy] = useState<"json" | "csv" | "pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await getTradingAccountsService();
      setAccounts(res.data || []);
    } catch {
      // optional filter source
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccounts();
    }, [loadAccounts]),
  );

  const filters = useMemo(
    () => ({
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      accountId: accountId || undefined,
    }),
    [from, to, accountId],
  );

  const onExportJson = async () => {
    setBusy("json");
    setError(null);
    try {
      await shareJournalsJsonExport(filters);
    } catch (err) {
      setError(getApiErrorMessage(err, "JSON export failed."));
    } finally {
      setBusy(null);
    }
  };

  const onExportCsv = async () => {
    setBusy("csv");
    setError(null);
    try {
      const res = await getUserJournalsService();
      let journals = res.data || [];
      if (filters.from || filters.to || filters.accountId) {
        journals = journals.filter((journal) => {
          const day = String(journal.journalDate || "").slice(0, 10);
          if (filters.from && day < filters.from) return false;
          if (filters.to && day > filters.to) return false;
          if (filters.accountId && accountIdOf(journal) !== filters.accountId) {
            return false;
          }
          return true;
        });
      }
      await Share.share({
        message: buildJournalsCsv(journals),
        title: "JUVO journal CSV",
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "CSV export failed."));
    } finally {
      setBusy(null);
    }
  };

  const onBinary = async (format: "pdf" | "excel") => {
    setBusy(format);
    setError(null);
    try {
      await attemptBinaryJournalExport(format, filters);
    } catch (err) {
      Alert.alert(
        "Export",
        getApiErrorMessage(err, "PDF/Excel open best on web. Use JSON or CSV."),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Export" }} />
      <PageHeader
        eyebrow="Data"
        title="Export journals"
        description="Share JSON or CSV from your phone. PDF and Excel work best on web."
      />

      <Card style={styles.card}>
        <TextField
          label="From (YYYY-MM-DD)"
          value={from}
          onChangeText={setFrom}
          placeholder="2025-01-01"
          autoCapitalize="none"
        />
        <TextField
          label="To (YYYY-MM-DD)"
          value={to}
          onChangeText={setTo}
          placeholder="2025-12-31"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Account (optional)
        </Text>
        <View style={styles.chips}>
          <Chip
            label="All"
            selected={!accountId}
            onPress={() => setAccountId("")}
          />
          {accounts.map((account) => (
            <Chip
              key={account._id}
              label={account.accountName}
              selected={accountId === account._id}
              onPress={() => setAccountId(account._id)}
            />
          ))}
        </View>

        {error ? (
          <Text style={{ color: colors.danger }}>{error}</Text>
        ) : null}

        <Button
          title="Export JSON"
          onPress={() => void onExportJson()}
          loading={busy === "json"}
          disabled={!!busy}
        />
        <Button
          title="Export CSV"
          variant="secondary"
          onPress={() => void onExportCsv()}
          loading={busy === "csv"}
          disabled={!!busy}
        />
        <Button
          title="Try PDF"
          variant="ghost"
          onPress={() => void onBinary("pdf")}
          loading={busy === "pdf"}
          disabled={!!busy}
        />
        <Button
          title="Try Excel"
          variant="ghost"
          onPress={() => void onBinary("excel")}
          loading={busy === "excel"}
          disabled={!!busy}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  label: {
    ...typography.label,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
