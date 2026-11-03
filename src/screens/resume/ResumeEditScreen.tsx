import { Children, Fragment, ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types/navigation";
import { CustomEntry, ResumeData } from "../../types/resume";
import { apiError, resumeService } from "../../services/resumeService";
import { useAuth } from "../../context/AuthContext";
import { buildItems, customKey, mergeOrder, orderedKeys } from "../../utils/sectionOrder";
import {
  Button,
  CenterState,
  NavBar,
  NavText,
  Sheet,
  SheetAction,
  useResumeColors,
} from "../../components/resume/ResumeUI";
import SectionOrderSheet from "../../components/resume/SectionOrderSheet";
import { suggestSectionOrder } from "../../services/suggestService";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeEditor">;
type ListKey = "education" | "experience" | "projects" | "skills";
type Menu = { type: "add" } | { type: "section"; index: number } | null;

const LIMITS = {
  education: 6,
  experience: 12,
  projects: 12,
  skills: 10,
  bullets: 12,
  sections: 30,
  entries: 20,
};
const DEFAULT_TITLES = {
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
};
const PRESETS = [
  "Summary",
  "Certifications",
  "Awards",
  "Languages",
  "Volunteering",
  "Publications",
  "Interests",
];

const blankEntry = (): CustomEntry => ({
  heading: "",
  subheading: "",
  date: "",
  location: "",
  text: "",
  bullets: [],
});
const BLANK = {
  education: { school: "", degree: "", location: "", date: "", coursework: "" },
  experience: { company: "", role: "", location: "", startDate: "", endDate: "", bullets: [""] },
  projects: { name: "", tech: "", bullets: [""] },
  skills: { label: "", items: "" },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const newId = () => Math.random().toString(36).slice(2, 8);

const normalize = (d: Partial<ResumeData>): ResumeData => ({
  basics: { name: "", phone: "", email: "", linkedin: "", github: "", ...(d.basics ?? {}) },
  education: d.education ?? [],
  experience: (d.experience ?? []).map((e) => ({ ...e, bullets: e.bullets ?? [] })),
  projects: (d.projects ?? []).map((p) => ({ ...p, bullets: p.bullets ?? [] })),
  skills: d.skills ?? [],
  sectionTitles: { ...DEFAULT_TITLES, ...(d.sectionTitles ?? {}) },
  customSections: (d.customSections ?? []).map((s: any, i) => ({
    id: s.id || String(i),
    title: s.title ?? "",
    entries: (s.entries ?? []).map((e: any) => ({
      ...blankEntry(),
      ...e,
      bullets: e.bullets ?? [],
    })),
  })),
  sectionOrder: d.sectionOrder,
});

const hasContent = (e: CustomEntry) =>
  !!(
    e.heading.trim() ||
    e.subheading.trim() ||
    e.date.trim() ||
    e.location.trim() ||
    e.text.trim() ||
    e.bullets.some((b) => b.trim())
  );

const prune = (d: ResumeData): ResumeData => ({
  ...d,
  education: d.education.filter((e) => e.school.trim() || e.degree.trim()),
  experience: d.experience
    .filter((e) => e.company.trim() || e.role.trim())
    .map((e) => ({ ...e, bullets: e.bullets.filter((b) => b.trim()) })),
  projects: d.projects
    .filter((p) => p.name.trim())
    .map((p) => ({ ...p, bullets: p.bullets.filter((b) => b.trim()) })),
  skills: d.skills.filter((s) => s.label.trim() || s.items.trim()),
  customSections: (d.customSections ?? []).map((s: any) => ({
    id: s.id,
    title: s.title.trim() || "Section",
    entries: s.entries
      .filter(hasContent)
      .map((e: any) => ({ ...e, bullets: e.bullets.filter((b: any) => b.trim()) })),
  })),
});

const INK = "text-ink dark:text-ink-dark";
const MUTED = "text-muted dark:text-muted-dark";
const BRAND = "text-brand dark:text-brand-dark";
const DANGER = "text-[#EF4444] dark:text-[#FF453A]";

const Hair = ({ inset = true }: { inset?: boolean }) => (
  <View className={`h-[0.5px] bg-[#C6C6C8] dark:bg-[#38383A] ${inset ? "ml-4" : ""}`} />
);

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View
      className={`overflow-hidden rounded-xl bg-white dark:bg-[#1C1C1E] ${className}`}
      style={{ borderCurve: "continuous" }}
    >
      {items.map((ch, i) => (
        <Fragment key={i}>
          {i > 0 ? <Hair /> : null}
          {ch}
        </Fragment>
      ))}
    </View>
  );
}

