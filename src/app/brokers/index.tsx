import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
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
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { brokerStatusColor, brokerStatusCopy } from "@/lib/broker-status";
import { formatDate, formatMoney } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/errors";
import { useLayout } from "@/lib/layout";
import type { BrokerConnection, BrokerPosition } from "@/types/broker";
import { radius, spacing, typography, useAppTheme } from "@/theme";

type BrokerTab = "overview" | "mt5" | "ctrader" | "positions" | "help";

const TABS: Array<{ id: BrokerTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "mt5", label: "MT5" },
  { id: "ctrader", label: "cTrader" },
  { id: "positions", label: "Positions" },
  { id: "help", label: "Help" },
];

function StatusMetric({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn" | "muted";
}) {
  const { colors } = useAppTheme();
  const toneColor =
    tone === "good"
      ? colors.success
      : tone === "bad"
        ? colors.danger
        : tone === "warn"
          ? colors.warning
          : colors.textMuted;

  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <View style={styles.metricTop}>
        <Ionicons name={icon} size={16} color={toneColor} />
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function ConnectionCard({
  connection,
  busy,
  mtEnabled,
  onSync,
  onDisconnect,
}: {
  connection: BrokerConnection;
  busy: string | null;
  mtEnabled?: boolean | null;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const { colors } = useAppTheme();
  const isMt = connection.provider === "metatrader";

  return (
    <Card>
      <View style={styles.row}>
        <View
          style={[styles.providerIcon, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons
            name={isMt ? "desktop-outline" : "globe-outline"}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: colors.text }]}>
            {connection.brokerName || (isMt ? "MetaTrader" : "cTrader")}
            {isMt ? (connection.platform === "mt4" ? " 4" : " 5") : ""}
          </Text>
          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: `${brokerStatusColor(connection.status, colors)}22`,
                },
              ]}
            >
              <Text
                style={{
                  color: brokerStatusColor(connection.status, colors),
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {brokerStatusCopy[connection.status]}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Read-only
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
            {[
              connection.server,
              connection.accountNumber,
              connection.accountCurrency,
              connection.accountType,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {connection.lastHeartbeatAt
              ? `Heartbeat ${formatDate(connection.lastHeartbeatAt, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Awaiting heartbeat"}
            {" · "}
            {connection.lastSyncedAt
              ? `Synced ${formatDate(connection.lastSyncedAt, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Not synced yet"}
          </Text>
          {connection.legacy ? (
            <Text style={{ color: colors.warning, marginTop: 6 }}>
              Legacy connection. Pair again to resume live sync.
            </Text>
          ) : null}
          {connection.lastError?.message ? (
            <Text style={{ color: colors.warning, marginTop: 6 }}>
              {connection.lastError.message}
            </Text>
          ) : null}
        </View>
      </View>

      {connection.desiredConnected !== false ? (
        <View style={styles.actions}>
          <Button
            title="Sync"
            variant="secondary"
            fullWidth={false}
            size="sm"
            loading={busy === connection.id}
            disabled={!!busy || (isMt && !mtEnabled)}
            onPress={onSync}
            style={styles.actionBtn}
          />
          <Button
            title="Disconnect"
            variant="ghost"
            fullWidth={false}
            size="sm"
            disabled={!!busy}
            onPress={onDisconnect}
            style={styles.actionBtn}
          />
        </View>
      ) : null}
    </Card>
  );
}

export default function BrokersScreen() {
  const { colors } = useAppTheme();
  const { isTablet, metricColumns } = useLayout();
  const [tab, setTab] = useState<BrokerTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [positions, setPositions] = useState<BrokerPosition[]>([]);
  const [mtEnabled, setMtEnabled] = useState<boolean | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [pair, setPair] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [connectionsRes, positionsRes, mtStatus] = await Promise.all([
        getBrokerConnectionsService(),
        getBrokerPositionsService("open"),
        getMetaTraderStatusService().catch(() => null),
      ]);
      setConnections(connectionsRes.data || []);
      setPositions(positionsRes.data || []);
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
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => {
        void load(true);
      }, 8000);
      return () => clearInterval(timer);
    }, [load]),
  );

  useEffect(() => {
    if (!pair) return;
    const ms = Math.max(0, new Date(pair.expiresAt).getTime() - Date.now());
    const timer = setTimeout(() => setPair(null), ms);
    return () => clearTimeout(timer);
  }, [pair]);

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

  const meta = useMemo(
    () => connections.filter((item) => item.provider === "metatrader"),
    [connections],
  );
  const ctrader = useMemo(
    () => connections.filter((item) => item.provider === "ctrader"),
    [connections],
  );

  const cTraderConnection =
    ctrader.find((item) => item.status === "connected") ||
    ctrader.find((item) => item.status === "reauthorization_required") ||
    ctrader[0];
  const connectedCTrader = cTraderConnection?.status === "connected";
  const needsReauth =
    cTraderConnection?.status === "reauthorization_required";
  const mtConnected = meta.some((item) => item.status === "connected");
  const connectedCount = connections.filter(
    (item) => item.status === "connected",
  ).length;
  const attentionCount = connections.filter((item) =>
    ["error", "reauthorization_required", "stale", "offline"].includes(
      item.status,
    ),
  ).length;
  const cTraderPositionCount = positions.filter(
    (item) => item.provider === "ctrader",
  ).length;
  const mtPositionCount = positions.filter(
    (item) => item.provider === "metatrader",
  ).length;

  const lastSyncLabel = cTraderConnection?.lastSyncedAt
    ? formatDate(cTraderConnection.lastSyncedAt, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : meta.find((item) => item.lastSyncedAt)?.lastSyncedAt
      ? formatDate(meta.find((item) => item.lastSyncedAt)!.lastSyncedAt!, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Not synced yet";

  const heroTitle = connectedCTrader || mtConnected
    ? connectedCTrader && mtConnected
      ? "Brokers connected"
      : connectedCTrader
        ? "cTrader is connected"
        : "MetaTrader is connected"
    : needsReauth
      ? "cTrader needs reconnecting"
      : "Connect a broker to JUVO";

  const onGeneratePairing = () =>
    void run("pair", async () => {
      const result = await createMetaTraderPairingCodeService();
      setPair({ code: result.code, expiresAt: result.expiresAt });
      setApiUrl(result.apiUrl);
      setShowSetup(true);
      setNotice("Pairing code ready. Enter it in the JUVO Connector EA.");
      setTab("mt5");
    });

  const onSharePairing = async () => {
    if (!pair) return;
    await Share.share({
      message: `JUVO MT5 pairing\nCode: ${pair.code}\nApiUrl: ${apiUrl}`,
    });
  };

  const onShareApiUrl = async () => {
    if (!apiUrl) return;
    await Share.share({ message: apiUrl });
  };

  const onConnectCTrader = () =>
    void run("ctrader", async () => {
      const result = await getCTraderConnectUrlService();
      await Linking.openURL(result.authorizationUrl);
      setNotice("Finish connecting in the browser, then return and refresh.");
      setTab("ctrader");
    });

  const onManageMt = (
    connection: BrokerConnection,
    action: "sync" | "disconnect",
  ) => {
    if (action === "disconnect") {
      Alert.alert(
        "Disconnect MT5",
        "This revokes the connector credential. Saved trades and journals stay.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: () =>
              void run(connection.id, async () => {
                await manageMetaTraderConnectionService(connection.id, action);
                await load(true);
                setNotice("MT5 account disconnected.");
              }),
          },
        ],
      );
      return;
    }

    void run(connection.id, async () => {
      await manageMetaTraderConnectionService(connection.id, action);
      await load(true);
      setNotice("Sync requested. Keep MT5 and JUVO Connector running.");
    });
  };

  const onManageCTrader = (
    connection: BrokerConnection,
    action: "sync" | "disconnect",
  ) => {
    if (action === "disconnect") {
      Alert.alert(
        "Disconnect cTrader",
        "Imported journal history stays saved, but live positions stop until you reconnect.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: () =>
              void run(connection.id, async () => {
                await disconnectCTraderService(connection.id);
                await load(true);
                setNotice("cTrader account disconnected.");
              }),
          },
        ],
      );
      return;
    }

    void run(connection.id, async () => {
      await syncCTraderService(connection.id);
      await load(true);
      setNotice("cTrader sync completed.");
    });
  };

  if (loading) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Brokers" }} />
        <LoadingState label="Loading brokers…" />
      </Screen>
    );
  }

  if (error && connections.length === 0 && mtEnabled === null) {
    return (
      <Screen includeBottomInset>
        <Stack.Screen options={{ title: "Brokers" }} />
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      includeBottomInset
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    >
      <Stack.Screen options={{ title: "Broker Connections" }} />

      <PageHeader
        eyebrow="Accounts"
        title="Broker Connections"
        description="Manage read-only broker access, sync health, and where broker data flows inside JUVO."
        action={
          <Button
            title="Accounts"
            variant="ghost"
            fullWidth={false}
            size="sm"
            onPress={() => router.push("/accounts")}
          />
        }
      />

      <Card style={styles.heroCard}>
        <View style={[styles.heroTop, isTablet && styles.heroTopWide]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.shieldRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                Read-only broker access
              </Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {heroTitle}
            </Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              JUVO reads account activity for journaling and analytics. It does
              not place, edit, or close broker trades.
            </Text>
          </View>

          <View style={[styles.heroActions, isTablet && styles.heroActionsWide]}>
            <Button
              title={connectedCTrader ? "Reconnect cTrader" : "Connect cTrader"}
              loading={busy === "ctrader"}
              onPress={onConnectCTrader}
            />
            <Button
              title="Pair MetaTrader 5"
              variant="secondary"
              loading={busy === "pair"}
              disabled={mtEnabled === false}
              onPress={onGeneratePairing}
            />
          </View>
        </View>

        <View
          style={[
            styles.metricGrid,
            metricColumns > 1 && styles.metricGridWide,
            isTablet && styles.metricGridTablet,
          ]}
        >
          <StatusMetric
            icon="link-outline"
            label="Connections"
            value={`${connectedCount}/${connections.length || 0} live`}
            tone={connectedCount > 0 ? "good" : "muted"}
          />
          <StatusMetric
            icon="pulse-outline"
            label="Open positions"
            value={`${positions.length}`}
            tone={positions.length > 0 ? "good" : "muted"}
          />
          <StatusMetric
            icon="time-outline"
            label="Last sync"
            value={lastSyncLabel}
            tone={lastSyncLabel === "Not synced yet" ? "muted" : "good"}
          />
          <StatusMetric
            icon="alert-circle-outline"
            label="Attention"
            value={String(attentionCount)}
            tone={attentionCount > 0 ? "warn" : "good"}
          />
        </View>
      </Card>

      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={tab === item.id}
            onPress={() => setTab(item.id)}
          />
        ))}
      </View>

      {error ? (
        <Text style={[styles.banner, { color: colors.danger }]}>{error}</Text>
      ) : null}
      {notice ? (
        <Text style={[styles.banner, { color: colors.primary }]}>{notice}</Text>
      ) : null}

      {tab === "overview" ? (
        <View style={styles.section}>
          <View style={[styles.split, isTablet && styles.splitWide]}>
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Where broker data goes
              </Text>
              <Text style={styles.helpLine}>
                · Journal fills and closed deals
              </Text>
              <Text style={styles.helpLine}>
                · Open positions on this Brokers page
              </Text>
              <Text style={styles.helpLine}>
                · Analytics and account balances when linked
              </Text>
              <Button
                title="Manage trading accounts"
                variant="ghost"
                onPress={() => router.push("/accounts")}
                style={{ marginTop: spacing.sm }}
              />
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Provider snapshot
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                MT5: {meta.length} linked · {mtPositionCount} open
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                cTrader: {ctrader.length} linked · {cTraderPositionCount} open
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>
                Mode: read-only connector
              </Text>
            </Card>
          </View>

          <SectionHeader title="Connected accounts" />
          {connections.length === 0 ? (
            <EmptyState
              title="No broker connections yet"
              description="Start with MT5 pairing or cTrader OAuth."
              actionLabel="Set up MT5"
              onAction={() => {
                setTab("mt5");
                setShowSetup(true);
              }}
            />
          ) : (
            <View style={styles.list}>
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  busy={busy}
                  mtEnabled={mtEnabled}
                  onSync={() =>
                    connection.provider === "metatrader"
                      ? onManageMt(connection, "sync")
                      : onManageCTrader(connection, "sync")
                  }
                  onDisconnect={() =>
                    connection.provider === "metatrader"
                      ? onManageMt(connection, "disconnect")
                      : onManageCTrader(connection, "disconnect")
                  }
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {tab === "mt5" ? (
        <View style={styles.section}>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                MetaTrader 5
              </Text>
              <Text style={{ color: colors.textMuted, fontWeight: "600" }}>
                Read-only EA
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              Sync account-wide trades, open positions, and balances from your
              MT5 desktop terminal. No broker password is required.
            </Text>

            {mtEnabled === false ? (
              <Text style={{ color: colors.warning, marginTop: spacing.sm }}>
                The MT5 connector is not configured on this server yet.
              </Text>
            ) : null}

            {mtEnabled ? (
              <View style={styles.actionsColumn}>
                <Pressable
                  onPress={() => setShowSetup((value) => !value)}
                  style={styles.setupToggle}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    {showSetup ? "Hide setup steps" : "Show setup steps"}
                  </Text>
                  <Ionicons
                    name={showSetup ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.primary}
                  />
                </Pressable>

                {showSetup ? (
                  <View
                    style={[
                      styles.setupBox,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.input,
                      },
                    ]}
                  >
                    <Text style={[styles.setupStep, { color: colors.text }]}>
                      1. On your computer, download JUVO Connector from the web
                      app, compile it in MetaEditor (F7), and attach it to a
                      chart.
                    </Text>
                    <Text style={[styles.setupStep, { color: colors.text }]}>
                      2. In MT5 Options → Expert Advisors, allow WebRequest for
                      the ApiUrl below.
                    </Text>
                    <Text style={[styles.setupStep, { color: colors.text }]}>
                      3. Generate a pairing code here and paste Code + ApiUrl
                      into the EA inputs. Keep the terminal running.
                    </Text>
                  </View>
                ) : null}

                {apiUrl ? (
                  <View style={styles.copyBlock}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      Server address / ApiUrl
                    </Text>
                    <Text selectable style={{ color: colors.text }}>
                      {apiUrl}
                    </Text>
                    <Button
                      title="Share ApiUrl"
                      variant="secondary"
                      onPress={() => void onShareApiUrl()}
                    />
                  </View>
                ) : null}

                {apiUrl.startsWith("http://") ? (
                  <Text style={{ color: colors.warning, lineHeight: 20 }}>
                    Local development: set AllowLocalHttp to true in the EA
                    inputs.
                  </Text>
                ) : null}

                <Button
                  title={pair ? "Replace pairing code" : "Generate pairing code"}
                  loading={busy === "pair"}
                  onPress={onGeneratePairing}
                />

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
                    <Text style={[styles.label, { color: colors.textMuted }]}>
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
                      . Keep this code private.
                    </Text>
                    <Button
                      title="Share code + ApiUrl"
                      variant="secondary"
                      onPress={() => void onSharePairing()}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>

          <SectionHeader title="MT5 connections" />
          {meta.length === 0 ? (
            <EmptyState
              title="No MT5 connections"
              description="Generate a pairing code, then attach JUVO Connector in MT5."
              actionLabel="Generate code"
              onAction={onGeneratePairing}
            />
          ) : (
            <View style={styles.list}>
              {meta.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  busy={busy}
                  mtEnabled={mtEnabled}
                  onSync={() => onManageMt(connection, "sync")}
                  onDisconnect={() => onManageMt(connection, "disconnect")}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {tab === "ctrader" ? (
        <View style={styles.section}>
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              cTrader
            </Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              Authorize a read-only cTrader connection in the browser. After you
              finish, return here and pull to refresh.
            </Text>
            <View style={styles.actionsColumn}>
              <Button
                title={
                  needsReauth
                    ? "Reconnect cTrader"
                    : connectedCTrader
                      ? "Reconnect cTrader"
                      : "Connect cTrader"
                }
                loading={busy === "ctrader"}
                onPress={onConnectCTrader}
              />
              {connectedCTrader && cTraderConnection ? (
                <Button
                  title="Sync broker"
                  variant="secondary"
                  loading={busy === cTraderConnection.id}
                  onPress={() => onManageCTrader(cTraderConnection, "sync")}
                />
              ) : null}
              <Pressable onPress={() => router.push("/help")}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  Need a cTrader walkthrough?
                </Text>
              </Pressable>
            </View>
          </Card>

          <SectionHeader title="cTrader connections" />
          {ctrader.length === 0 ? (
            <EmptyState
              title="No cTrader connections"
              description="Connect an account to sync deals and open positions."
              actionLabel="Connect"
              onAction={onConnectCTrader}
            />
          ) : (
            <View style={styles.list}>
              {ctrader.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  busy={busy}
                  onSync={() => onManageCTrader(connection, "sync")}
                  onDisconnect={() => onManageCTrader(connection, "disconnect")}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {tab === "positions" ? (
        <View style={styles.section}>
          <SectionHeader title="Open broker positions" />
          {positions.length === 0 ? (
            <EmptyState
              title="No open positions"
              description="Connected terminals will show live positions here."
            />
          ) : (
            <View style={styles.list}>
              {positions.map((position) => {
                const currency =
                  position.moneyCurrency ||
                  (typeof position.tradingAccount === "object"
                    ? position.tradingAccount.accountCurrency ||
                      position.tradingAccount.currency
                    : "USD");
                const pnl =
                  position.live?.netUnrealizedPnl ??
                  position.live?.floatingProfitIndicative ??
                  0;

                return (
                  <Card key={position._id}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.name, { color: colors.text }]}>
                          {position.symbol} · {position.direction.toUpperCase()}
                        </Text>
                        <Text style={{ color: colors.textSecondary }}>
                          {position.provider === "metatrader"
                            ? "MT5"
                            : "cTrader"}
                          {position.lotSize || position.volume
                            ? ` · ${position.lotSize || position.volume} lots`
                            : ""}
                          {position.entryPrice
                            ? ` · Entry ${position.entryPrice}`
                            : ""}
                        </Text>
                        {position.openedAt ? (
                          <Text
                            style={{ color: colors.textMuted, marginTop: 4 }}
                          >
                            Opened {formatDate(position.openedAt)}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color:
                            pnl > 0
                              ? colors.success
                              : pnl < 0
                                ? colors.danger
                                : colors.text,
                        }}
                      >
                        {formatMoney(pnl, currency)}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {tab === "help" ? (
        <View style={styles.section}>
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              How broker sync works
            </Text>
            <Text style={styles.helpLine}>
              · JUVO connectors are read-only. They never place or modify trades.
            </Text>
            <Text style={styles.helpLine}>
              · MT5 needs the desktop JUVO Connector EA and a pairing code.
            </Text>
            <Text style={styles.helpLine}>
              · cTrader uses browser OAuth. Finish there, then refresh this page.
            </Text>
            <Text style={styles.helpLine}>
              · Disconnecting revokes sync access and keeps journal history.
            </Text>
            <Text style={styles.helpLine}>
              · Manual trading accounts still work without a live broker link.
            </Text>
          </Card>
          <Button
            title="Open Help Center"
            variant="secondary"
            onPress={() => router.push("/help")}
          />
          <Button
            title="Open Brokers in Settings"
            variant="ghost"
            onPress={() => router.push("/settings")}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  heroTop: {
    gap: spacing.lg,
  },
  heroTopWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  shieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  heroActions: {
    gap: spacing.sm,
  },
  heroActionsWide: {
    width: 220,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricGridWide: {
    justifyContent: "flex-start",
  },
  metricGridTablet: {
    gap: spacing.md,
  },
  metric: {
    width: "47%",
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  banner: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  split: {
    gap: spacing.md,
  },
  splitWide: {
    flexDirection: "row",
  },
  card: {
    gap: spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...typography.subtitle,
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  setupToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  setupBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  setupStep: {
    ...typography.caption,
    lineHeight: 18,
  },
  copyBlock: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    minWidth: 110,
    paddingHorizontal: spacing.md,
  },
  helpLine: {
    ...typography.body,
    lineHeight: 22,
  },
});
