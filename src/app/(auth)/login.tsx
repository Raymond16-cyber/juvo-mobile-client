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

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    clearError();
    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!response.user.onboarding?.completed) {
        router.replace("/(onboarding)");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      // error shown from store
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
            title="Welcome back"
            description="Sign in to continue journaling your edge."
          />
        </View>

        <View style={styles.form}>
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
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
          />

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <Button title="Sign in" onPress={onSubmit} loading={isLoading} />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles.linkWrap}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>New to JUVO?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={[styles.link, { color: colors.primary }]}>
                Create account
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
  linkWrap: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
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
  },
});