function InputRow({
  label,
  value,
  onChangeText,
  max,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  max?: number;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  const c = useResumeColors();
  const noCaps = keyboardType === "email-address" || keyboardType === "url";
  return (
    <View className="min-h-[46px] flex-row items-center px-4">
      <Text className={`w-24 text-[15px] ${INK}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={max}
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        keyboardType={keyboardType}
        autoCapitalize={noCaps ? "none" : "sentences"}
        autoCorrect={!noCaps}
        className={`flex-1 py-3 text-[15px] ${INK}`}
      />
    </View>
  );
}

function AreaRow({
  label,
  value,
  onChangeText,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  max?: number;
  placeholder?: string;
}) {
  const c = useResumeColors();
  return (
    <View className="px-4 pb-1.5 pt-2.5">
      <Text className={`mb-0.5 text-[13px] ${MUTED}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={max}
        multiline
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        textAlignVertical="top"
        className={`min-h-[56px] pb-2 pt-1 text-[15px] ${INK}`}
      />
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  destructive,
  disabled,
  center,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  center?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-[46px] justify-center px-4 active:bg-black/5 dark:active:bg-white/10 ${
        center ? "items-center" : ""
      } ${disabled ? "opacity-40" : ""}`}
    >
      <Text className={`text-[16px] ${destructive ? DANGER : BRAND}`}>{label}</Text>
    </Pressable>
  );
}

function BulletsBlock({
  bullets,
  onChange,
  onAdd,
  onRemove,
}: {
  bullets: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  const c = useResumeColors();
  return (
    <View>
      {bullets.map((b, i) => (
        <View key={i}>
          <View className="flex-row items-start px-4">
            <Text className={`w-[18px] pt-[9px] text-[18px] ${MUTED}`}>•</Text>
            <TextInput
              value={b}
              onChangeText={(v) => onChange(i, v)}
              maxLength={600}
              multiline
              placeholder="What did you do? Add numbers."
              placeholderTextColor={c.placeholder}
              className={`min-h-[44px] flex-1 py-2.5 text-[15px] ${INK}`}
            />
            <Pressable onPress={() => onRemove(i)} hitSlop={10} className="pl-2.5 pt-3">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] dark:bg-[#FF453A]">
                <View className="h-[2px] w-2.5 rounded-full bg-white" />
              </View>
            </Pressable>
          </View>
          <Hair />
        </View>
      ))}
      <ActionRow label="Add bullet" onPress={onAdd} disabled={bullets.length >= LIMITS.bullets} />
    </View>
  );
}

function SectionBlock({
  title,
  onTitle,
  count,
  collapsed,
  onToggle,
  onMenu,
  children,
}: {
  title: string;
  onTitle: (v: string) => void;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onMenu?: () => void;
  children: ReactNode;
}) {
  const c = useResumeColors();
  return (
    <View className="mt-7">
      <View className="mb-2 flex-row items-center px-5">
        <Pressable onPress={onToggle} hitSlop={12} className="w-6 items-start justify-center">
          <Text className={`text-[22px] leading-[24px] ${MUTED} ${collapsed ? "" : "rotate-90"}`}>
            ›
          </Text>
        </Pressable>
        <TextInput
          value={title}
          onChangeText={onTitle}
          maxLength={60}
          placeholder="Section title"
          placeholderTextColor={c.placeholder}
          returnKeyType="done"
          className={`flex-1 py-0.5 text-[22px] font-bold ${INK}`}
        />
        {collapsed ? (
          <View className="ml-2 min-w-[22px] items-center rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/15">
            <Text className={`text-[12px] font-semibold ${MUTED}`}>{count}</Text>
          </View>
        ) : null}
        {onMenu ? (
          <Pressable onPress={onMenu} hitSlop={12} className="pl-3.5">
            <Text className={`text-[24px] font-bold leading-[26px] ${BRAND}`}>⋯</Text>
          </Pressable>
        ) : null}
      </View>
      {!collapsed ? <View className="px-4">{children}</View> : null}
    </View>
  );
}

const Entry = ({ children }: { children: ReactNode }) => <View className="mb-3">{children}</View>;

const PROFILE_PHOTO = "profile";

function PhotoRow({
  avatarUrl,
  on,
  onToggle,
  onGoProfile,
}: {
  avatarUrl?: string | null;
  on: boolean;
  onToggle: (v: boolean) => void;
  onGoProfile: () => void;
}) {
  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" }}
          />
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" }} />
        )}
        <View className="ml-3 flex-1">
          <Text className={`text-[16px] ${INK}`}>Profile photo</Text>
          <Text className={`mt-0.5 text-[13px] leading-[18px] ${MUTED}`}>
            {avatarUrl
              ? "Shown in the header of this template."
              : "You haven't added a profile photo yet."}
          </Text>
        </View>
        {avatarUrl ? <Switch value={on} onValueChange={onToggle} /> : null}
      </View>
      <Pressable onPress={onGoProfile} hitSlop={8} className="mt-2.5">
        <Text className={`text-[15px] ${BRAND}`}>
          {avatarUrl ? "Change photo in Profile" : "Add photo in Profile"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ResumeEditScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url;
  const [resumeId, setResumeId] = useState<string | undefined>(route.params.resumeId);
  const [templateId, setTemplateId] = useState<string | undefined>(route.params.templateId);
  const [title, setTitle] = useState(route.params.title ?? "My resume");
  const [data, setData] = useState<ResumeData | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<Menu>(null);
  const [orderSheet, setOrderSheet] = useState(false);
  const dirty = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (!dirty.current) return;
        e.preventDefault();
        Alert.alert("Discard changes?", "Your edits haven't been saved.", [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]);
      }),
    [navigation],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (route.params.resumeId) {
        const r = await resumeService.get(route.params.resumeId);
        setData(normalize(r.data));
        setTitle(r.title);
        setTemplateId(r.template_id);
        resumeService
          .templateData(r.template_id)
          .then((t) => setHasPhoto(!!t.hasPhoto))
          .catch(() => undefined);
      } else if (route.params.templateId) {
        const t = await resumeService.templateData(route.params.templateId);
        const mode = route.params.mode ?? "blank";

        let d = clone(route.params.initialData ?? (mode === "sample" ? t.sampleData : t.emptyData));
        if (mode === "profile" && !route.params.initialData) {
          d.basics.name = user?.user_metadata?.full_name ?? "";
          d.basics.email = user?.email ?? "";
        }
        setHasPhoto(!!t.hasPhoto);

        if (t.hasPhoto && avatarUrl && (mode === "profile" || route.params.initialData)) {
          d.basics.photo = PROFILE_PHOTO;
        }
        setData(normalize(d));
        setTitle(route.params.title ?? `${t.name} resume`);
      } else {
        setError("No template or resume selected.");
      }
    } catch (e) {
      setError(apiError(e, "Couldn't load the resume."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edit = (fn: (d: ResumeData) => void) => {
    dirty.current = true;
    setData((d) => {
      if (!d) return d;
      const next = clone(d);
      fn(next);
      return next;
    });
  };

  const toggle = (key: string) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));
  const addItem = (key: ListKey) =>
    edit((d) => {
      (d[key] as any[]).push(clone(BLANK[key]));
    });
  const removeItem = (key: ListKey, i: number) =>
    edit((d) => {
      (d[key] as any[]).splice(i, 1);
    });

  const addSection = (name: string) => {
    if ((data?.customSections?.length ?? 0) >= LIMITS.sections) {
      Alert.alert("Limit reached", `You can add up to ${LIMITS.sections} extra sections.`);
      return;
    }
    edit((d: any) => {
      d.customSections!.push({ id: newId(), title: name, entries: [blankEntry()] });
    });
    setTimeout(() => 150);
  };

  const deleteSection = (i: number) =>
    Alert.alert("Delete section?", "This section and its entries will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          edit((d) => {
            d.customSections!.splice(i, 1);
          }),
      },
    ]);

  const applyOrder = (keys: string[]) => {
    edit((d: any) => {
      d.sectionOrder = mergeOrder(d, keys);
    });
    setOrderSheet(false);
  };

  const save = async (): Promise<string | null> => {
    if (!data) return null;
    setSaving(true);
    try {
      const payload = { title: title.trim() || "Untitled resume", data: prune(data) };
      let id = resumeId;
      if (id) {
        await resumeService.update(id, payload);
      } else {
        if (!templateId) throw new Error("Template missing");
        id = (await resumeService.create({ templateId, ...payload })).id;
        setResumeId(id);
      }
      dirty.current = false;
      return id;
    } catch (e) {
      Alert.alert("Couldn't save", apiError(e, "Please try again."));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (await save()) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
  };

  const onPreview = async () => {
    const id = await save();
    if (id) navigation.replace("ResumePreview", { resumeId: id, title: title.trim() || "Resume" });
  };

  const sheetActions: SheetAction[] =
    menu?.type === "add"
      ? [
          ...PRESETS.map((p) => ({ label: p, onPress: () => addSection(p) })),
          { label: "Custom section", onPress: () => addSection("New Section") },
        ]
      : menu?.type === "section"
        ? (() => {
            const i = menu.index;
            return [
              { label: "Delete section", destructive: true, onPress: () => deleteSection(i) },
            ] as SheetAction[];
          })()
        : [];

  const renderBlock = (key: string, doc: ResumeData): ReactNode => {
    const T = doc.sectionTitles ?? {};

    if (key === "education") {
      return (
        <SectionBlock
          title={T.education ?? ""}
          onTitle={(v) =>
            edit((d) => {
              d.sectionTitles!.education = v;
            })
          }
          count={doc.education.length}
          collapsed={!!collapsed.education}
          onToggle={() => toggle("education")}
        >
          {doc.education.map((e, i) => (
            <Entry key={i}>
              <Card>
                <InputRow
                  label="School"
                  value={e.school}
                  max={150}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.education[i].school = v;
                    })
                  }
                />
                <InputRow
                  label="Degree"
                  value={e.degree}
                  max={200}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.education[i].degree = v;
                    })
                  }
                />
                <InputRow
                  label="Location"
                  value={e.location}
                  max={100}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.education[i].location = v;
                    })
                  }
                />
                <InputRow
                  label="Date"
                  value={e.date}
                  max={60}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.education[i].date = v;
                    })
                  }
                />
                <AreaRow
                  label="Relevant coursework"
                  value={e.coursework}
                  max={500}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.education[i].coursework = v;
                    })
                  }
                />
                <ActionRow
                  center
                  label="Delete entry"
                  destructive
                  onPress={() => removeItem("education", i)}
                />
              </Card>
            </Entry>
          ))}
          <Card>
            <ActionRow
              label="＋  Add education"
              onPress={() => addItem("education")}
              disabled={doc.education.length >= LIMITS.education}
            />
          </Card>
        </SectionBlock>
      );
    }

    if (key === "experience") {
      return (
        <SectionBlock
          title={T.experience ?? ""}
          onTitle={(v) =>
            edit((d) => {
              d.sectionTitles!.experience = v;
            })
          }
          count={doc.experience.length}
          collapsed={!!collapsed.experience}
          onToggle={() => toggle("experience")}
        >
          {doc.experience.map((x, i) => (
            <Entry key={i}>
              <Card>
                <InputRow
                  label="Company"
                  value={x.company}
                  max={150}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.experience[i].company = v;
                    })
                  }
                />
                <InputRow
                  label="Role"
                  value={x.role}
                  max={150}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.experience[i].role = v;
                    })
                  }
                />
                <InputRow
                  label="Location"
                  value={x.location}
                  max={100}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.experience[i].location = v;
                    })
                  }
                />
                <InputRow
                  label="Start"
                  value={x.startDate}
                  max={40}
                  placeholder="Jan 2024"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.experience[i].startDate = v;
                    })
                  }
                />
                <InputRow
                  label="End"
                  value={x.endDate}
                  max={40}
                  placeholder="Present"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.experience[i].endDate = v;
                    })
                  }
                />
                <BulletsBlock
                  bullets={x.bullets}
                  onChange={(bi, v) =>
                    edit((d) => {
                      d.experience[i].bullets[bi] = v;
                    })
                  }
                  onAdd={() =>
                    edit((d) => {
                      d.experience[i].bullets.push("");
                    })
                  }
                  onRemove={(bi) =>
                    edit((d) => {
                      d.experience[i].bullets.splice(bi, 1);
                    })
                  }
                />
                <ActionRow
                  center
                  label="Delete entry"
                  destructive
                  onPress={() => removeItem("experience", i)}
                />
              </Card>
            </Entry>
          ))}
          <Card>
            <ActionRow
              label="＋  Add experience"
              onPress={() => addItem("experience")}
              disabled={doc.experience.length >= LIMITS.experience}
            />
          </Card>
        </SectionBlock>
      );
    }

    if (key === "projects") {
      return (
        <SectionBlock
          title={T.projects ?? ""}
          onTitle={(v) =>
            edit((d) => {
              d.sectionTitles!.projects = v;
            })
          }
          count={doc.projects.length}
          collapsed={!!collapsed.projects}
          onToggle={() => toggle("projects")}
        >
          {doc.projects.map((p, i) => (
            <Entry key={i}>
              <Card>
                <InputRow
                  label="Name"
                  value={p.name}
                  max={150}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.projects[i].name = v;
                    })
                  }
                />
                <InputRow
                  label="Tech stack"
                  value={p.tech}
                  max={300}
                  placeholder="React Native, Node.js"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.projects[i].tech = v;
                    })
                  }
                />
                <BulletsBlock
                  bullets={p.bullets}
                  onChange={(bi, v) =>
                    edit((d) => {
                      d.projects[i].bullets[bi] = v;
                    })
                  }
                  onAdd={() =>
                    edit((d) => {
                      d.projects[i].bullets.push("");
                    })
                  }
                  onRemove={(bi) =>
                    edit((d) => {
                      d.projects[i].bullets.splice(bi, 1);
                    })
                  }
                />
                <ActionRow
                  center
                  label="Delete entry"
                  destructive
                  onPress={() => removeItem("projects", i)}
                />
              </Card>
            </Entry>
          ))}
          <Card>
            <ActionRow
              label="＋  Add project"
              onPress={() => addItem("projects")}
              disabled={doc.projects.length >= LIMITS.projects}
            />
          </Card>
        </SectionBlock>
      );
    }

    if (key === "skills") {
      return (
        <SectionBlock
          title={T.skills ?? ""}
          onTitle={(v) =>
            edit((d) => {
              d.sectionTitles!.skills = v;
            })
          }
          count={doc.skills.length}
          collapsed={!!collapsed.skills}
          onToggle={() => toggle("skills")}
        >
          {doc.skills.map((s, i) => (
            <Entry key={i}>
              <Card>
                <InputRow
                  label="Label"
                  value={s.label}
                  max={60}
                  placeholder="Languages"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.skills[i].label = v;
                    })
                  }
                />
                <AreaRow
                  label="Items"
                  value={s.items}
                  max={800}
                  placeholder="TypeScript, Python, Go"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.skills[i].items = v;
                    })
                  }
                />
                <ActionRow
                  center
                  label="Delete group"
                  destructive
                  onPress={() => removeItem("skills", i)}
                />
              </Card>
            </Entry>
          ))}
          <Card>
            <ActionRow
              label="＋  Add skill group"
              onPress={() => addItem("skills")}
              disabled={doc.skills.length >= LIMITS.skills}
            />
          </Card>
        </SectionBlock>
      );
    }

    const si = (doc.customSections ?? []).findIndex((s: any, i) => customKey(s.id, i) === key);
    if (si < 0) return null;
    const s = doc.customSections![si] as any;
    const ckey = `c${s.id ?? si}`;
    return (
      <SectionBlock
        title={s.title}
        onTitle={(v) =>
          edit((d) => {
            d.customSections![si].title = v;
          })
        }
        count={s.entries.length}
        collapsed={!!collapsed[ckey]}
        onToggle={() => toggle(ckey)}
        onMenu={() => setMenu({ type: "section", index: si })}
      >
        {s.entries.map((e: any, ei: any) => (
          <Entry key={ei}>
            <Card>
              <InputRow
                label="Heading"
                value={e.heading}
                max={150}
                onChangeText={(v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].heading = v;
                  })
                }
              />
              <InputRow
                label="Subheading"
                value={e.subheading}
                max={150}
                onChangeText={(v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].subheading = v;
                  })
                }
              />
              <InputRow
                label="Date"
                value={e.date}
                max={60}
                onChangeText={(v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].date = v;
                  })
                }
              />
              <InputRow
                label="Location"
                value={e.location}
                max={100}
                onChangeText={(v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].location = v;
                  })
                }
              />
              <AreaRow
                label="Description"
                value={e.text}
                max={1000}
                onChangeText={(v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].text = v;
                  })
                }
              />
              <BulletsBlock
                bullets={e.bullets}
                onChange={(bi, v) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].bullets[bi] = v;
                  })
                }
                onAdd={() =>
                  edit((d) => {
                    d.customSections![si].entries[ei].bullets.push("");
                  })
                }
                onRemove={(bi) =>
                  edit((d) => {
                    d.customSections![si].entries[ei].bullets.splice(bi, 1);
                  })
                }
              />
              <ActionRow
                center
                label="Delete entry"
                destructive
                onPress={() =>
                  edit((d) => {
                    d.customSections![si].entries.splice(ei, 1);
                  })
                }
              />
            </Card>
          </Entry>
        ))}
        <Card>
          <ActionRow
            label="＋  Add entry"
            onPress={() =>
              edit((d) => {
                d.customSections![si].entries.push(blankEntry());
              })
            }
            disabled={s.entries.length >= LIMITS.entries}
          />
        </Card>
      </SectionBlock>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={["top", "bottom"]}>
      <NavBar
        title="Edit resume"
        onBack={() => navigation.goBack()}
        right={
          flash ? (
            <Text className={`text-[15px] ${MUTED}`}>Saved ✓</Text>
          ) : (
            <NavText label="Save" bold onPress={onSave} disabled={saving || !data} />
          )
        }
      />

      {loading ? (
        <CenterState loading />
      ) : error || !data ? (
        <CenterState message={error ?? "Something went wrong."} onRetry={load} />
      ) : (
        <View className="flex-1">
          <ScrollView
            ref={scrollRef as any}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="px-4">
              <Card>
                <InputRow
                  label="Name"
                  value={title}
                  max={120}
                  placeholder="My resume"
                  onChangeText={(v) => {
                    dirty.current = true;
                    setTitle(v);
                  }}
                />
              </Card>
              <Text className={`mx-1 mt-2 text-[13px] leading-[18px] ${MUTED}`}>
                Tip: tap any section title to rename it. Sections ki order neeche "Section order" se
                badlein.
              </Text>
            </View>

            <View className="mt-5 px-4">
              <Card>
                <ActionRow label="Reorder sections" onPress={() => setOrderSheet(true)} />
                <ActionRow label="AI section suggestions" onPress={() => setOrderSheet(true)} />
              </Card>
              <Text className={`mx-1 mt-2 text-[13px] leading-[18px] ${MUTED}`}>
                Sections below move as you change the order, and the PDF follows the same order.
              </Text>
            </View>

            <View className="mb-2 mt-7 px-5">
              <Text className={`text-[22px] font-bold ${INK}`}>Basics</Text>
            </View>
            <View className="px-4">
              <Card>
                <InputRow
                  label="Full name"
                  value={data.basics.name}
                  max={100}
                  onChangeText={(v) =>
                    edit((d) => {
                      d.basics.name = v;
                    })
                  }
                />
                <InputRow
                  label="Phone"
                  value={data.basics.phone}
                  max={40}
                  keyboardType="phone-pad"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.basics.phone = v;
                    })
                  }
                />
                <InputRow
                  label="Email"
                  value={data.basics.email}
                  max={120}
                  keyboardType="email-address"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.basics.email = v;
                    })
                  }
                />
                <InputRow
                  label="LinkedIn"
                  value={data.basics.linkedin}
                  max={200}
                  keyboardType="url"
                  placeholder="linkedin.com/in/you"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.basics.linkedin = v;
                    })
                  }
                />
                <InputRow
                  label="GitHub"
                  value={data.basics.github}
                  max={200}
                  keyboardType="url"
                  placeholder="github.com/you"
                  onChangeText={(v) =>
                    edit((d) => {
                      d.basics.github = v;
                    })
                  }
                />
              </Card>
              {hasPhoto ? (
                <Card className="mt-3">
                  <PhotoRow
                    avatarUrl={avatarUrl}
                    on={!!data.basics.photo}
                    onToggle={(v) =>
                      edit((d) => {
                        d.basics.photo = v ? PROFILE_PHOTO : "";
                      })
                    }
                    onGoProfile={() => navigation.navigate("Tabs", { screen: "Profile" })}
                  />
                </Card>
              ) : null}
            </View>

            {orderedKeys(data).map((k) => (
              <Fragment key={k}>{renderBlock(k, data)}</Fragment>
            ))}

            <View className="mt-8 px-4">
              <Card>
                <ActionRow label="＋  Add section" onPress={() => setMenu({ type: "add" })} />
              </Card>
            </View>
          </ScrollView>

          <View className="border-t border-[#C6C6C8] bg-[#F2F2F7] px-4 pb-2 pt-2 dark:border-[#38383A] dark:bg-black">
            <Button label="Save & Preview" onPress={onPreview} loading={saving} />
          </View>
        </View>
      )}

      <Sheet
        visible={!!menu}
        title={menu?.type === "add" ? "Add section" : "Section options"}
        actions={sheetActions}
        onClose={() => setMenu(null)}
      />

      <SectionOrderSheet
        visible={orderSheet}
        items={data ? buildItems(data, true) : []}
        onClose={() => setOrderSheet(false)}
        onApply={applyOrder}
        suggest={data ? (target: any) => suggestSectionOrder(prune(data), target) : undefined}
      />
    </SafeAreaView>
  );
}
