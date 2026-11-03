import type { ResumeData } from "../types/resume";

export type SectionItem = { key: string; label: string; count: number };

type BaseKey = "education" | "experience" | "projects" | "skills";

const DEFAULT_TITLES: Record<BaseKey, string> = {
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
};

const BASE: BaseKey[] = ["education", "experience", "projects", "skills"];

export const customKey = (id: string | undefined, index: number) => `custom:${id || index}`;

const allKeys = (d: ResumeData): string[] => [
  ...BASE,
  ...(d.customSections ?? []).map((s, i) => customKey(s.id, i)),
];

export function orderedKeys(d: ResumeData): string[] {
  const all = allKeys(d);
  const saved = (d.sectionOrder ?? []).filter((k, i, a) => all.includes(k) && a.indexOf(k) === i);
  return [...saved, ...all.filter((k) => !saved.includes(k))];
}

function describe(d: ResumeData, key: string): { label: string; count: number } {
  const T = d.sectionTitles ?? {};
  const title = (k: BaseKey) => (T[k] || "").trim() || DEFAULT_TITLES[k];

  switch (key) {
    case "education":
      return { label: title("education"), count: d.education.length };
    case "experience":
      return { label: title("experience"), count: d.experience.length };
    case "projects":
      return { label: title("projects"), count: d.projects.length };
    case "skills":
      return { label: title("skills"), count: d.skills.filter((s) => s.label || s.items).length };
  }

  const idx = (d.customSections ?? []).findIndex((s, i) => customKey(s.id, i) === key);
  const s = idx >= 0 ? d.customSections![idx] : undefined;
  return { label: s?.title?.trim() || "Section", count: s?.entries.length ?? 0 };
}

export function buildItems(d: ResumeData, includeEmpty = false): SectionItem[] {
  return orderedKeys(d)
    .map((key) => ({ key, ...describe(d, key) }))
    .filter((x) => includeEmpty || x.count > 0);
}

export function mergeOrder(d: ResumeData, visibleKeys: string[]): string[] {
  return [...visibleKeys, ...orderedKeys(d).filter((k) => !visibleKeys.includes(k))];
}
