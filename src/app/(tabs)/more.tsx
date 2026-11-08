import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Avatar, Card, PageHeader, Screen } from "@/components/ui";
import { titleCase } from "@/lib/format";
import { useLayout } from "@/lib/layout";
import { useAuthStore } from "@/stores/auth.store";
import { spacing, typography, useAppTheme } from "@/theme";

type Row = {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

type Section = {
  title: string;
  rows: Row[];
};

export default function MoreScreen() {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void logout().then(() => router.replace("/(auth)/login"));
        },
      },
    ]);
  };

  const sections: Section[] = [
    {
      title: "Trading",
      rows: [
        {
          label: "Accounts",
          description: "Manual trading accounts",
          icon: "wallet-outline",
          onPress: () => router.push("/accounts"),
        },
        {
          label: "Broker Connections",
          description: "MT5 pairing, cTrader, live positions",
          icon: "link-outline",
          onPress: () => router.push("/brokers/index"),
        },
        {
          label: "Goals",
          description: "Process and performance targets",
          icon: "flag-outline",
          onPress: () => router.push("/goals"),
        },
        {
          label: "Charts",
          description: "Open TradingView workspace",
          icon: "analytics-outline",
          onPress: () => router.push("/charts/index"),
        },
        {
          label: "Export",
          description: "JSON and CSV journal share",
          icon: "download-outline",
          onPress: () => router.push("/export/index"),
        },
      ],
    },
    {
      title: "Growth",
      rows: [
        {
          label: "Insights",
          description: "Discipline and behaviour review",
          icon: "pulse-outline",
          onPress: () => router.push("/insights/index"),
        },
        {
          label: "Achievements",
          description: "Badges and milestones",
          icon: "trophy-outline",
          onPress: () => router.push("/achievements/index"),
        },
        {
          label: "Referrals",
          description: "Invite traders with your code",
          icon: "gift-outline",
          onPress: () => router.push("/referrals/index"),
        },
        {
          label: "Subscription",
          description: "Plan, billing, and upgrades",
          icon: "diamond-outline",
          onPress: () => router.push("/subscription"),
        },
      ],
    },
    {
      title: "Preferences",
      rows: [
        {
          label: "Settings",
          description: "Profile, theme, reminders",
          icon: "settings-outline",
          onPress: () => router.push("/settings"),
        },
        {
          label: "Tutorials",
          description: "cTrader and setup walkthroughs",
          icon: "play-circle-outline",
          onPress: () => router.push("/tutorials/index"),
        },
        {
          label: "Help Center",
          description: "Guides and FAQs",
          icon: "help-circle-outline",
          onPress: () => router.push("/help"),
        },
        {
          label: "Sign out",
          icon: "log-out-outline",
          onPress: onLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <Screen scroll>
      <PageHeader
        eyebrow="Menu"
        title="More"
        description="Accounts, growth tools, and preferences."
      />

      <Card style={styles.profile}>
        <Avatar name={user?.fullName} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.fullName || "Trader"}
          </Text>
          <Text style={{ color: colors.textSecondary }}>{user?.email}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            {titleCase(user?.subscription?.plan || "free")} ·{" "}
            {(user?.subscription?.status || "free").replaceAll("-", " ")}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </Pressable>
      </Card>

      <View style={[styles.sections, isTablet && styles.sectionsWide]}>
        {sections.map((section) => (
          <View
            key={section.title}
            style={[styles.section, isTablet && styles.sectionWide]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {section.title}
            </Text>
            <View style={styles.list}>
              {section.rows.map((row) => (
                <Pressable key={row.label} onPress={row.onPress}>
                  <Card>
                    <View style={styles.row}>
                      <View style={styles.rowLeft}>
                        <View
                          style={[
                            styles.iconWrap,
                            {
                              backgroundColor: row.danger
                                ? "rgba(239,68,68,0.12)"
                                : colors.primarySoft,
                            },
                          ]}
                        >
                          <Ionicons
                            name={row.icon}
                            size={18}
                            color={row.danger ? colors.danger : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: row.danger ? colors.danger : colors.text,
                              fontWeight: "600",
                            }}
                          >
                            {row.label}
                          </Text>
                          {row.description ? (
                            <Text style={{ color: colors.textSecondary }}>
                              {row.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {!row.danger ? (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textMuted}
                        />
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.subtitle,
  },
  sections: {
    gap: spacing.lg,
  },
  sectionsWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionWide: {
    width: "48%",
    flexGrow: 1,
    marginBottom: 0,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
    gap: spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
