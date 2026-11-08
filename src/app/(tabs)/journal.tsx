import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";

import { getUserJournalsService } from "@/api/journals";
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
} from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { JournalHistoryItem } from "@/types/journal";
import { spacing, typography, useAppTheme } from "@/theme";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDayKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function JournalListScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journals, setJournals] = useState<JournalHistoryItem[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getUserJournalsService();
      setJournals(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load journals."));
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

  const journalsByDay = useMemo(() => {
    const map = new Map<string, JournalHistoryItem[]>();
    for (const journal of journals) {
      const key = toDayKey(journal.journalDate);
      const bucket = map.get(key) || [];
      bucket.push(journal);
      map.set(key, bucket);
    }
    return map;
  }, [journals]);

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const visibleJournals = useMemo(() => {
    if (!selectedDay) return journals;
    return journalsByDay.get(toDayKey(selectedDay)) || [];
  }, [journals, journalsByDay, selectedDay]);

  const monthLabel = monthCursor.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading journals…" />
      </Screen>
    );
  }

  if (error && journals.length === 0) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <PageHeader
        eyebrow="Journal"
        title="Trading journal"
        description="Review sessions, filter by day, or jump into a trade."
        action={
          <Button
            title="Add trade"
            fullWidth={false}
            size="sm"
            onPress={() => router.push("/journal/add-trade")}
          />
        }
      />

      <View style={styles.filters}>
        <Chip
          label="List"
          selected={viewMode === "list"}
          onPress={() => {
            setViewMode("list");
            setSelectedDay(null);
          }}
        />
        <Chip
          label="Calendar"
          selected={viewMode === "calendar"}
          onPress={() => setViewMode("calendar")}
        />
      </View>

      {viewMode === "calendar" ? (
        <Card style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Button
              title="Prev"
              variant="ghost"
              fullWidth={false}
              onPress={() => {
                setMonthCursor((current) => addMonths(current, -1));
                setSelectedDay(null);
              }}
              style={styles.monthBtn}
            />
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {monthLabel}
            </Text>
            <Button
              title="Next"
              variant="ghost"
              fullWidth={false}
              onPress={() => {
                setMonthCursor((current) => addMonths(current, 1));
                setSelectedDay(null);
              }}
              style={styles.monthBtn}
            />
          </View>

          <View style={styles.weekHeader}>
            {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
              <Text
                key={`${label}-${index}`}
                style={[styles.weekLabel, { color: colors.textMuted }]}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const key = toDayKey(day);
              const dayJournals = journalsByDay.get(key) || [];
              const hasEntries = dayJournals.length > 0;
              const selected = selectedDay ? sameDay(day, selectedDay) : false;
              const isToday = sameDay(day, new Date());

              return (
                <Pressable
                  key={key}
                  onPress={() =>
                    setSelectedDay((current) =>
                      current && sameDay(current, day) ? null : day,
                    )
                  }
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : hasEntries
                          ? colors.primarySoft
                          : "transparent",
                      borderColor: isToday ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? "#FFFFFF" : colors.text,
                      fontWeight: hasEntries || selected ? "700" : "500",
                    }}
                  >
                    {day.getDate()}
                  </Text>
                  {hasEntries ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: selected
                            ? "#FFFFFF"
                            : colors.primary,
                        },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      <SectionHeader
        title={
          selectedDay
            ? formatDate(selectedDay)
            : viewMode === "calendar"
              ? "Selected days"
              : "History"
        }
      />

      {visibleJournals.length === 0 ? (
        <EmptyState
          title={selectedDay ? "No journal that day" : "No journal entries"}
          description={
            selectedDay
              ? "Pick another day or clear the selection."
              : "Start your day or add a trade to create today's journal."
          }
          actionLabel={selectedDay ? undefined : "Add trade"}
          onAction={
            selectedDay ? undefined : () => router.push("/journal/add-trade")
          }
        />
      ) : (
        <View style={[styles.list, isTablet && styles.listWide]}>
          {visibleJournals.map((journal) => {
            const currency = journal.reportingCurrency || "USD";
            const pnl =
              journal.totalProfitLossReporting ?? journal.totalProfitLoss;
            const accountName =
              typeof journal.tradingAccount === "object"
                ? journal.tradingAccount?.accountName
                : undefined;

            return (
              <Card
                key={journal._id}
                onPress={() => router.push(`/journal/${journal._id}`)}
                style={isTablet ? styles.listItemWide : undefined}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.date, { color: colors.text }]}>
                      {formatDate(journal.journalDate)}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {journal.status}
                      {accountName ? ` · ${accountName}` : ""}
                      {` · ${journal.tradesCount ?? journal.trades?.length ?? 0} trades`}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontWeight: "700",
                      color:
                        pnl > 0
                          ? colors.success
                          : pnl < 0
                            ? colors.danger
                            : colors.text,
                    }}
                  >
                    {formatMoney(pnl || 0, currency)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  calendarCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  monthLabel: {
    ...typography.subtitle,
  },
  weekHeader: {
    flexDirection: "row",
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    ...typography.caption,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    marginTop: 3,
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
    alignItems: "center",
    gap: spacing.md,
  },
  date: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
