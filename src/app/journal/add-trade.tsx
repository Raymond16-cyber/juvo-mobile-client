import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { getTradingAccountsService } from "@/api/accounts";
import {
  createJournalService,
  createJournalTradeService,
  getTodayJournalStatusService,
} from "@/api/journals";
import { Button, Chip, PageHeader, Screen, TextField } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import { titleCase } from "@/lib/format";
import { useLayout } from "@/lib/layout";
import type { CreateTradePayload } from "@/types/journal";
import { spacing, typography, useAppTheme } from "@/theme";

const INSTRUMENTS: CreateTradePayload["instrument"][] = [
  "forex",
  "crypto",
  "stocks",
  "indices",
  "commodities",
  "others",
];

const SESSIONS: NonNullable<CreateTradePayload["session"]>[] = [
  "Asian",
  "Tokyo",
  "London",
  "New York",
];

export default function AddTradeScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const params = useLocalSearchParams<{ journalId?: string }>();

  const [symbol, setSymbol] = useState("");
  const [instrument, setInstrument] =
    useState<CreateTradePayload["instrument"]>("forex");
  const [direction, setDirection] =
    useState<CreateTradePayload["direction"]>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("1");
  const [session, setSession] = useState<
    CreateTradePayload["session"] | undefined
  >("London");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(
    () => ({
      entry: Number(entryPrice),
      sl: Number(stopLoss),
      tp: takeProfit.trim() ? Number(takeProfit) : undefined,
      risk: Number(riskPercentage),
    }),
    [entryPrice, stopLoss, takeProfit, riskPercentage],
  );

  const resolveJournalId = async () => {
    if (params.journalId) return params.journalId;

    const status = await getTodayJournalStatusService();
    if (status.data.journal?._id) return status.data.journal._id;

    const accounts = await getTradingAccountsService();
    const active =
      accounts.data.find((a) => a.isActive) || accounts.data[0] || null;
    if (!active) {
      throw new Error("Create a trading account before adding a trade.");
    }

    const created = await createJournalService({
      tradingAccount: active._id,
    });
    const id = created.data.journal?._id;
    if (!id) throw new Error("Could not create today's journal.");
    return id;
  };

  const onSubmit = async () => {
    setError(null);
    if (!symbol.trim()) {
      setError("Symbol is required.");
      return;
    }
    if (!Number.isFinite(parsed.entry) || !Number.isFinite(parsed.sl)) {
      setError("Entry and stop loss must be valid numbers.");
      return;
    }
    if (!Number.isFinite(parsed.risk) || parsed.risk <= 0) {
      setError("Risk % must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const journalId = await resolveJournalId();
      const payload: CreateTradePayload = {
        symbol: symbol.trim().toUpperCase(),
        instrument,
        direction,
        entryPrice: parsed.entry,
        stopLoss: parsed.sl,
        takeProfit: parsed.tp,
        riskPercentage: parsed.risk,
        session,
        notes: notes.trim() || undefined,
      };
      await createJournalTradeService(journalId, payload);
      Alert.alert("Trade added", "Your trade was logged successfully.", [
        {
          text: "OK",
          onPress: () => router.replace(`/journal/${journalId}`),
        },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add trade."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Add Trade" }} />

      <PageHeader
        eyebrow="Journal"
        title="Add trade"
        description="Log the setup with entry, stop, risk, and session so your review stays complete."
      />

      <View style={[styles.form, isTablet && styles.formWide]}>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Symbol"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
            placeholder="EURUSD"
          />
        </View>

        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Direction
          </Text>
          <View style={styles.chips}>
            <Chip
              label="Long"
              selected={direction === "long"}
              onPress={() => setDirection("long")}
            />
            <Chip
              label="Short"
              selected={direction === "short"}
              onPress={() => setDirection("short")}
            />
          </View>
        </View>

        <View style={styles.fullRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Instrument
          </Text>
          <View style={styles.chips}>
            {INSTRUMENTS.map((item) => (
              <Chip
                key={item}
                label={titleCase(item)}
                selected={instrument === item}
                onPress={() => setInstrument(item)}
              />
            ))}
          </View>
        </View>

        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Entry price"
            value={entryPrice}
            onChangeText={setEntryPrice}
            keyboardType="decimal-pad"
            placeholder="1.0850"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Stop loss"
            value={stopLoss}
            onChangeText={setStopLoss}
            keyboardType="decimal-pad"
            placeholder="1.0800"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Take profit (optional)"
            value={takeProfit}
            onChangeText={setTakeProfit}
            keyboardType="decimal-pad"
            placeholder="1.0950"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Risk %"
            value={riskPercentage}
            onChangeText={setRiskPercentage}
            keyboardType="decimal-pad"
            placeholder="1"
          />
        </View>

        <View style={styles.fullRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Session
          </Text>
          <View style={styles.chips}>
            {SESSIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={session === item}
                onPress={() => setSession(item)}
              />
            ))}
          </View>
        </View>

        <View style={styles.fullRow}>
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Setup notes…"
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>

        {error ? (
          <Text style={[{ color: colors.danger }, styles.fullRow]}>{error}</Text>
        ) : null}

        <View style={styles.fullRow}>
          <Button title="Save trade" onPress={onSubmit} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  formWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  fieldHalf: {
    width: "48%",
    gap: spacing.sm,
  },
  fullRow: {
    width: "100%",
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
