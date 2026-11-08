import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";

import { createTradingAccountService } from "@/api/accounts";
import { Button, Chip, PageHeader, Screen, TextField } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { CreateTradingAccountPayload } from "@/types/account";
import { spacing, typography, useAppTheme } from "@/theme";

const ACCOUNT_TYPES: CreateTradingAccountPayload["accountType"][] = [
  "demo",
  "live",
  "prop",
  "challenge",
];

export default function CreateAccountScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] =
    useState<CreateTradingAccountPayload["accountType"]>("demo");
  const [broker, setBroker] = useState("");
  const [platform, setPlatform] = useState("MT5");
  const [leverage, setLeverage] = useState("1:100");
  const [currency, setCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("10000");
  const [maxDrawnDown, setMaxDrawnDown] = useState("10");
  const [profitTarget, setProfitTarget] = useState("10");

  const onSubmit = async () => {
    setError(null);
    if (!accountName.trim() || !broker.trim() || !accountNumber.trim()) {
      setError("Name, broker, and account number are required.");
      return;
    }
    const balance = Number(initialBalance);
    if (!Number.isFinite(balance) || balance <= 0) {
      setError("Initial balance must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      await createTradingAccountService({
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        broker: broker.trim(),
        platform: platform.trim() || "MT5",
        leverage: leverage.trim() || "1:100",
        currency: currency.trim().toUpperCase() || "USD",
        accountCurrency: currency.trim().toUpperCase() || "USD",
        initialBalance: balance,
        maxDrawnDown: Number(maxDrawnDown) || 0,
        profitTarget: Number(profitTarget) || 0,
      });
      Alert.alert("Account created", "Your trading account is ready.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "New Account" }} />

      <PageHeader
        eyebrow="Accounts"
        title="New trading account"
        description="Create a manual account for journaling. Connect MT5 or cTrader afterward for live sync."
        action={
          <Button
            title="Brokers"
            variant="ghost"
            fullWidth={false}
            size="sm"
            onPress={() => router.push("/brokers/index")}
          />
        }
      />

      <View style={[styles.form, isTablet && styles.formWide]}>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Account name"
            value={accountName}
            onChangeText={setAccountName}
            placeholder="FTMO Challenge"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="123456"
          />
        </View>
        <View style={styles.fullRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Account type
          </Text>
          <View style={styles.chips}>
            {ACCOUNT_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={accountType === type}
                onPress={() => setAccountType(type)}
              />
            ))}
          </View>
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Broker"
            value={broker}
            onChangeText={setBroker}
            placeholder="FTMO"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Platform
          </Text>
          <View style={styles.chips}>
            {["MT5", "MT4", "cTrader", "TradingView", "Other"].map((item) => (
              <Chip
                key={item}
                label={item}
                selected={platform === item}
                onPress={() => setPlatform(item)}
              />
            ))}
          </View>
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Leverage"
            value={leverage}
            onChangeText={setLeverage}
            placeholder="1:100"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Currency"
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            placeholder="USD"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Initial balance"
            value={initialBalance}
            onChangeText={setInitialBalance}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Max drawdown %"
            value={maxDrawnDown}
            onChangeText={setMaxDrawnDown}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={isTablet ? styles.fieldHalf : styles.fullRow}>
          <TextField
            label="Profit target %"
            value={profitTarget}
            onChangeText={setProfitTarget}
            keyboardType="decimal-pad"
          />
        </View>

        {error ? (
          <Text style={[{ color: colors.danger }, styles.fullRow]}>{error}</Text>
        ) : null}
        <View style={[styles.actions, styles.fullRow]}>
          <Button title="Create account" onPress={onSubmit} loading={loading} />
          <Button
            title="Open broker connections"
            variant="ghost"
            onPress={() => router.push("/brokers/index")}
          />
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
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
