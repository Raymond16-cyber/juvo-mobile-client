import { create } from "zustand";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestResetPassword,
} from "@/api/auth";
import { setUnauthorizedHandler } from "@/api/client";
import { getApiErrorMessage } from "@/lib/errors";
import { clearToken, getToken, setToken } from "@/lib/storage";
import type {
  AuthResponse,
  LoginData,
  LoginResponse,
  RegisterData,
  User,
} from "@/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  error: string | null;
  message: string | null;

  register: (data: RegisterData) => Promise<AuthResponse>;
  login: (data: LoginData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const clearSession = async () => {
    await clearToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasCheckedAuth: true,
      error: null,
      message: null,
    });
  };

  setUnauthorizedHandler(() => {
    void clearSession();
  });

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    hasCheckedAuth: false,
    error: null,
    message: null,

    clearSession,

    register: async (data) => {
      set({ isLoading: true, error: null, message: null });
      try {
        const response = await registerUser(data);
        await setToken(response.token);
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true,
          message: response.message,
          error: null,
        });
        return response;
      } catch (error) {
        const errorMessage = getApiErrorMessage(error, "Registration failed.");
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    login: async (data) => {
      set({ isLoading: true, error: null, message: null });
      try {
        const response = await loginUser(data);
        await setToken(response.token);
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true,
          error: null,
          message: response.message,
        });
        return response;
      } catch (error) {
        const errorMessage = getApiErrorMessage(
          error,
          "Invalid email or password.",
        );
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    requestPasswordReset: async (email) => {
      set({ isLoading: true, error: null, message: null });
      try {
        const result = await requestResetPassword({ email });
        set({
          isLoading: false,
          message:
            result?.message ||
            "If an account exists for that email, a reset link has been sent.",
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(
          error,
          "Failed to request password reset.",
        );
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    fetchCurrentUser: async () => {
      try {
        const token = await getToken();
        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            hasCheckedAuth: true,
          });
          return;
        }

        set({ isLoading: true, token });
        const user = await getCurrentUser();
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true,
        });
      } catch {
        await clearToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          hasCheckedAuth: true,
        });
      }
    },

    logout: async () => {
      try {
        if (get().token) {
          await logoutUser();
        }
      } catch {
        // ignore network errors on logout
      } finally {
        await clearSession();
      }
    },

    clearError: () => set({ error: null }),
  };
});
