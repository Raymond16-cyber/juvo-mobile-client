import { useEffect } from "react";
import { Redirect } from "expo-router";

import { LoadingState } from "@/components/ui";
import { Screen } from "@/components/ui/Screen";
import { useAuthStore } from "@/stores/auth.store";

export default function IndexGate() {
  const hasCheckedAuth = useAuthStore((s) => s.hasCheckedAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  useEffect(() => {
    if (!hasCheckedAuth) {
      void fetchCurrentUser();
    }
  }, [hasCheckedAuth, fetchCurrentUser]);

  if (!hasCheckedAuth) {
    return (
      <Screen>
        <LoadingState label="Starting JUVO…" />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user?.onboarding?.completed) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
