import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { journalInterviewerService } from "@/api/ai";
import {
  closeJournalTradeService,
  completeJournalService,
  getJournalByIdService,
} from "@/api/journals";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { JournalDetail, JournalDetailTrade } from "@/types/journal";
import { spacing, typography, useAppTheme } from "@/theme";

export default function JournalDetailScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journal, setJournal] = useState<JournalDetail | null>(null);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [closeStatus, setCloseStatus] = useState<"Closed" | "Breakeven" | "Cancelled">(
    "Closed",
  );
  const [savingClose, setSavingClose] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [lesson, setLesson] = useState("");
  const [afterTrading, setAfterTrading] = useState("");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [followedRisk, setFollowedRisk] = useState(true);
  const [revengeTraded, setRevengeTraded] = useState(false);
  const [overTraded, setOverTraded] = useState(false);
  const [respectedSl, setRespectedSl] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [interviewReply, setInterviewReply] = useState<string | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getJournalByIdService(id);
      setJournal(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load journal."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onCloseTrade = async (trade: JournalDetailTrade) => {
    const price = Number(exitPrice);
    if (!Number.isFinite(price)) {
      Alert.alert("Exit price required", "Enter a valid exit price.");
      return;
    }
    if (!id) return;
    setSavingClose(true);
    try {
      await closeJournalTradeService(id, trade._id, {
        exitPrice: price,
        status: closeStatus,
      });
      setClosingTradeId(null);
      setExitPrice("");
      await load();
    } catch (err) {
      Alert.alert("Close failed", getApiErrorMessage(err, "Could not close trade."));
    } finally {
      setSavingClose(false);
    }
  };

  const onComplete = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      await completeJournalService(id, {
        afterTrading: afterTrading.trim() || undefined,
        lessonLearned: lesson.trim() || undefined,
        followedTradingPlan: followedPlan,
        followedRiskManagement: followedRisk,
        revengeTraded,
        overTraded,
        respectedStopLoss: respectedSl,
      });
      setShowComplete(false);
      await load();
      Alert.alert("Day completed", "Your journal review was saved.");
    } catch (err) {
      Alert.alert(
        "Complete failed",
        getApiErrorMessage(err, "Could not complete journal."),
      );
    } finally {
      setCompleting(false);
    }
  };

  const onSmartInterview = async () => {
    if (!id) return;
    setInterviewLoading(true);
    setInterviewError(null);
    try {
      const res = await journalInterviewerService({ journalId: id });
      setInterviewQuestions(res.data?.questions || []);
      setInterviewReply(res.data?.reply || res.message || null);
    } catch (err) {
      const code = getApiErrorCode(err);
      const message = getApiErrorMessage(
        err,
        "Could not run Smart Interviewer.",
      );
      if (
        code === "FEATURE_LOCKED" ||
        code === "ENTITLEMENT_REQUIRED" ||
        /upgrade|pro|entitlement|access|trial/i.test(message)
      ) {
        setInterviewError(
          "Smart Interviewer needs an eligible plan or trial. Upgrade in Subscription, or try again later.",
        );
      } else {
        setInterviewError(message);
      }
    } finally {
      setInterviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Journal" }} />
        <LoadingState label="Loading journal…" />
      </Screen>
    );
  }

  if (error || !journal) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Journal" }} />
        <ErrorState
          message={error || "Journal not found."}
          onRetry={() => void load()}
        />
      </Screen>
    );
  }

  const currency = journal.reportingCurrency || "USD";
  const pnl = journal.totalProfitLossReporting ?? journal.totalProfitLoss;
  const isOpen = journal.status === "Started";

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: formatDate(journal.journalDate) }} />

      <PageHeader
        eyebrow="Journal"
        title={formatDate(journal.journalDate)}
        description={`${journal.status} · ${journal.trades?.length || 0} trades · Review discipline and close the day with clarity.`}
        action={
          isOpen ? (
            <Button
              title="Add trade"
              variant="ghost"
              fullWidth={false}
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/journal/add-trade",
                  params: { journalId: journal._id },
                })
              }
            />
          ) : undefined
        }
      />

      <Card style={styles.summary}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Reporting P/L
        </Text>
        <Text
          style={[
            styles.pnl,
            {
              color:
                (pnl || 0) > 0
                  ? colors.success
                  : (pnl || 0) < 0
                    ? colors.danger
                    : colors.text,
            },
          ]}
        >
          {formatMoney(pnl || 0, currency)}
        </Text>
      </Card>

      {isOpen ? (
        <View style={[styles.actions, isTablet && styles.actionsWide]}>
          <Button
            title="Add trade"
            onPress={() =>
              router.push({
                pathname: "/journal/add-trade",
                params: { journalId: journal._id },
              })
            }
            style={isTablet ? styles.actionHalf : undefined}
          />
          <Button
            title="Complete day"
            variant="secondary"
            onPress={() => setShowComplete((v) => !v)}
            style={isTablet ? styles.actionHalf : undefined}
          />
        </View>
      ) : null}

      <Card style={styles.interviewCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Smart Interviewer
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Get reflective questions grounded in this journal day.
        </Text>
        <Button
          title="Run interviewer"
          variant="secondary"
          onPress={() => void onSmartInterview()}
          loading={interviewLoading}
          style={{ marginTop: spacing.sm }}
        />
        {interviewError ? (
          <Text style={{ color: colors.danger, marginTop: spacing.sm }}>
            {interviewError}
          </Text>
        ) : null}
        {interviewReply ? (
          <Text
            style={{
              color: colors.text,
              marginTop: spacing.sm,
              lineHeight: 22,
            }}
          >
            {interviewReply}
          </Text>
        ) : null}
        {interviewQuestions.length > 0 ? (
          <View style={styles.questions}>
            {interviewQuestions.map((question) => (
              <Text
                key={question}
                style={{ color: colors.textSecondary, lineHeight: 22 }}
              >
                • {question}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      {showComplete && isOpen ? (
        <Card style={styles.completeCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            End-of-day review
          </Text>
          <TextField
            label="After trading notes"
            value={afterTrading}
            onChangeText={setAfterTrading}
            multiline
            placeholder="How did the session feel?"
          />
          <TextField
            label="Lesson learned"
            value={lesson}
            onChangeText={setLesson}
            multiline
            placeholder="One thing to carry forward"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Discipline
          </Text>
          <View style={styles.chips}>
            <Chip
              label="Followed plan"
              selected={followedPlan}
              onPress={() => setFollowedPlan((v) => !v)}
            />
            <Chip
              label="Followed risk"
              selected={followedRisk}
              onPress={() => setFollowedRisk((v) => !v)}
            />
            <Chip
              label="Respected SL"
              selected={respectedSl}
              onPress={() => setRespectedSl((v) => !v)}
            />
            <Chip
              label="Revenge traded"
              selected={revengeTraded}
              onPress={() => setRevengeTraded((v) => !v)}
            />
            <Chip
              label="Over traded"
              selected={overTraded}
              onPress={() => setOverTraded((v) => !v)}
            />
          </View>
          <Button
            title="Save & complete"
            onPress={onComplete}
            loading={completing}
          />
        </Card>
      ) : null}

      <SectionHeader title="Trades" />
      {(journal.trades || []).length === 0 ? (
        <EmptyState
          title="No trades in this journal"
          actionLabel={isOpen ? "Add trade" : undefined}
          onAction={
            isOpen
              ? () =>
                  router.push({
                    pathname: "/journal/add-trade",
                    params: { journalId: journal._id },
                  })
              : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {(journal.trades || []).map((trade) => (
            <Card key={trade._id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.symbol, { color: colors.text }]}>
                    {trade.symbol}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {titleCase(trade.direction)} · {trade.status}
                    {trade.session ? ` · ${trade.session}` : ""}
                  </Text>
                  {trade.entryPrice != null ? (
                    <Text style={{ color: colors.textMuted }}>
                      Entry {trade.entryPrice}
                      {trade.stopLoss != null ? ` · SL ${trade.stopLoss}` : ""}
                      {trade.takeProfit != null
                        ? ` · TP ${trade.takeProfit}`
                        : ""}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontWeight: "700",
                    color:
                      trade.profitLoss > 0
                        ? colors.success
                        : trade.profitLoss < 0
                          ? colors.danger
                          : colors.text,
                  }}
                >
                  {formatMoney(
                    trade.profitLoss || 0,
                    trade.profitLossCurrency || currency,
                  )}
                </Text>
              </View>

              {isOpen && trade.status === "Open" ? (
                closingTradeId === trade._id ? (
                  <View style={styles.closeBox}>
                    <TextField
                      label="Exit price"
                      value={exitPrice}
                      onChangeText={setExitPrice}
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.chips}>
                      {(["Closed", "Breakeven", "Cancelled"] as const).map(
                        (status) => (
                          <Chip
                            key={status}
                            label={status}
                            selected={closeStatus === status}
                            onPress={() => setCloseStatus(status)}
                          />
                        ),
                      )}
                    </View>
                    <Button
                      title="Confirm close"
                      onPress={() => void onCloseTrade(trade)}
                      loading={savingClose}
                    />
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={() => {
                        setClosingTradeId(null);
                        setExitPrice("");
                      }}
                    />
                  </View>
                ) : (
                  <Button
                    title="Close trade"
                    variant="secondary"
                    onPress={() => {
                      setClosingTradeId(trade._id);
                      setExitPrice(
                        trade.takeProfit != null ? String(trade.takeProfit) : "",
                      );
                    }}
                    style={{ marginTop: spacing.md }}
                  />
                )
              ) : null}
            </Card>
          ))}
        </View>
      )}

      {journal.review?.lessonLearned || journal.psychology?.beforeTrading ? (
        <>
          <SectionHeader title="Notes" />
          <Card>
            {journal.psychology?.beforeTrading ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Before: {journal.psychology.beforeTrading}
              </Text>
            ) : null}
            {journal.review?.lessonLearned ? (
              <Text style={{ color: colors.text }}>
                Lesson: {journal.review.lessonLearned}
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
  },
  pnl: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionsWide: {
    flexDirection: "row",
  },
  actionHalf: {
    flex: 1,
  },
  completeCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  interviewCard: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  questions: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  symbol: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  closeBox: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
