import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import { useAppTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const hasCheckedAuth = useAuthStore((s) => s.hasCheckedAuth);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateTheme();
    void fetchCurrentUser();
  }, [fetchCurrentUser, hydrateTheme]);

  useEffect(() => {
    if (hasCheckedAuth) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hasCheckedAuth]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="journal/[id]"
          options={{ headerShown: true, title: "Journal", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="journal/add-trade"
          options={{
            headerShown: true,
            title: "Add Trade",
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="accounts/index"
          options={{ headerShown: true, title: "Accounts", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="accounts/create"
          options={{
            headerShown: true,
            title: "New Account",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="brokers/index"
          options={{ headerShown: true, title: "Brokers", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="achievements/index"
          options={{
            headerShown: true,
            title: "Achievements",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ headerShown: true, title: "Settings", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="goals/index"
          options={{ headerShown: true, title: "Goals", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="subscription/index"
          options={{
            headerShown: true,
            title: "Subscription",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="help/index"
          options={{ headerShown: true, title: "Help", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="export/index"
          options={{ headerShown: true, title: "Export", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="insights/index"
          options={{ headerShown: true, title: "Insights", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="referrals/index"
          options={{ headerShown: true, title: "Referrals", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="tutorials/index"
          options={{ headerShown: true, title: "Tutorials", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="charts/index"
          options={{ headerShown: true, title: "Charts", animation: "slide_from_right" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
