import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  getAiAccessService,
  getAiCheckinService,
  hasAiFeature,
  updateAiCheckinPreferencesService,
} from "@/api/ai";
import { updatePreferences } from "@/api/auth";
import { exportJournalsJsonService } from "@/api/journals";
import { BrokersPanel } from "@/components/settings/BrokersPanel";
import {
  Avatar,
  Button,
  Card,
  Chip,
  PageHeader,
  Screen,
  TextField,
} from "@/components/ui";
import {
  CHALLENGES,
  COUNTRY_OPTIONS,
  CURRENCIES,
  EXPERIENCE_LEVELS,
  INSTRUMENTS,
  THEMES,
  TRADING_STYLES,
  WEEK_START_OPTIONS,
} from "@/constants/onboarding";
import { getApiErrorMessage } from "@/lib/errors";
import { titleCase } from "@/lib/format";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import {
  ThemePreference,
  useThemeStore,
} from "@/stores/theme.store";
import type { AiAccess } from "@/types/ai";
import type { UpdatePreferencesPayload } from "@/types/auth";
import { spacing, typography, useAppTheme } from "@/theme";

type SettingsSectionId =
  | "profile"
  | "trading"
  | "appearance"
  | "rhythm"
  | "account"
  | "brokers"
  | "data";

const SECTIONS: Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
}> = [
  {
    id: "profile",
    label: "Profile",
    description: "Identity and currency",
  },
  {
    id: "trading",
    label: "Trading",
    description: "Style and markets",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme",
  },
  {
    id: "rhythm",
    label: "Rhythm",
    description: "Reminders",
  },
  {
    id: "account",
    label: "Account",
    description: "Plan and AI",
  },
  {
    id: "brokers",
    label: "Brokers",
    description: "MT5 and cTrader",
  },
  {
    id: "data",
    label: "Data",
    description: "Export and links",
  },
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const user = useAuthStore((s) => s.user);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const themePreference = useThemeStore((s) => s.preference);

  const [section, setSection] = useState<SettingsSectionId>("profile");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [country, setCountry] = useState(user?.profile?.country || "");
  const [timezone, setTimezone] = useState(
    user?.profile?.timezone || detectTimezone(),
  );
  const [experienceLevel, setExperienceLevel] = useState(
    user?.profile?.experienceLevel || "beginner",
  );
  const [tradingStyle, setTradingStyle] = useState(
    user?.profile?.tradingStyle || "day_trading",
  );
  const [instruments, setInstruments] = useState<string[]>(
    user?.profile?.instruments || [],
  );
  const [biggestChallenges, setBiggestChallenges] = useState<string[]>(
    user?.profile?.biggestChallenges || [],
  );
  const [currency, setCurrency] = useState(
    user?.preferences?.preferredCurrency || "USD",
  );
  const [reportingCurrency, setReportingCurrency] = useState(
    user?.preferences?.reportingCurrency ||
      user?.preferences?.preferredCurrency ||
      "USD",
  );
  const [weekStartsOn, setWeekStartsOn] = useState<"sunday" | "monday">(
    user?.preferences?.weekStartsOn || "monday",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications?.enabled ?? true,
  );
  const [reminderTime, setReminderTime] = useState(
    user?.preferences?.notifications?.reminderTime || "08:00",
  );
  const [theme, setTheme] = useState<ThemePreference>(
    user?.preferences?.theme || themePreference || "system",
  );
  const [aiAccess, setAiAccess] = useState<AiAccess | null>(null);
  const [aiCheckinsEnabled, setAiCheckinsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCurrentUser().catch(() => undefined);
    getAiAccessService()
      .then((response) => setAiAccess(response.data))
      .catch(() => undefined);
    getAiCheckinService({ preferencesOnly: true })
      .then((response) => {
        setAiCheckinsEnabled(Boolean(response.data?.enabled));
      })
      .catch(() => undefined);
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setCountry(user.profile?.country || "");
    setTimezone(user.profile?.timezone || detectTimezone());
    setExperienceLevel(user.profile?.experienceLevel || "beginner");
    setTradingStyle(user.profile?.tradingStyle || "day_trading");
    setInstruments(user.profile?.instruments || []);
    setBiggestChallenges(user.profile?.biggestChallenges || []);
    setCurrency(user.preferences?.preferredCurrency || "USD");
    setReportingCurrency(
      user.preferences?.reportingCurrency ||
        user.preferences?.preferredCurrency ||
        "USD",
    );
    setWeekStartsOn(user.preferences?.weekStartsOn || "monday");
    setNotificationsEnabled(user.preferences?.notifications?.enabled ?? true);
    setReminderTime(user.preferences?.notifications?.reminderTime || "08:00");
    if (user.preferences?.theme) {
      setTheme(user.preferences.theme);
      void setThemePreference(user.preferences.theme);
    }
    setDirty(false);
  }, [setThemePreference, user]);

  const markDirty = () => {
    setDirty(true);
    setMessage(null);
    setError(null);
  };

  const completeness = useMemo(() => {
    const checks = [
      fullName,
      country,
      timezone,
      experienceLevel,
      tradingStyle,
      instruments.length,
      biggestChallenges.length,
      currency,
      reportingCurrency,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    biggestChallenges.length,
    country,
    currency,
    experienceLevel,
    fullName,
    instruments.length,
    reportingCurrency,
    timezone,
    tradingStyle,
  ]);

  const toggleInstrument = (value: string) => {
    markDirty();
    setInstruments((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleChallenge = (value: string) => {
    markDirty();
    setBiggestChallenges((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: UpdatePreferencesPayload = {
        fullName: fullName.trim() || undefined,
        country: country.trim() || undefined,
        timezone: timezone.trim() || undefined,
        experienceLevel,
        tradingStyle,
        instruments,
        biggestChallenges,
        preferredCurrency: currency,
        reportingCurrency,
        weekStartsOn,
        notificationsEnabled,
        reminderTime,
        theme,
      };
      await updatePreferences(payload);
      await setThemePreference(theme);
      await fetchCurrentUser();
      setDirty(false);
      setMessage("Settings saved.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  };

  const onToggleAiCheckins = async (enabled: boolean) => {
    setAiSaving(true);
    setError(null);
    try {
      await updateAiCheckinPreferencesService({ enabled });
      setAiCheckinsEnabled(enabled);
      setMessage(
        enabled
          ? "AI check-ins enabled."
          : "AI check-ins turned off.",
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update AI check-ins."));
    } finally {
      setAiSaving(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const payload = await exportJournalsJsonService();
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: "JUVO journal export",
      });
      setMessage("Journal export shared.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Export failed. Pro may be required."));
    } finally {
      setExporting(false);
    }
  };

  const plan = user?.subscription?.plan || "free";
  const planStatus = user?.subscription?.status || "free";
  const canUseCheckins = hasAiFeature(aiAccess, "checkins");

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Settings" }} />

      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Tune your profile, trading identity, theme, reminders, and broker links."
        action={
          <Button
            title={saving ? "Saving…" : dirty ? "Save" : "Saved"}
            variant="ghost"
            fullWidth={false}
            size="sm"
            disabled={saving || !dirty}
            onPress={() => void onSave()}
          />
        }
      />

      <Card style={styles.hero}>
        <View style={[styles.heroTop, isTablet && styles.heroTopWide]}>
          <Avatar name={fullName || user?.fullName} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.heroName, { color: colors.text }]}>
              {fullName || user?.fullName || "JUVO Trader"}
            </Text>
            <Text style={{ color: colors.textSecondary }}>{user?.email}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              {titleCase(plan)} · {planStatus.replaceAll("-", " ")}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <Stat
            label="Streak"
            value={String(user?.stats?.currentJournalStreak || 0)}
            colors={colors}
          />
          <Stat
            label="Journals"
            value={String(user?.stats?.totalJournals || 0)}
            colors={colors}
          />
          <Stat
            label="Trades"
            value={String(user?.stats?.totalTrades || 0)}
            colors={colors}
          />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.rowBetween}>
            <Text style={{ color: colors.textSecondary }}>Profile strength</Text>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {completeness}%
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                { width: `${completeness}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
      </Card>

      {dirty ? (
        <Text style={[styles.banner, { color: colors.warning }]}>
          Unsaved changes
        </Text>
      ) : null}
      {message ? (
        <Text style={[styles.banner, { color: colors.success }]}>{message}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.banner, { color: colors.danger }]}>{error}</Text>
      ) : null}

      <View style={[styles.tabs, isTablet && styles.tabsWide]}>
        {SECTIONS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={section === item.id}
            onPress={() => setSection(item.id)}
          />
        ))}
      </View>

      {section === "profile" ? (
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Profile</Text>
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={(value) => {
              markDirty();
              setFullName(value);
            }}
          />
          <Text style={{ color: colors.textSecondary }}>{user?.email}</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Country
          </Text>
          <View style={styles.chips}>
            {COUNTRY_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={country === item}
                onPress={() => {
                  markDirty();
                  setCountry(item);
                }}
              />
            ))}
          </View>

          <TextField
            label="Timezone"
            value={timezone}
            onChangeText={(value) => {
              markDirty();
              setTimezone(value);
            }}
            placeholder="Africa/Lagos"
          />
          <Button
            title="Use device timezone"
            variant="ghost"
            onPress={() => {
              markDirty();
              setTimezone(detectTimezone());
            }}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Preferred currency
          </Text>
          <View style={styles.chips}>
            {CURRENCIES.map((item) => (
              <Chip
                key={item.value}
                label={item.value}
                selected={currency === item.value}
                onPress={() => {
                  markDirty();
                  setCurrency(item.value);
                }}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Reporting currency
          </Text>
          <View style={styles.chips}>
            {CURRENCIES.map((item) => (
              <Chip
                key={`report-${item.value}`}
                label={item.value}
                selected={reportingCurrency === item.value}
                onPress={() => {
                  markDirty();
                  setReportingCurrency(item.value);
                }}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {section === "trading" ? (
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Trading identity
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Experience
          </Text>
          <View style={styles.chips}>
            {EXPERIENCE_LEVELS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={experienceLevel === item.value}
                onPress={() => {
                  markDirty();
                  setExperienceLevel(
                    item.value as
                      | "beginner"
                      | "intermediate"
                      | "advanced"
                      | "professional",
                  );
                }}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Trading style
          </Text>
          <View style={styles.chips}>
            {TRADING_STYLES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={tradingStyle === item.value}
                onPress={() => {
                  markDirty();
                  setTradingStyle(
                    item.value as
                      | "scalping"
                      | "day_trading"
                      | "swing_trading"
                      | "position_trading",
                  );
                }}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Instruments
          </Text>
          <View style={styles.chips}>
            {INSTRUMENTS.map((item) => (
              <Chip
                key={item}
                label={labelize(item)}
                selected={instruments.includes(item)}
                onPress={() => toggleInstrument(item)}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Biggest challenges
          </Text>
          <View style={styles.chips}>
            {CHALLENGES.map((item) => (
              <Chip
                key={item}
                label={labelize(item)}
                selected={biggestChallenges.includes(item)}
                onPress={() => toggleChallenge(item)}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {section === "appearance" ? (
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Appearance
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            Choose how JUVO looks on this device.
          </Text>
          <View style={styles.chips}>
            {THEMES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={theme === item.value}
                onPress={() => {
                  markDirty();
                  setTheme(item.value as ThemePreference);
                  void setThemePreference(item.value as ThemePreference);
                }}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {section === "rhythm" ? (
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Review rhythm
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Week starts on
          </Text>
          <View style={styles.chips}>
            {WEEK_START_OPTIONS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={weekStartsOn === item.value}
                onPress={() => {
                  markDirty();
                  setWeekStartsOn(item.value as "sunday" | "monday");
                }}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                Journal reminders
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Keep your review cadence on track.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                markDirty();
                setNotificationsEnabled(value);
              }}
              trackColor={{ true: colors.primary, false: colors.borderStrong }}
            />
          </View>

          <TextField
            label="Reminder time"
            value={reminderTime}
            onChangeText={(value) => {
              markDirty();
              setReminderTime(value);
            }}
            placeholder="08:00"
            editable={notificationsEnabled}
          />
        </Card>
      ) : null}

      {section === "account" ? (
        <View style={styles.stack}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Account & plan
            </Text>
            <InfoRow label="Plan" value={titleCase(plan)} colors={colors} />
            <InfoRow
              label="Status"
              value={planStatus.replaceAll("-", " ")}
              colors={colors}
            />
            <InfoRow
              label="AI trial"
              value={user?.entitlements?.aiTrial?.status || "available"}
              colors={colors}
            />
            <Button
              title="Manage subscription"
              variant="secondary"
              onPress={() => router.push("/subscription")}
              style={{ marginTop: spacing.sm }}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              JUVO AI
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {aiAccess?.hasAccess
                ? "AI chat is available on your plan."
                : "Upgrade or start a trial to unlock JUVO AI chat."}
            </Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Contextual check-ins
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {canUseCheckins
                    ? "Occasional coaching nudges based on your journal."
                    : "Available on Super or when check-ins are entitled."}
                </Text>
              </View>
              <Switch
                value={aiCheckinsEnabled}
                disabled={!canUseCheckins || aiSaving}
                onValueChange={(value) => void onToggleAiCheckins(value)}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
              />
            </View>
            <Button
              title="Open JUVO AI"
              variant="ghost"
              onPress={() => router.push("/(tabs)/ai")}
            />
          </Card>
        </View>
      ) : null}

      {section === "brokers" ? <BrokersPanel /> : null}

      {section === "data" ? (
        <View style={styles.stack}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Data & links
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
              Export journals or jump to related account screens.
            </Text>
            <Button
              title="Export journals (JSON)"
              loading={exporting}
              onPress={() => void onExport()}
            />
            <LinkRow
              icon="link-outline"
              label="Broker connections"
              onPress={() => setSection("brokers")}
              colors={colors}
            />
            <LinkRow
              icon="wallet-outline"
              label="Trading accounts"
              onPress={() => router.push("/accounts")}
              colors={colors}
            />
            <LinkRow
              icon="trophy-outline"
              label="Achievements"
              onPress={() => router.push("/achievements/index")}
              colors={colors}
            />
            <LinkRow
              icon="flag-outline"
              label="Goals"
              onPress={() => router.push("/goals")}
              colors={colors}
            />
            <LinkRow
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => router.push("/help")}
              colors={colors}
            />
          </Card>
        </View>
      ) : null}

      {section !== "brokers" ? (
        <Button
          title={saving ? "Saving…" : dirty ? "Save settings" : "Saved"}
          onPress={() => void onSave()}
          loading={saving}
          disabled={!dirty}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textMuted: string };
}) {
  return (
    <View style={styles.stat}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string };
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: { text: string; primary: string; textMuted: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.linkRow, { borderTopColor: colors.border }]}
    >
      <View style={styles.linkLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  heroTopWide: {
    alignItems: "flex-start",
  },
  heroName: {
    ...typography.subtitle,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    gap: 2,
    minWidth: 72,
  },
  progressWrap: {
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  banner: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabsWide: {
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  label: {
    ...typography.label,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 36,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
