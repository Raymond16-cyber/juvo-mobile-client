import api from "./client";
import type { OnboardingData, OnboardingResponse } from "@/types/onboarding";

export const saveOnboarding = async (
  data: OnboardingData,
): Promise<OnboardingResponse> => {
  const response = await api.post<OnboardingResponse>(
    "/onboarding/onboard-user",
    data,
  );
  return response.data;
};
