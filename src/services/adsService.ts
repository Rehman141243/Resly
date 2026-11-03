import api from "./apiClient";

export type AdAccess = {
  showAds: boolean;
  adsRequired: number;
  unlocked: string[];
  progress: Record<string, number>;
};

export const adsService = {
  async access(): Promise<AdAccess> {
    const { data } = await api.get("/ads/access");
    return {
      showAds: !!data.showAds,
      adsRequired: Number(data.adsRequired) || 3,
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      progress: data.progress ?? {},
    };
  },

  async testReport(templateId: string) {
    const { data } = await api.post("/ads/test-report", { templateId });
    return data as { success: boolean; watched: number; unlocked: boolean };
  },
};

export const isLockedError = (e: unknown): boolean =>
  (e as any)?.response?.data?.code === "TEMPLATE_LOCKED";
