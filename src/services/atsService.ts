import api from "./apiClient";

export type AtsCheck = {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  max: number;
  tip: string;
};

export type AtsResult = {
  score: number;
  verdict: string;
  breakdown: { ats: number; grammar: number; impact: number; stackFit: number; clarity: number };
  checks: AtsCheck[];
  stats: { words: number; pages: number; bullets: number };
  ai: {
    detectedStack: string[];
    summary: string;
    strengths: string[];
    mistakes: { section: string; issue: string; fix: string }[];
    grammar: { original: string; suggestion: string; reason: string }[];
    rewrites: { original: string; improved: string; why: string }[];
    stackTips: string[];
    missingKeywords: string[];
  };
};

export async function analyzeAts(
  file: { uri: string; name: string },
  stack: string,
): Promise<AtsResult> {
  const form = new FormData();
  form.append("resume", {
    uri: file.uri,
    name: file.name || "resume.pdf",
    type: "application/pdf",
  } as any);
  form.append("stack", stack);

  const { data } = await api.post("/ats/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (d) => d,
    timeout: 120000,
  });

  if (!data?.success) throw new Error(data?.message || "Analysis failed.");
  return data.result as AtsResult;
}
