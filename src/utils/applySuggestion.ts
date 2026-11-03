import type { ResumeData } from "../types/resume";

const norm = (s: string) =>
  s
    .replace(/^[•●▪◦‣\-–—*\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function replaceLine(
  data: ResumeData,
  original: string,
  improved: string,
): ResumeData | null {
  const target = norm(original);
  const next = (improved || "").replace(/^[•●▪◦‣\-–—*\s]+/, "").trim();
  if (!target || !next) return null;
  const d = clone(data);
  let hit = false;

  const fix = (b: string) => {
    const n = norm(b);
    if (
      !hit &&
      n &&
      (n === target || n.includes(target) || (target.includes(n) && n.length > 25))
    ) {
      hit = true;
      return n === target || target.includes(n)
        ? next
        : b.replace(new RegExp(escape(original.trim()), "i"), next);
    }
    return b;
  };
  d.experience.forEach((e) => (e.bullets = e.bullets.map(fix)));
  d.projects.forEach((p) => (p.bullets = p.bullets.map(fix)));
  (d.customSections ?? []).forEach((s) =>
    s.entries.forEach((e) => {
      e.bullets = e.bullets.map(fix);
      if (!hit && e.text && norm(e.text).includes(target)) {
        hit = true;
        e.text = next;
      }
    }),
  );
  return hit ? d : null;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function addKeywords(data: ResumeData, keywords: string[]): ResumeData | null {
  const d = clone(data);
  const have = new Set(
    d.skills.flatMap((s) => s.items.split(",")).map((x) => x.trim().toLowerCase()),
  );
  const fresh = keywords.map((k) => k.trim()).filter((k) => k && !have.has(k.toLowerCase()));
  if (!fresh.length) return null;

  let group =
    d.skills.find((s) => /^(skills|other|tools|technologies|additional)/i.test(s.label)) ??
    d.skills[d.skills.length - 1];
  if (!group) {
    group = { label: "Skills", items: "" };
    d.skills.push(group);
  }
  const joined = [group.items, ...fresh].filter(Boolean).join(", ");
  if (joined.length > 800) {
    if (d.skills.length >= 10) return null;
    d.skills.push({ label: "Other", items: fresh.join(", ") });
  } else group.items = joined;
  return d;
}
