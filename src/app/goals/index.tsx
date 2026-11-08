import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getTradingAccountsService } from "@/api/accounts";
import { goalCoachService } from "@/api/ai";
import {
  createGoalService,
  deleteGoalService,
  listGoalsService,
  updateGoalService,
} from "@/api/goals";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  TextField,
} from "@/components/ui";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { Goal } from "@/types/goal";
import { spacing, typography, useAppTheme } from "@/theme";

const CATEGORIES: Goal["category"][] = [
  "Performance",
  "Risk Management",
  "Discipline",
  "Psychology",
  "Consistency",
  "Journaling",
  "Custom",
];

export default function GoalsScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("1");
  const [category, setCategory] = useState<Goal["category"]>("Discipline");
  const [saving, setSaving] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [goalsRes, accountsRes] = await Promise.all([
        listGoalsService(),
        getTradingAccountsService(),
      ]);
      setGoals(goalsRes.data || []);
      const active =
        accountsRes.data.find((a) => a.isActive) || accountsRes.data[0] || null;
      setAccountId(active?._id || null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load goals."));
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

  const onCreate = async () => {
    if (!accountId) {
      Alert.alert("Account needed", "Create a trading account first.", [
        { text: "Cancel", style: "cancel" },
        { text: "Create", onPress: () => router.push("/accounts/create") },
      ]);
      return;
    }
    if (!title.trim()) {
      setError("Goal title is required.");
      return;
    }
    const value = Number(targetValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Target value must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createGoalService({
        tradingAccount: accountId,
        title: title.trim(),
        category,
        targetType: "Count",
        targetValue: value,
        currentValue: 0,
        priority: "Medium",
      });
      setTitle("");
      setTargetValue("1");
      setShowForm(false);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create goal."));
    } finally {
      setSaving(false);
    }
  };

  const onToggleComplete = async (goal: Goal) => {
    try {
      const nextStatus = goal.status === "Completed" ? "Active" : "Completed";
      await updateGoalService(goal._id, {
        status: nextStatus,
        currentValue:
          nextStatus === "Completed" ? goal.targetValue : goal.currentValue,
      });
      await load(true);
    } catch (err) {
      Alert.alert("Update failed", getApiErrorMessage(err, "Could not update goal."));
    }
  };

  const onDelete = (goal: Goal) => {
    Alert.alert("Delete goal", `Remove “${goal.title}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteGoalService(goal._id);
              await load(true);
            } catch (err) {
              Alert.alert(
                "Delete failed",
                getApiErrorMessage(err, "Could not delete goal."),
              );
            }
          })();
        },
      },
    ]);
  };

  const onGoalCoach = async (goalId?: string) => {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const res = await goalCoachService({
        goalId: goalId || goals[0]?._id,
        action: "plan",
      });
      const steps = (res.data?.steps || []).map((step) => `• ${step}`).join("\n");
      const parts = [
        res.data?.summary,
        steps,
        res.data?.question,
        res.data?.reply,
        res.message,
      ].filter(Boolean);
      setCoachText(parts.join("\n\n") || "No coach response.");
    } catch (err) {
      const code = getApiErrorCode(err);
      const message = getApiErrorMessage(err, "Goal coach failed.");
      if (
        code === "FEATURE_LOCKED" ||
        code === "ENTITLEMENT_REQUIRED" ||
        /upgrade|pro|entitlement|access|trial/i.test(message)
      ) {
        setCoachError("Goal Coach needs Pro/Super or an active AI trial.");
      } else {
        setCoachError(message);
      }
    } finally {
      setCoachLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Goals" }} />
        <LoadingState label="Loading goals…" />
      </Screen>
    );
  }

  if (error && goals.length === 0 && !showForm) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Goals" }} />
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
      <Stack.Screen options={{ title: "Goals" }} />

      <PageHeader
        eyebrow="Process"
        title="Goals"
        description="Set process targets that keep your trading disciplined and measurable."
        action={
          <Button
            title={showForm ? "Close" : "New goal"}
            variant="ghost"
            fullWidth={false}
            size="sm"
            onPress={() => setShowForm((v) => !v)}
          />
        }
      />

      {error ? (
        <Text style={{ color: colors.danger, marginBottom: spacing.md }}>
          {error}
        </Text>
      ) : null}

      <Card style={styles.coachCard}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Goal Coach
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Get a plan or progress nudge for your active goals.
        </Text>
        <Button
          title="Ask Goal Coach"
          variant="secondary"
          onPress={() => void onGoalCoach()}
          loading={coachLoading}
          disabled={goals.length === 0}
          style={{ marginTop: spacing.sm }}
        />
        {coachError ? (
          <Text style={{ color: colors.danger, marginTop: spacing.sm }}>
            {coachError}
          </Text>
        ) : null}
        {coachText ? (
          <Text
            style={{
              color: colors.text,
              marginTop: spacing.sm,
              lineHeight: 22,
            }}
          >
            {coachText}
          </Text>
        ) : null}
      </Card>

      {showForm ? (
        <Card style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            New goal
          </Text>
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Follow risk rules for 5 days"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Category
          </Text>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>
          <TextField
            label="Target count"
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="decimal-pad"
          />
          <Button title="Save goal" onPress={onCreate} loading={saving} />
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set process goals that keep your trading disciplined."
          actionLabel="Create goal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <View style={[styles.list, isTablet && styles.listWide]}>
          {goals.map((goal) => {
            const progress =
              goal.targetValue > 0
                ? Math.min(1, (goal.currentValue || 0) / goal.targetValue)
                : 0;
            return (
              <Card
                key={goal._id}
                style={[styles.goalCard, isTablet && styles.goalCardWide]}
              >
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {goal.category} · {goal.status}
                    </Text>
                  </View>
                  <Pressable onPress={() => onDelete(goal)} hitSlop={8}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={{ color: colors.textMuted, marginTop: spacing.xs }}>
                  {goal.currentValue}/{goal.targetValue}
                  {goal.unit ? ` ${goal.unit}` : ""}
                </Text>
                <Button
                  title={
                    goal.status === "Completed"
                      ? "Mark active"
                      : "Mark complete"
                  }
                  variant="secondary"
                  onPress={() => void onToggleComplete(goal)}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  coachCard: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  formTitle: {
    ...typography.subtitle,
  },
  label: {
    ...typography.label,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  goalCard: {
    gap: spacing.xs,
  },
  goalCardWide: {
    width: "48%",
    flexGrow: 1,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  goalTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
