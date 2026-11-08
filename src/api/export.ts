import { Alert, Share } from "react-native";

import api from "./client";
import { exportJournalsJsonService } from "./journals";
import { getApiErrorMessage } from "@/lib/errors";

export { exportJournalsJsonService };

type ExportFilters = {
  accountId?: string;
  from?: string;
  to?: string;
};

function exportQuery(filters: ExportFilters) {
  const params = new URLSearchParams();
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * JSON export via `/journal/export` + Share.
 * PDF/Excel need blob/share; mobile prefers JSON/CSV. PDF/Excel attempt
 * arraybuffer + base64 Share when feasible; otherwise Alert and offer JSON/CSV.
 */
export async function shareJournalsJsonExport(filters?: ExportFilters) {
  const payload = await exportJournalsJsonService();
  let journals = Array.isArray(payload.journals) ? payload.journals : [];

  if (filters?.from || filters?.to || filters?.accountId) {
    journals = journals.filter((item) => {
      const journal = item as {
        journalDate?: string;
        tradingAccount?: string | { _id?: string };
      };
      const day = String(journal.journalDate || "").slice(0, 10);
      if (filters.from && day && day < filters.from) return false;
      if (filters.to && day && day > filters.to) return false;
      if (filters.accountId) {
        const accountId =
          typeof journal.tradingAccount === "string"
            ? journal.tradingAccount
            : journal.tradingAccount?._id;
        if (accountId && accountId !== filters.accountId) return false;
      }
      return true;
    });
  }

  const message = JSON.stringify({ ...payload, journals }, null, 2);
  await Share.share({
    message,
    title: "JUVO journal export",
  });
}

export async function attemptBinaryJournalExport(
  format: "pdf" | "excel",
  filters: ExportFilters = {},
) {
  try {
    const response = await api.get(`/journal/export/${format}${exportQuery(filters)}`, {
      responseType: "arraybuffer",
      timeout: 60000,
    });
    const buffer = response.data as ArrayBuffer;
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    if (typeof globalThis.btoa !== "function") {
      throw new Error("Base64 encoding is unavailable on this device.");
    }
    const base64 = globalThis.btoa(binary);

    await Share.share({
      message: `JUVO ${format.toUpperCase()} export (base64):\n${base64.slice(0, 4000)}${
        base64.length > 4000
          ? "\n…truncated. Prefer JSON/CSV on mobile or open PDF/Excel on web."
          : ""
      }`,
      title: `JUVO ${format} export`,
    });
  } catch (err) {
    Alert.alert(
      `${format.toUpperCase()} on web`,
      `${getApiErrorMessage(
        err,
        "PDF and Excel open best on the web app.",
      )} You can still export JSON or CSV here.`,
    );
  }
}
