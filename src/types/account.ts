export type TradingAccountStatus = "Active" | "Passed" | "Breached";

export interface TradingAccount {
  _id: string;
  accountName: string;
  accountNumber: string;
  accountType: "live" | "demo" | "prop" | "challenge";
  broker: string;
  initialBalance: number;
  currentBalance: number;
  platform: string;
  server?: string;
  leverage: string;
  currency: string;
  accountCurrency?: string;
  currentEquity: number;
  margin?: number;
  freeMargin?: number;
  maxDrawnDown: number;
  profitTarget: number;
  isConnected: boolean;
  isArchived?: boolean;
  isActive?: boolean;
  status?: TradingAccountStatus;
  statusUpdatedAt?: string | null;
  tradesCount?: number;
  totalProfitLoss?: number;
  openTrades?: number;
  closedTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  profitPercent?: number;
  drawdownPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateTradingAccountPayload = {
  accountName: string;
  accountNumber: string;
  accountType: TradingAccount["accountType"];
  broker: string;
  initialBalance: number;
  platform: string;
  server?: string;
  leverage: string;
  currency: string;
  accountCurrency?: string;
  maxDrawnDown: number;
  profitTarget: number;
};

export interface TradingAccountsResponse {
  data: TradingAccount[];
  message: string;
}

export interface CreateTradingAccountResponse {
  data: TradingAccount;
  message: string;
}

export interface TradingAccountOutcome {
  _id: string;
  accountName: string;
  broker?: string;
  currency?: string;
  accountCurrency?: string;
  currentBalance: number;
  currentEquity: number;
  initialBalance?: number;
  profitTarget?: number;
  maxDrawnDown?: number;
  status: TradingAccountStatus;
  isActive: boolean;
  profitPercent: number;
  drawdownPercent: number;
  statusChanged: boolean;
}
