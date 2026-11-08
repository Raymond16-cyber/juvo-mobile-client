import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import { Button, PageHeader, Screen, TextField } from "@/components/ui";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import { spacing, useAppTheme } from "@/theme";

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const message = useAuthStore((s) => s.message);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    clearError();
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // store error
    }
  };

  return (
    <Screen scroll includeBottomInset centered={!isTablet}>
      <View style={[styles.shell, isTablet && styles.shellWide]}>
        <PageHeader
          eyebrow="Account"
          title="Reset password"
          description="Enter your email and we will send reset instructions."
        />

        <View style={styles.form}>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
          />

          {error ? (
            <Text style={{ color: colors.danger }}>{error}</Text>
          ) : null}
          {sent || message ? (
            <Text style={{ color: colors.success }}>
              {message || "Check your email for next steps."}
            </Text>
          ) : null}

          <Button
            title="Send reset link"
            onPress={onSubmit}
            loading={isLoading}
          />
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.back}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Back to sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    gap: spacing.xl,
  },
  shellWide: {
    alignSelf: "center",
    maxWidth: 440,
  },
  form: {
    gap: spacing.lg,
  },
  back: {
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
