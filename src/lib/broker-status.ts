import type { BrokerConnectionStatus } from "@/types/broker";

export const brokerStatusCopy: Record<BrokerConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Needs attention",
  reauthorization_required: "Reconnect required",
  synchronizing: "Synchronizing",
  stale: "Heartbeat delayed",
  offline: "Terminal offline",
};

export function brokerStatusColor(
  status: BrokerConnectionStatus,
  colors: {
    success: string;
    danger: string;
    warning: string;
    textMuted: string;
  },
) {
  if (status === "connected") return colors.success;
  if (status === "error" || status === "reauthorization_required") {
    return colors.danger;
  }
  if (status === "disconnected") return colors.textMuted;
  return colors.warning;
}
