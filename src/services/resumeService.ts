import { AxiosError } from "axios";
import api, { getErrorMessage } from "./apiClient";
import {
  GeneratePayload,
  ResumeData,
  ResumeListItem,
  ResumeRow,
  TemplateData,
  TemplateInfo,
} from "../types/resume";

export const apiError = (e: unknown, fallback = "Something went wrong.") => {
  const d = (e as AxiosError<any>)?.response?.data;
  const first = d?.details?.[0];
  if (first) return `${(first.path ?? []).join(" > ")}: ${first.message}`;
  if (typeof d?.error === "string") return d.error;
  if (typeof d?.message === "string") return d.message;
  return getErrorMessage(e, fallback);
};

export const apiCode = (e: unknown): string | undefined => {
  const c = (e as AxiosError<any>)?.response?.data?.code;
  return typeof c === "string" ? c : undefined;
};

const base = () => String(api.defaults.baseURL ?? "").replace(/\/$/, "");

export const resumeDownloadUrl = (id: string) => `${base()}/resumes/${id}/download?paper=a4`;

export const PAGE_W = 816;
export const PAGE_RATIO = 11 / 8.5;

export const fitToPage = (html: string, viewW: number, zoomable = true): string => {
  const s = Math.max(0.1, Math.min(1, viewW / PAGE_W)).toFixed(4);
  const meta = `<meta name="viewport" content="width=${PAGE_W}, initial-scale=${s}, minimum-scale=${s}, maximum-scale=${
    zoomable ? 4 : s
  }, user-scalable=${zoomable ? "yes" : "no"}"/>`;
  const css = `<style>html{background:#fff;-webkit-text-size-adjust:100%}</style>`;

  let out = /<meta\s+name=["']viewport["'][^>]*>/i.test(html)
    ? html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, meta)
    : html.replace(/<head[^>]*>/i, (m) => `${m}${meta}`);
  out = out.includes("</head>") ? out.replace("</head>", `${css}</head>`) : css + out;
  return out;
};

export const resumeService = {
  async listTemplates(): Promise<TemplateInfo[]> {
    const { data } = await api.get<{ templates: TemplateInfo[] }>("/templates");
    // The 10 ad-unlockable templates first, the permanently locked ones after them.
    return [...data.templates].sort((a, b) => Number(!!b.adUnlockable) - Number(!!a.adUnlockable));
  },

  async templateData(id: string): Promise<TemplateData> {
    const { data } = await api.get<TemplateData>(`/templates/${id}/data`);
    return data;
  },

  async templatePreviewHtml(id: string): Promise<string> {
    const { data } = await api.get<string>(`/templates/${id}/preview`, {
      responseType: "text",
      transformResponse: [(r) => r],
    });
    return data;
  },

  async list(): Promise<ResumeListItem[]> {
    const { data } = await api.get<{ resumes: ResumeListItem[] }>("/resumes");
    return data.resumes;
  },

  async get(id: string): Promise<ResumeRow> {
    const { data } = await api.get<{ resume: ResumeRow }>(`/resumes/${id}`);
    return data.resume;
  },

  async create(payload: {
    templateId: string;
    title?: string;
    data: ResumeData;
  }): Promise<ResumeRow> {
    const { data } = await api.post<{ resume: ResumeRow }>("/resumes", payload);
    return data.resume;
  },

  async generate(payload: GeneratePayload): Promise<ResumeRow> {
    const { data } = await api.post<{ resume: ResumeRow }>("/resumes/generate", payload, {
      timeout: 200000,
    });
    return data.resume;
  },

  async update(
    id: string,
    payload: { title?: string; templateId?: string; data?: ResumeData },
  ): Promise<ResumeRow> {
    const { data } = await api.put<{ resume: ResumeRow }>(`/resumes/${id}`, payload);
    return data.resume;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/resumes/${id}`);
  },

  async previewHtml(id: string): Promise<string> {
    const { data } = await api.get<string>(`/resumes/${id}/preview`, {
      responseType: "text",
      transformResponse: [(r) => r],
    });
    return data;
  },
};
