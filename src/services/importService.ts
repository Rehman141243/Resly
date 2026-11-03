import api from "./apiClient";
import type { AtsResult } from "./atsService";
import type { ResumeData } from "../types/resume";

export type Breakdown = AtsResult["breakdown"];
export type ImportResult = { data: ResumeData; source: "ai" | "rules"; result: AtsResult };

export async function importResume(
  file: { uri: string; name: string },
  stack: string,
): Promise<ImportResult> {
  const form = new FormData();
  form.append("resume", {
    uri: file.uri,
    name: file.name || "resume.pdf",
    type: "application/pdf",
  } as any);
  form.append("stack", stack);

  const { data } = await api.post("/ats/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (d) => d,
    timeout: 180000,
  });
  if (!data?.success) throw new Error(data?.message || "Import failed.");
  return { data: data.data, source: data.source, result: data.result };
}

export async function rescoreResume(
  resume: ResumeData,
  opts: { stack?: string; quick: boolean; prev?: Breakdown },
): Promise<AtsResult> {
  const { data } = await api.post(
    "/ats/rescore",
    { data: resume, stack: opts.stack ?? "", quick: opts.quick, prev: opts.prev },
    { timeout: opts.quick ? 20000 : 120000 },
  );
  if (!data?.success) throw new Error(data?.message || "Re-scoring failed.");
  return data.result as AtsResult;
}
