import api from "./apiClient";
import type { ResumeData } from "../types/resume";

export type OrderSuggestion = {
  order: string[];
  reasons: Record<string, string>;
  summary: string;
  tips: { section: string; tip: string }[];
  source: "ai" | "rules";
};

export async function suggestSectionOrder(
  data: ResumeData,
  target?: string,
): Promise<OrderSuggestion> {
  const res = await api.post(
    "/resumes/suggest",
    { data, target: target?.trim() || undefined },
    { timeout: 40000 },
  );
  return res.data.suggestion as OrderSuggestion;
}
