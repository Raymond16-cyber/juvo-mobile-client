import api from "./client";
import type {
  AuthResponse,
  LoginData,
  LoginResponse,
  RegisterData,
  UpdatePreferencesPayload,
  User,
} from "@/types/auth";

export const registerUser = async (
  data: RegisterData,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/sign-up", data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/sign-in", data);
  return response.data;
};

export const requestResetPassword = async (data: { email: string }) => {
  const response = await api.post("/auth/request-reset-password", data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ user: User }>("/auth/me");
  return response.data.user;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const updatePreferences = async (data: UpdatePreferencesPayload) => {
  const response = await api.patch<{ user: User; message: string }>(
    "/auth/preferences",
    { data },
  );
  return response.data;
};
