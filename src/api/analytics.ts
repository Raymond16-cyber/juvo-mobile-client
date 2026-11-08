import api from "./client";
import type { AnalyticsData } from "@/types/analytics";

export const getAnalyticsService = async (tradingAccountId?: string | null) => {
  const response = await api.get<{ data: AnalyticsData }>("/analytics", {
    params: tradingAccountId ? { tradingAccount: tradingAccountId } : undefined,
  });
  return response.data;
};
