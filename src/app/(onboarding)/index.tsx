import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { saveOnboarding } from "@/api/onboarding";
import { Button, Chip, PageHeader, Screen, TextField } from "@/components/ui";
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
import { spacing, typography, useAppTheme } from "@/theme";

const STEPS = [
  "Location",
  "Experience",
  "Instruments",
  "Challenges",
  "Preferences",
  "Notifications",
] as const;

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [country, setCountry] = useState("Nigeria");
  const [customCountry, setCustomCountry] = useState("");
  const [timezone] = useState(deviceTimezone());
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [tradingStyle, setTradingStyle] = useState("day_trading");
  const [instruments, setInstruments] = useState<string[]>(["forex"]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [theme, setTheme] = useState("dark");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [weekStartsOn, setWeekStartsOn] = useState("monday");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step],
  );

  const toggleList = (
    value: string,
    list: string[],
    setList: (next: string[]) => void,
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  };

  const resolvedCountry =
    country === "Other" ? customCountry.trim() : country.trim();

  const canContinue = () => {
    if (step === 0) return Boolean(resolvedCountry);
    if (step === 1) return Boolean(experienceLevel && tradingStyle);
    if (step === 2) return instruments.length > 0;
    if (step === 3) return challenges.length > 0;
    if (step === 4) return Boolean(theme && preferredCurrency && weekStartsOn);
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await saveOnboarding({
        country: resolvedCountry,
        timezone,
        experienceLevel,
        tradingStyle,
        instruments,
        biggestChallenges: challenges,
        theme,
        preferredCurrency,
        weekStartsOn,
        notificationsEnabled,
        reminderTime,
        pushToken: "",
        currentStep: STEPS.length,
      });
      await fetchCurrentUser();
      router.replace("/(tabs)");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save onboarding."));
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    void submit();
  };

  return (
    <Screen scroll includeBottomInset>
      <View style={[styles.shell, isTablet && styles.shellWide]}>
      <PageHeader
        eyebrow={`Step ${step + 1} of ${STEPS.length}`}
        title={STEPS[step]}
        description="A few preferences so JUVO can tailor journaling and coaching."
      />

      <View
        style={[styles.progressTrack, { backgroundColor: colors.border }]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      {step === 0 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Where do you trade from?
          </Text>
          <View style={styles.chips}>
            {COUNTRY_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={country === item}
                onPress={() => setCountry(item)}
              />
            ))}
          </View>
          {country === "Other" ? (
            <TextField
              label="Country"
              value={customCountry}
              onChangeText={setCustomCountry}
              placeholder="Enter your country"
            />
          ) : null}
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Timezone: {timezone}
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Experience level
          </Text>
          <View style={styles.chips}>
            {EXPERIENCE_LEVELS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={experienceLevel === item.value}
                onPress={() => setExperienceLevel(item.value)}
              />
            ))}
          </View>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Trading style
          </Text>
          <View style={styles.chips}>
            {TRADING_STYLES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={tradingStyle === item.value}
                onPress={() => setTradingStyle(item.value)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Which markets do you trade?
          </Text>
          <View style={styles.chips}>
            {INSTRUMENTS.map((item) => (
              <Chip
                key={item}
                label={titleCase(item)}
                selected={instruments.includes(item)}
                onPress={() =>
                  toggleList(item, instruments, setInstruments)
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Biggest challenges right now
          </Text>
          <View style={styles.chips}>
            {CHALLENGES.map((item) => (
              <Chip
                key={item}
                label={titleCase(item)}
                selected={challenges.includes(item)}
                onPress={() => toggleList(item, challenges, setChallenges)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Theme
          </Text>
          <View style={styles.chips}>
            {THEMES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={theme === item.value}
                onPress={() => setTheme(item.value)}
              />
            ))}
          </View>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Preferred currency
          </Text>
          <View style={styles.chips}>
            {CURRENCIES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={preferredCurrency === item.value}
                onPress={() => setPreferredCurrency(item.value)}
              />
            ))}
          </View>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Week starts on
          </Text>
          <View style={styles.chips}>
            {WEEK_START_OPTIONS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={weekStartsOn === item.value}
                onPress={() => setWeekStartsOn(item.value)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.section}>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Daily reminders help build the journaling habit.
          </Text>
          <View style={styles.chips}>
            <Chip
              label="Enabled"
              selected={notificationsEnabled}
              onPress={() => setNotificationsEnabled(true)}
            />
            <Chip
              label="Disabled"
              selected={!notificationsEnabled}
              onPress={() => setNotificationsEnabled(false)}
            />
          </View>
          <TextField
            label="Reminder time (HH:mm)"
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="09:00"
          />
        </View>
      ) : null}

      {error ? (
        <Text style={{ color: colors.danger, marginBottom: spacing.md }}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button
            title="Back"
            variant="secondary"
            onPress={() => setStep((s) => s - 1)}
            fullWidth={false}
            style={styles.back}
          />
        ) : (
          <View style={styles.back} />
        )}
        <Button
          title={step === STEPS.length - 1 ? "Finish" : "Continue"}
          onPress={onNext}
          loading={submitting}
          disabled={!canContinue()}
          style={styles.next}
        />
      </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
  },
  shellWide: {
    alignSelf: "center",
    maxWidth: 640,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.xxl,
  },
  progressFill: {
    height: "100%",
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  help: {
    ...typography.body,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  back: {
    width: 110,
  },
  next: {
    flex: 1,
  },
});
