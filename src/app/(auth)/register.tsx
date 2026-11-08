import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";

import { Button, PageHeader, Screen, TextField } from "@/components/ui";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import { spacing, typography, useAppTheme } from "@/theme";

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    clearError();
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace("/(onboarding)");
    } catch {
      // store error
    }
  };

  return (
    <Screen scroll includeBottomInset centered={!isTablet}>
      <View style={[styles.shell, isTablet && styles.shellWide]}>
        <View style={styles.brand}>
          <Image
            source={require("../../../assets/logos/applogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <PageHeader
            eyebrow="JUVO"
            title="Create your account"
            description="Build discipline with a trading journal made for mobile."
          />
        </View>

        <View style={styles.form}>
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Alex Trader"
            autoComplete="name"
          />
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
          />
          <TextField
            label="Password"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
          />

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <Button title="Create account" onPress={onSubmit} loading={isLoading} />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[styles.link, { color: colors.primary }]}>
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
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
  brand: {
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    ...typography.caption,
  },
  link: {
    ...typography.bodyMedium,
    fontWeight: "600",
  },
  footer: {
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.lg,
    flexWrap: "wrap",
  },
});
