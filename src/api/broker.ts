import api from "./client";
import type {
  BrokerConnectionsResponse,
  BrokerPositionsResponse,
  CTraderConnectResponse,
  MetaTraderPairingCode,
  MetaTraderStatus,
} from "@/types/broker";

export const getBrokerConnectionsService = async () => {
  const response = await api.get<BrokerConnectionsResponse>(
    "/broker/connections",
  );
  return response.data;
};

export const getBrokerPositionsService = async (status?: string) => {
  const response = await api.get<BrokerPositionsResponse>("/broker/positions", {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const getCTraderConnectUrlService = async () => {
  const response = await api.get<CTraderConnectResponse>(
    "/broker/ctrader/connect",
  );
  return response.data;
};

export const syncCTraderService = async (connectionId?: string) => {
  const response = await api.post("/broker/ctrader/sync", { connectionId });
  return response.data;
};

export const disconnectCTraderService = async (connectionId: string) => {
  const response = await api.post("/broker/ctrader/disconnect", {
    connectionId,
  });
  return response.data;
};

export const getMetaTraderStatusService = async () => {
  const response = await api.get<{ data: MetaTraderStatus }>(
    "/broker/metatrader/status",
  );
  return response.data.data;
};

export const createMetaTraderPairingCodeService = async () => {
  const response = await api.post<{ data: MetaTraderPairingCode }>(
    "/broker/metatrader/pairing-code",
  );
  return response.data.data;
};

export const manageMetaTraderConnectionService = async (
  id: string,
  action: "sync" | "disconnect",
) => {
  await api.post(
    `/broker/metatrader/connections/${encodeURIComponent(id)}/${action}`,
    {},
  );
};
