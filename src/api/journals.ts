import api from "./client";
import type {
  CloseTradePayload,
  CloseTradeResponse,
  CompleteJournalPayload,
  CreateJournalPayload,
  CreateTradePayload,
  CreateTradeResponse,
  JournalDetailResponse,
  JournalStatusResponse,
  JournalStreakResponse,
  NoTradeDayPayload,
  NoTradeDayResponse,
  UserJournalsResponse,
} from "@/types/journal";

export const getTodayJournalStatusService =
  async (): Promise<JournalStatusResponse> => {
    const response = await api.get<JournalStatusResponse>(
      "/journal/get-today-journal-status",
    );
    return response.data;
  };

export const getJournalStreakService =
  async (): Promise<JournalStreakResponse> => {
    const response = await api.get<JournalStreakResponse>("/journal/streak");
    return response.data;
  };

export const upsertNoTradeDayService = async (
  data: NoTradeDayPayload,
): Promise<NoTradeDayResponse> => {
  const response = await api.post<NoTradeDayResponse>("/journal/no-trade-day", {
    data,
  });
  return response.data;
};

export const exportJournalsJsonService = async () => {
  const response = await api.get<{
    schemaVersion: number;
    exportedAt: string;
    timeZone?: string;
    reportingCurrency?: string;
    journals: unknown[];
  }>("/journal/export");
  return response.data;
};

export const liftNoTradeDayService = async (payload?: {
  liftNote?: string;
  note?: string;
}): Promise<NoTradeDayResponse> => {
  const response = await api.post<NoTradeDayResponse>(
    "/journal/no-trade-day/lift",
    { data: payload || {} },
  );
  return response.data;
};

export const getTodayNoTradeDayService = async () => {
  const response = await api.get<{
    message: string;
    data: {
      localDayKey: string;
      timezone: string;
      entry: NoTradeDayResponse["data"]["entry"] | null;
    };
  }>("/journal/no-trade-day/today");
  return response.data;
};

export const previewTradeSetupService = async (
  data: Partial<CreateTradePayload>,
) => {
  const response = await api.post<{ message: string; data: unknown }>(
    "/journal/trade-preview",
    { data },
  );
  return response.data;
};

export const getUserJournalsService =
  async (): Promise<UserJournalsResponse> => {
    const response = await api.get<UserJournalsResponse>(
      "/journal/get-user-journals",
    );
    return response.data;
  };

export const createJournalService = async (
  data: CreateJournalPayload,
): Promise<JournalStatusResponse> => {
  const response = await api.post<JournalStatusResponse>(
    "/journal/create-journal",
    { data },
  );
  return response.data;
};

export const createJournalTradeService = async (
  journalId: string,
  data: CreateTradePayload,
): Promise<CreateTradeResponse> => {
  const response = await api.post<CreateTradeResponse>(
    `/journal/${journalId}/trades`,
    { data },
  );
  return response.data;
};

export const getJournalByIdService = async (
  journalId: string,
): Promise<JournalDetailResponse> => {
  const response = await api.get<JournalDetailResponse>(
    `/journal/${journalId}`,
  );
  return response.data;
};

export const completeJournalService = async (
  journalId: string,
  data: CompleteJournalPayload,
): Promise<JournalDetailResponse> => {
  const response = await api.patch<JournalDetailResponse>(
    `/journal/${journalId}/complete`,
    { data },
  );
  return response.data;
};

export const closeJournalTradeService = async (
  journalId: string,
  tradeId: string,
  data: CloseTradePayload,
): Promise<CloseTradeResponse> => {
  const response = await api.patch<CloseTradeResponse>(
    `/journal/${journalId}/trades/${tradeId}/close`,
    { data },
  );
  return response.data;
};
