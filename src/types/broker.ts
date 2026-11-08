export type BrokerProvider = "ctrader" | "metatrader";

export type BrokerPlatform = "ctrader" | "mt4" | "mt5";

export type BrokerConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "reauthorization_required"
  | "synchronizing"
  | "stale"
  | "offline";

export type BrokerAccountType = "demo" | "live";

export interface BrokerConnection {
  id: string;
  userId?: string;
  provider: BrokerProvider;
  platform: BrokerPlatform;
  externalAccountId?: string;
  brokerName?: string;
  accountNumber?: string;
  accountType?: BrokerAccountType;
  server?: string;
  accountCurrency?: string;
  lastHeartbeatAt?: string | null;
  connectorVersion?: string;
  legacy?: boolean;
  desiredConnected?: boolean;
  tradingAccount?: string;
  lastError?: { code: string; message: string } | null;
  status: BrokerConnectionStatus;
  lastSyncedAt?: string | null;
  connectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BrokerPositionStatus = "open" | "closed" | "unknown";

export interface BrokerPosition {
  _id: string;
  provider: BrokerProvider;
  platform?: BrokerPlatform;
  externalPositionId: string;
  symbol: string;
  direction: "long" | "short";
  volume?: number;
  lotSize?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: BrokerPositionStatus;
  openedAt?: string;
  closedAt?: string;
  moneyCurrency?: string | null;
  live?: {
    currentPrice?: number;
    netUnrealizedPnl?: number;
    floatingProfitIndicative?: number;
  };
  tradingAccount?:
    | string
    | {
        _id: string;
        accountName: string;
        accountNumber: string;
        broker: string;
        platform: string;
        currency: string;
        accountCurrency?: string;
      };
}

export interface BrokerConnectionsResponse {
  message: string;
  data: BrokerConnection[];
}

export interface BrokerPositionsResponse {
  message: string;
  data: BrokerPosition[];
}

export interface CTraderConnectResponse {
  message: string;
  authorizationUrl: string;
}

export interface MetaTraderStatus {
  enabled: boolean;
  url: string;
  connections: BrokerConnection[];
}

export interface MetaTraderPairingCode {
  code: string;
  expiresAt: string;
  apiUrl: string;
}
