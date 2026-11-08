import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { clearToken, getToken } from "@/lib/storage";

const API_PORT = 5001;

function hostFromUri(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/^exp:\/\//, "")
    .replace(/^https?:\/\//, "")
    .split("/")[0];
  const host = cleaned.split(":")[0]?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function resolveDevHost(): string | null {
  const expoConfig = Constants.expoConfig as
    | { hostUri?: string }
    | null
    | undefined;
  const fromExpoConfig = hostFromUri(expoConfig?.hostUri);
  if (fromExpoConfig) return fromExpoConfig;

  const manifest2 = (
    Constants as {
      manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    }
  ).manifest2;
  const fromManifest2 = hostFromUri(
    manifest2?.extra?.expoGo?.debuggerHost,
  );
  if (fromManifest2) return fromManifest2;

  const manifest = (
    Constants as { manifest?: { debuggerHost?: string } }
  ).manifest;
  return hostFromUri(manifest?.debuggerHost);
}

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  const configuredIsLoopback =
    !!configured &&
    (configured.includes("://localhost") ||
      configured.includes("://127.0.0.1"));

  // Explicit non-loopback env wins (staging/production or fixed LAN IP).
  if (configured && !configuredIsLoopback) {
    return configured;
  }

  // On a physical device / Expo Go, localhost is the phone itself.
  // Prefer the same machine IP Expo Metro is already using.
  const devHost = resolveDevHost();
  if (devHost) {
    return `http://${devHost}:${API_PORT}/api`;
  }

  // Android emulator loopback alias when no Expo host is available.
  if (Platform.OS === "android" && configuredIsLoopback) {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  return configured || `http://localhost:${API_PORT}/api`;
}

const baseURL = resolveApiBaseUrl();

if (__DEV__) {
  console.log(`[api] baseURL=${baseURL}`);
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || "");
      const isAuthProbe =
        /\/auth\/(sign-in|sign-up|me|request-reset-password|verify-reset-password-code|reset-password)/.test(
          requestUrl,
        );

      if (!isAuthProbe) {
        await clearToken();
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
