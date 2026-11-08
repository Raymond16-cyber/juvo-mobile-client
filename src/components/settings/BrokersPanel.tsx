import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  createMetaTraderPairingCodeService,
  disconnectCTraderService,
  getBrokerConnectionsService,
  getBrokerPositionsService,
  getCTraderConnectUrlService,
  getMetaTraderStatusService,
  manageMetaTraderConnectionService,
  syncCTraderService,
} from "@/api/broker";
import { Button, Card, LoadingState } from "@/components/ui";
import { brokerStatusColor, brokerStatusCopy } from "@/lib/broker-status";
import { formatDate } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { BrokerConnection } from "@/types/broker";
import { radius, spacing, typography, useAppTheme } from "@/theme";

type BrokersPanelProps = {
  compact?: boolean;
};

export function BrokersPanel({ compact = false }: BrokersPanelProps) {
  const { colors } = useAppTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [openPositions, setOpenPositions] = useState(0);
  const [mtEnabled, setMtEnabled] = useState<boolean | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [pair, setPair] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [showPairing, setShowPairing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [connectionsRes, positionsRes, mtStatus] = await Promise.all([
        getBrokerConnectionsService(),
        getBrokerPositionsService("open").catch(() => ({ data: [] })),
        getMetaTraderStatusService().catch(() => null),
      ]);
      setConnections(connectionsRes.data || []);
      setOpenPositions(positionsRes.data?.length || 0);
      if (mtStatus) {
        setMtEnabled(mtStatus.enabled);
        setApiUrl(mtStatus.url || "");
      } else {
        setMtEnabled(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load broker connections."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pair) return;
    const ms = Math.max(0, new Date(pair.expiresAt).getTime() - Date.now());
    const timer = setTimeout(() => setPair(null), ms);
    return () => clearTimeout(timer);
  }, [pair]);

  const meta = useMemo(
    () => connections.filter((item) => item.provider === "metatrader"),
    [connections],
  );
  const ctrader = useMemo(
    () => connections.filter((item) => item.provider === "ctrader"),
    [connections],
  );
  const connectedCount = connections.filter(
    (item) => item.status === "connected",
  ).length;
  const attentionCount = connections.filter((item) =>
    ["error", "reauthorization_required", "stale", "offline"].includes(
      item.status,
    ),
  ).length;
  const connectedCTrader = ctrader.some((item) => item.status === "connected");
  const needsReauth = ctrader.some(
    (item) => item.status === "reauthorization_required",
  );

  const run = async (key: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to complete this request."));
    } finally {
      setBusy(null);
    }
  };

  const onGeneratePairing = () =>
    void run("pair", async () => {
      const result = await createMetaTraderPairingCodeService();
      setPair({ code: result.code, expiresAt: result.expiresAt });
      setApiUrl(result.apiUrl);
      setShowPairing(true);
      setNotice("Pairing code ready. Enter it in the JUVO Connector EA.");
    });

  const onSharePairing = async () => {
    if (!pair) return;
    await Share.share({
      message: `JUVO MT5 pairing\nCode: ${pair.code}\nApiUrl: ${apiUrl}`,
    });
  };

  const onConnectCTrader = () =>
    void run("ctrader", async () => {
      const result = await getCTraderConnectUrlService();
      await Linking.openURL(result.authorizationUrl);
      setNotice("Finish connecting in the browser, then return here.");
    });

  const onManage = (
    connection: BrokerConnection,
    action: "sync" | "disconnect",
  ) => {
    const isMt = connection.provider === "metatrader";

    if (action === "disconnect") {
      Alert.alert(
        isMt ? "Disconnect MT5" : "Disconnect cTrader",
        isMt
          ? "This revokes the connector credential. Saved trades stay."
          : "Stop syncing this cTrader account with JUVO?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: () =>
              void run(connection.id, async () => {
                if (isMt) {
                  await manageMetaTraderConnectionService(
                    connection.id,
                    "disconnect",
                  );
                } else {
                  await disconnectCTraderService(connection.id);
                }
                await load();
                setNotice(
                  isMt
                    ? "MT5 account disconnected."
                    : "cTrader account disconnected.",
                );
              }),
          },
        ],
      );
      return;
    }

    void run(connection.id, async () => {
      if (isMt) {
        await manageMetaTraderConnectionService(connection.id, "sync");
        setNotice("MT5 sync requested.");
      } else {
        await syncCTraderService(connection.id);
        setNotice("cTrader sync completed.");
      }
      await load();
    });
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <LoadingState label="Loading brokers…" />
      </Card>
    );
  }

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View
            style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              Broker connections
            </Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
              {connectedCTrader || connectedCount > 0
                ? "Read-only sync is active for journaling and analytics."
                : needsReauth
                  ? "cTrader needs reconnecting before sync can continue."
                  : "Connect MetaTrader or cTrader for synced fills."}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, isTablet && styles.statsRowWide]}>
          <Stat
            label="Live"
            value={`${connectedCount}/${connections.length}`}
            colors={colors}
            tone={connectedCount > 0 ? "positive" : "neutral"}
          />
          <Stat
            label="Open"
            value={String(openPositions)}
            colors={colors}
            tone={openPositions > 0 ? "positive" : "neutral"}
          />
          <Stat
            label="Attention"
            value={String(attentionCount)}
            colors={colors}
            tone={attentionCount > 0 ? "negative" : "neutral"}
          />
        </View>

        {error ? (
          <Text style={[styles.banner, { color: colors.danger }]}>{error}</Text>
        ) : null}
        {notice ? (
          <Text style={[styles.banner, { color: colors.primary }]}>
            {notice}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={pair ? "Replace MT5 code" : "Pair MetaTrader 5"}
            loading={busy === "pair"}
            disabled={!!busy || mtEnabled === false}
            onPress={onGeneratePairing}
          />
          <Button
            title={
              needsReauth
                ? "Reconnect cTrader"
                : connectedCTrader
                  ? "Reconnect cTrader"
                  : "Connect cTrader"
            }
            variant="secondary"
            loading={busy === "ctrader"}
            disabled={!!busy}
            onPress={onConnectCTrader}
          />
        </View>

        {mtEnabled === false ? (
          <Text style={{ color: colors.warning, lineHeight: 20 }}>
            MT5 connector is not configured on this server yet.
          </Text>
        ) : null}
      </Card>

      {(showPairing || pair) && mtEnabled ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            MT5 pairing
          </Text>
          {apiUrl ? (
            <View style={styles.copyBlock}>
              <Text style={[styles.miniLabel, { color: colors.textMuted }]}>
                ApiUrl
              </Text>
              <Text selectable style={{ color: colors.text }}>
                {apiUrl}
              </Text>
            </View>
          ) : null}

          {pair ? (
            <View
              style={[
                styles.pairBox,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.input,
                },
              ]}
            >
              <Text style={[styles.miniLabel, { color: colors.textMuted }]}>
                Pairing code
              </Text>
              <Text
                selectable
                style={[styles.pairCode, { color: colors.text }]}
              >
                {pair.code}
              </Text>
              <Text style={{ color: colors.textMuted }}>
                Expires{" "}
                {formatDate(pair.expiresAt, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Button
                title="Share code + ApiUrl"
                variant="secondary"
                onPress={() => void onSharePairing()}
              />
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary }}>
              Generate a code, then paste it into the JUVO Connector EA on your
              desktop MT5 terminal.
            </Text>
          )}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Connected accounts
        </Text>

        {connections.length === 0 ? (
          <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
            No brokers linked yet. Pair MT5 or connect cTrader above.
          </Text>
        ) : (
          <View style={styles.list}>
            {connections.map((connection) => {
              const isMt = connection.provider === "metatrader";
              return (
                <View
                  key={connection.id}
                  style={[styles.connection, { borderColor: colors.border }]}
                >
                  <View style={styles.connectionTop}>
                    <Ionicons
                      name={isMt ? "desktop-outline" : "globe-outline"}
                      size={18}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]}>
                        {connection.brokerName ||
                          (isMt ? "MetaTrader 5" : "cTrader")}
                      </Text>
                      <Text
                        style={{
                          color: brokerStatusColor(connection.status, colors),
                          fontWeight: "700",
                          marginTop: 2,
                        }}
                      >
                        {brokerStatusCopy[connection.status]}
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary, marginTop: 4 }}
                      >
                        {[
                          connection.server,
                          connection.accountNumber,
                          connection.accountCurrency,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                      {connection.lastError?.message ? (
                        <Text style={{ color: colors.warning, marginTop: 6 }}>
                          {connection.lastError.message}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {connection.desiredConnected !== false ? (
                    <View style={styles.connectionActions}>
                      <Button
                        title="Sync"
                        variant="secondary"
                        fullWidth={false}
                        size="sm"
                        loading={busy === connection.id}
                        disabled={!!busy || (isMt && !mtEnabled)}
                        onPress={() => onManage(connection, "sync")}
                        style={styles.smallBtn}
                      />
                      <Button
                        title="Disconnect"
                        variant="ghost"
                        fullWidth={false}
                        size="sm"
                        disabled={!!busy}
                        onPress={() => onManage(connection, "disconnect")}
                        style={styles.smallBtn}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {!compact ? (
          <View style={styles.breakdown}>
            <Text style={{ color: colors.textMuted }}>
              MT5: {meta.length} · cTrader: {ctrader.length} · Open positions:{" "}
              {openPositions}
            </Text>
          </View>
        ) : null}
      </Card>

      <Button
        title="Open full Broker Connections page"
        variant="secondary"
        onPress={() => router.push("/brokers/index")}
      />
      <Button
        title="Manage trading accounts"
        variant="ghost"
        onPress={() => router.push("/accounts")}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  colors,
  tone = "neutral",
}: {
  label: string;
  value: string;
  colors: {
    text: string;
    textMuted: string;
    success: string;
    danger: string;
  };
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? colors.success
      : tone === "negative"
        ? colors.danger
        : colors.text;

  return (
    <View style={styles.stat}>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: valueColor, fontWeight: "700", fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.subtitle,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statsRowWide: {
    gap: spacing.xl,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  banner: {
    ...typography.caption,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
  },
  copyBlock: {
    gap: spacing.xs,
  },
  miniLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pairBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pairCode: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  list: {
    gap: spacing.sm,
  },
  connection: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  connectionTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  connectionActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  smallBtn: {
    minWidth: 110,
    paddingHorizontal: spacing.md,
  },
  breakdown: {
    marginTop: spacing.xs,
  },
});
