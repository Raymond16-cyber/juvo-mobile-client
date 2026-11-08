import api from "./client";
import type {
  AchievementsResponse,
  CelebrateAchievementsResponse,
  FeaturedAchievementsResponse,
} from "@/types/achievement";

export const getAchievementsService = async () => {
  const response = await api.get<AchievementsResponse>("/achievements");
  return response.data;
};

export const celebrateAchievementsService = async (
  achievementIds: string[],
) => {
  const response = await api.post<CelebrateAchievementsResponse>(
    "/achievements/celebrate",
    { achievementIds },
  );
  return response.data;
};

export const setFeaturedAchievementsService = async (
  achievementIds: string[],
) => {
  const response = await api.put<FeaturedAchievementsResponse>(
    "/achievements/featured",
    { achievementIds },
  );
  return response.data;
};
