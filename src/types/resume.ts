export type Basics = {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  photo?: string;
};
export type Education = {
  school: string;
  degree: string;
  location: string;
  date: string;
  coursework: string;
};
export type Experience = {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};
export type Project = { name: string; tech: string; bullets: string[] };
export type Skill = { label: string; items: string };

export type CustomEntry = {
  heading: string;
  subheading: string;
  date: string;
  location: string;
  text: string;
  bullets: string[];
};
export type CustomSection = { id?: string; title: string; entries: CustomEntry[] };
export type SectionTitles = Partial<
  Record<"education" | "experience" | "projects" | "skills", string>
>;

export type ResumeData = {
  basics: Basics;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
  sectionTitles?: SectionTitles;
  customSections?: CustomSection[];

  sectionOrder?: string[];
};

export type StartMode = "blank" | "sample" | "profile";

export type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  hasPhoto?: boolean;
  locked?: boolean;
  premium?: boolean;
  adUnlockable?: boolean;
  adsRequired?: number;
  v?: string;
};

export type TemplateData = {
  id: string;
  name: string;
  hasPhoto?: boolean;
  premium?: boolean;
  emptyData: ResumeData;
  sampleData: ResumeData;
};

export type ResumeListItem = {
  id: string;
  title: string;
  template_id: string;
  created_at: string;
  updated_at: string;
};

export type ResumeRow = ResumeListItem & { data: ResumeData };

export type GeneratePayload = {
  templateId: string;
  title?: string;
  jobTitle: string;
  yearsOfExperience: number;
  skills?: string;
  degree?: string;
  industry?: string;
};
