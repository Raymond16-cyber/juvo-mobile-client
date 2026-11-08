import { create } from "zustand";

import { getItem, setItem } from "@/lib/storage";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "juvo.theme.preference";

interface ThemeState {
  preference: ThemePreference;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  hydrated: false,

  hydrate: async () => {
    const saved = await getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      set({ preference: saved, hydrated: true });
      return;
    }
    set({ hydrated: true });
  },

  setPreference: async (preference) => {
    set({ preference });
    await setItem(STORAGE_KEY, preference);
  },
}));
