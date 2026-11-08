export function getApiErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { code?: unknown } } })
      .response?.data;
    if (data && typeof data.code === "string") return data.code;
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const payload = data as { message?: unknown; error?: unknown };
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message;
      }
      if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String(
      (error as { message?: unknown }).message || "",
    ).trim();
    const code =
      "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";

    // Axios uses "Network Error" when the device cannot reach the API at all.
    if (
      message === "Network Error" ||
      code === "ERR_NETWORK" ||
      code === "ECONNABORTED"
    ) {
      return "Cannot reach the JUVO server. Make sure the backend is running and your phone is on the same Wi-Fi as your computer.";
    }

    if (message) return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
