import { Linking, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, PageHeader, Screen } from "@/components/ui";
import { spacing, typography, useAppTheme } from "@/theme";

const TUTORIALS = [
  {
    title: "How to Connect Your cTrader Account to JUVO",
    description: "Pair cTrader so live trades sync into your journal.",
    url: "https://youtu.be/2Wh36UKXT_s",
  },
];

export default function TutorialsScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen scroll includeBottomInset>
      <Stack.Screen options={{ title: "Tutorials" }} />
      <PageHeader
        eyebrow="Help Center"
        title="JUVO Tutorials"
        description="Guided walkthroughs for connecting accounts and getting more from JUVO."
      />

      <View style={styles.list}>
        {TUTORIALS.map((tutorial) => (
          <Card key={tutorial.url} style={styles.card}>
            <View
              style={[styles.icon, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons
                name="play-circle-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {tutorial.title}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {tutorial.description}
            </Text>
            <Button
              title="Watch on YouTube"
              variant="secondary"
              onPress={() => void Linking.openURL(tutorial.url)}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
});
