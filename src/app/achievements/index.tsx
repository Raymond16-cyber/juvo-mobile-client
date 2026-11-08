import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import {
  celebrateAchievementsService,
  getAchievementsService,
  setFeaturedAchievementsService,
} from "@/api/achievements";
import {
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { formatDate, titleCase } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type {
  AchievementCategory,
  AchievementItem,
  AchievementSummary,
  NewlyEarnedAchievement,
} from "@/types/achievement";
import { spacing, typography, useAppTheme } from "@/theme";

type ProgressFilter = "all" | "earned" | "in_progress";

const CATEGORY_LABELS: Record<AchievementCategory | "all", string> = {
  all: "All",
  journey: "Journey",
  journaling: "Journaling",
  consistency: "Consistency",
  trading_records: "Records",
  discipline: "Discipline",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#B45309",
  silver: "#94A3B8",
  gold: "#EAB308",
  platinum: "#67E8F9",
};

function progressPercent(item: AchievementItem) {
  if (item.state === "earned") return 100;
  const ratio =
    typeof item.progressRatio === "number"
      ? item.progressRatio
      : item.threshold
        ? item.current / item.threshold
        : 0;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export default function AchievementsScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [newlyEarned, setNewlyEarned] = useState<NewlyEarnedAchievement[]>([]);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [category, setCategory] = useState<AchievementCategory | "all">("all");
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await getAchievementsService();
      const payload = response.data;
      setAchievements(payload.achievements || []);
      setSummary(payload.summary);
      setNewlyEarned(payload.newlyEarned || []);

      const uncelebrated = (payload.newlyEarned || [])
        .map((item) => item.id)
        .filter(Boolean);
      if (uncelebrated.length > 0) {
        await celebrateAchievementsService(uncelebrated).catch(() => undefined);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load achievements."));
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

  const filtered = useMemo(() => {
    return achievements.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (progressFilter === "earned") return item.state === "earned";
      if (progressFilter === "in_progress") {
        return item.state !== "earned" && progressPercent(item) > 0;
      }
      return true;
    });
  }, [achievements, category, progressFilter]);

  const onToggleFeatured = async (item: AchievementItem) => {
    if (item.state !== "earned" || featuringId) return;
    setFeaturingId(item.id);
    try {
      const currentFeatured = achievements
        .filter((entry) => entry.featured)
        .map((entry) => entry.id);
      const next = item.featured
        ? currentFeatured.filter((id) => id !== item.id)
        : [...currentFeatured, item.id].slice(0, 3);
      await setFeaturedAchievementsService(next);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update featured badges."));
    } finally {
      setFeaturingId(null);
    }
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Achievements" }} />
        <LoadingState label="Loading achievements…" />
      </Screen>
    );
  }

  if (error && achievements.length === 0) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Achievements" }} />
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
      <Stack.Screen options={{ title: "Achievements" }} />

      <PageHeader
        eyebrow="Progress"
        title="Achievements"
        description={
          summary
            ? `${summary.earned} of ${summary.total} unlocked · Keep journaling to earn more.`
            : "Track consistency milestones as you journal."
        }
      />

      {newlyEarned.length > 0 ? (
        <Card
          style={{
            ...styles.newCard,
            borderColor: colors.primary,
          }}
        >
          <Text style={[styles.newTitle, { color: colors.primary }]}>
            Newly earned
          </Text>
          {newlyEarned.map((item) => (
            <Text key={item.id} style={{ color: colors.text }}>
              {item.title || item.id}
            </Text>
          ))}
        </Card>
      ) : null}

      <View style={styles.filters}>
        {(["all", "earned", "in_progress"] as ProgressFilter[]).map((id) => (
          <Chip
            key={id}
            label={id === "in_progress" ? "In progress" : titleCase(id)}
            selected={progressFilter === id}
            onPress={() => setProgressFilter(id)}
          />
        ))}
      </View>

      <View style={styles.filters}>
        {(Object.keys(CATEGORY_LABELS) as Array<AchievementCategory | "all">).map(
          (id) => (
            <Chip
              key={id}
              label={CATEGORY_LABELS[id]}
              selected={category === id}
              onPress={() => setCategory(id)}
            />
          ),
        )}
      </View>

      <SectionHeader title="Badges" />

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching achievements"
          description="Try another filter or keep journaling to unlock more."
        />
      ) : (
        <View style={[styles.list, isTablet && styles.listWide]}>
          {filtered.map((item) => {
            const percent = progressPercent(item);
            const tierColor = TIER_COLORS[item.tier] || colors.primary;

            return (
              <Card
                key={item.id}
                style={isTablet ? styles.cardWide : undefined}
              >
                <View style={styles.row}>
                  <View
                    style={[
                      styles.badge,
                      {
                        borderColor: tierColor,
                        backgroundColor: colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text style={{ color: tierColor, fontWeight: "800" }}>
                      {item.icon || item.tier[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {titleCase(item.tier)} · {CATEGORY_LABELS[item.category]}
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.track,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${percent}%`,
                        backgroundColor:
                          item.state === "earned" ? colors.success : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={{ color: colors.textMuted, marginTop: spacing.xs }}>
                  {item.state === "earned"
                    ? `Earned ${formatDate(item.earnedAt || undefined)}`
                    : `${percent}% · ${item.criteriaLabel}`}
                </Text>

                {item.state === "earned" ? (
                  <Pressable
                    onPress={() => void onToggleFeatured(item)}
                    disabled={!!featuringId}
                    style={styles.featureBtn}
                  >
                    <Text
                      style={{
                        color: item.featured ? colors.warning : colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      {featuringId === item.id
                        ? "Updating…"
                        : item.featured
                          ? "Featured on profile"
                          : "Feature on profile"}
                    </Text>
                  </Pressable>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  newCard: {
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  newTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  featureBtn: {
    marginTop: spacing.md,
    minHeight: 40,
    justifyContent: "center",
  },
});
