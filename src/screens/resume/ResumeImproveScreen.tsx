import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppStackParamList } from "../../types/navigation";
import type { ResumeData } from "../../types/resume";
import type { AtsResult } from "../../services/atsService";
import { rescoreResume } from "../../services/importService";
import { addKeywords, replaceLine } from "../../utils/applySuggestion";
import { getErrorMessage } from "../../services/apiClient";
import { Button, NavBar, useResumeColors } from "../../components/resume/ResumeUI";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeImprove">;

const INK = "text-ink dark:text-ink-dark";
const MUTED = "text-muted dark:text-muted-dark";
const scoreColor = (n: number) => (n >= 80 ? "#34C759" : n >= 60 ? "#FF9500" : "#FF3B30");
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function Section({
  title,
  icon,
  children,
  hint,
}: {
  title: string;
  icon: string;
  children: ReactNode;
  hint?: string;
}) {
  const c = useResumeColors();
  return (
    <View className="mt-5">
      <View className="mb-2 flex-row items-center px-1">
        <Ionicons name={icon} size={18} color={c.brand} />
        <Text className={`ml-2 text-[18px] font-bold ${INK}`}>{title}</Text>
      </View>
      {hint ? <Text className={`mb-2 px-1 text-[13px] ${MUTED}`}>{hint}</Text> : null}
      <View className="overflow-hidden rounded-[14px] bg-white p-4 dark:bg-[#1C1C1E]">
        {children}
      </View>
    </View>
  );
}
const Divider = () => <View className="my-3 h-[0.5px] bg-[#C6C6C8] dark:bg-[#38383A]" />;

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const c = useResumeColors();
  return (
    <View className="mb-3">
      <Text className={`mb-1 text-[12px] uppercase tracking-[0.3px] ${MUTED}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={c.placeholder}
        className={`rounded-lg bg-[#F2F2F7] px-3 py-2.5 text-[15px] dark:bg-[#2C2C2E] ${INK}`}
        style={multiline ? { minHeight: 64, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

type Suggestion = {
  key: string;
  kind: "rewrite" | "grammar";
  original: string;
  improved: string;
  why: string;
};

export default function ResumeImproveScreen({ navigation, route }: Props) {
  const c = useResumeColors();
  const { stack, source, fileName } = route.params;
  const [data, setData] = useState<ResumeData>(route.params.data);
  const [result, setResult] = useState<AtsResult>(route.params.result);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const startScore = useRef(route.params.result.score).current;
  const fullBreakdown = useRef(route.params.result.breakdown);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const suggestions: Suggestion[] = [
    ...result.ai.rewrites.map((r, i) => ({
      key: `r${i}`,
      kind: "rewrite" as const,
      original: r.original,
      improved: r.improved,
      why: r.why,
    })),
    ...result.ai.grammar.map((g, i) => ({
      key: `g${i}`,
      kind: "grammar" as const,
      original: g.original,
      improved: g.suggestion,
      why: g.reason,
    })),
  ];
  const pending = suggestions.filter((s) => !applied[s.key]).length;
  const failed = result.checks.filter((k) => !k.passed);
  const delta = result.score - startScore;

  const scheduleQuick = useCallback(
    (next: ResumeData) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const id = ++seq.current;
        try {
          const r = await rescoreResume(next, { stack, quick: true, prev: fullBreakdown.current });
          if (id === seq.current) setResult((old) => ({ ...old, ...r, ai: old.ai }));
        } catch {}
      }, 600);
    },
    [stack],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (next: ResumeData) => {
    setData(next);
    scheduleQuick(next);
  };
  const edit = (fn: (d: ResumeData) => void) => {
    const d = clone(data);
    fn(d);
    commit(d);
  };

  const apply = (s: Suggestion) => {
    const text = (drafts[s.key] ?? s.improved).trim();
    const next = replaceLine(data, s.original, text);
    if (!next) {
      Alert.alert(
        "Couldn't find that line",
        "It may already be changed. You can edit it manually below.",
      );
      setShowEdit(true);
      return;
    }
    commit(next);
    setApplied((a) => ({ ...a, [s.key]: true }));
  };

  const addKw = (kws: string[]) => {
    const next = addKeywords(data, kws);
    if (!next)
      return Alert.alert(
        "Nothing to add",
        "Those keywords are already in your skills or the skills section is full.",
      );
    commit(next);
    setResult((r) => ({
      ...r,
      ai: { ...r.ai, missingKeywords: r.ai.missingKeywords.filter((k) => !kws.includes(k)) },
    }));
  };

  const fullRecheck = async () => {
    setBusy(true);
    try {
      const r = await rescoreResume(data, { stack, quick: false });
      fullBreakdown.current = r.breakdown;
      setResult(r);
      setApplied({});
      setDrafts({});
    } catch (e: any) {
      Alert.alert("Re-check failed", getErrorMessage(e, e?.message || "Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const next = () =>
    navigation.navigate("ResumePickTemplate", {
      data,
      title: data.basics.name ? `${data.basics.name} resume` : "Imported resume",
    });

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={["top", "bottom"]}>
      <NavBar title="Improve resume" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center rounded-[14px] bg-white px-4 py-6 dark:bg-[#1C1C1E]">
          <View
            className="h-[120px] w-[120px] items-center justify-center rounded-full"
            style={{ borderWidth: 9, borderColor: scoreColor(result.score) }}
          >
            <Text style={{ fontSize: 38, fontWeight: "700", color: scoreColor(result.score) }}>
              {result.score}
            </Text>
            <Text className={`text-[12px] ${MUTED}`}>ATS score</Text>
          </View>
          <Text className={`mt-3 text-[20px] font-bold ${INK}`}>
            {result.verdict}
            {delta !== 0 ? (
              <Text
                style={{ color: delta > 0 ? "#34C759" : "#FF3B30" }}
              >{`  ${delta > 0 ? "+" : ""}${delta}`}</Text>
            ) : null}
          </Text>
          <Text className={`mt-2 text-center text-[14px] leading-[20px] ${MUTED}`}>
            {result.ai.summary}
          </Text>
          <Text className={`mt-3 text-center text-[12px] ${MUTED}`}>
            {fileName ? `${fileName} · ` : ""}
            {source === "ai"
              ? "Read by AI"
              : "Read with basic rules. Please check the fields below."}
          </Text>
        </View>

        <Section
          title={`Suggestions${pending ? ` (${pending})` : ""}`}
          icon="sparkles-outline"
          hint="Edit the text if you like, then tap Apply. Your score updates."
        >
          {suggestions.length === 0 ? (
            <Text className={`text-[15px] ${MUTED}`}>No line-level suggestions. Nice work.</Text>
          ) : (
            suggestions.map((s, i) => (
              <View key={s.key}>
                {i > 0 ? <Divider /> : null}
                <Text className={`text-[11px] font-semibold uppercase ${MUTED}`}>
                  {s.kind === "rewrite" ? "Stronger wording" : "Grammar"}
                </Text>
                <Text
                  className={`mt-1 text-[14px] leading-[20px] ${MUTED}`}
                  style={{ textDecorationLine: "line-through" }}
                >
                  {s.original}
                </Text>
                <TextInput
                  value={drafts[s.key] ?? s.improved}
                  onChangeText={(t) => setDrafts((d) => ({ ...d, [s.key]: t }))}
                  multiline
                  editable={!applied[s.key]}
                  className={`mt-2 rounded-lg bg-[#F2F2F7] px-3 py-2.5 text-[15px] leading-[21px] dark:bg-[#2C2C2E] ${INK}`}
                />
                <Text className={`mt-1.5 text-[13px] ${MUTED}`}>{s.why}</Text>
                <View className="mt-2 flex-row justify-end">
                  {applied[s.key] ? (
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                      <Text className="ml-1 text-[14px] font-semibold text-[#34C759]">Applied</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => apply(s)}
                      className="rounded-full bg-brand px-4 py-1.5 active:opacity-70 dark:bg-brand-dark"
                    >
                      <Text className="text-[14px] font-semibold text-white">Apply</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </Section>

        {result.ai.missingKeywords.length > 0 ? (
          <Section
            title="Missing keywords"
            icon="key-outline"
            hint="Tap one to add it to your skills."
          >
            <View className="flex-row flex-wrap">
              {result.ai.missingKeywords.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => addKw([k])}
                  className="m-1 flex-row items-center rounded-full bg-brand/10 px-3 py-1.5 dark:bg-brand-dark/20"
                >
                  <Ionicons name="add" size={14} color={c.brand} />
                  <Text className="ml-0.5 text-[13px] font-semibold text-brand dark:text-brand-dark">
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => addKw(result.ai.missingKeywords)}
              className="mt-2 self-start px-1 py-1"
            >
              <Text className="text-[14px] font-semibold text-brand dark:text-brand-dark">
                Add all
              </Text>
            </Pressable>
          </Section>
        ) : null}

        {failed.length + result.ai.mistakes.length > 0 ? (
          <Section title="To fix by hand" icon="construct-outline">
            {failed.map((k, i) => (
              <View key={k.id}>
                {i > 0 ? <Divider /> : null}
                <Text className={`text-[15px] font-semibold ${INK}`}>{k.label}</Text>
                <Text className={`mt-0.5 text-[14px] leading-[20px] ${MUTED}`}>{k.tip}</Text>
              </View>
            ))}
            {result.ai.mistakes.map((m, i) => (
              <View key={`m${i}`}>
                {failed.length + i > 0 ? <Divider /> : null}
                <Text className={`text-[12px] font-semibold uppercase ${MUTED}`}>{m.section}</Text>
                <Text className={`mt-0.5 text-[15px] ${INK}`}>{m.issue}</Text>
                <Text
                  className={`mt-0.5 text-[14px] leading-[20px] text-brand dark:text-brand-dark`}
                >
                  {m.fix}
                </Text>
              </View>
            ))}
          </Section>
        ) : null}

        <Pressable
          onPress={() => setShowEdit((v) => !v)}
          className="mt-5 flex-row items-center px-1"
        >
          <Ionicons name="create-outline" size={18} color={c.brand} />
          <Text className={`ml-2 flex-1 text-[18px] font-bold ${INK}`}>Edit resume text</Text>
          <Ionicons name={showEdit ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
        </Pressable>
        {showEdit ? (
          <View className="mt-2 rounded-[14px] bg-white p-4 dark:bg-[#1C1C1E]">
            <Field
              label="Name"
              value={data.basics.name}
              onChange={(v) => edit((d) => (d.basics.name = v))}
            />
            <Field
              label="Email"
              value={data.basics.email}
              onChange={(v) => edit((d) => (d.basics.email = v))}
            />
            <Field
              label="Phone"
              value={data.basics.phone}
              onChange={(v) => edit((d) => (d.basics.phone = v))}
            />
            <Field
              label="LinkedIn"
              value={data.basics.linkedin}
              onChange={(v) => edit((d) => (d.basics.linkedin = v))}
            />
            <Field
              label="GitHub"
              value={data.basics.github}
              onChange={(v) => edit((d) => (d.basics.github = v))}
            />

            {data.experience.map((e, i) => (
              <View key={`e${i}`}>
                <Divider />
                <Text className={`mb-2 text-[15px] font-bold ${INK}`}>
                  {e.company || "Experience"}
                  {e.role ? ` · ${e.role}` : ""}
                </Text>
                {e.bullets.map((b, j) => (
                  <Field
                    key={j}
                    label={`Bullet ${j + 1}`}
                    value={b}
                    multiline
                    onChange={(v) => edit((d) => (d.experience[i].bullets[j] = v))}
                  />
                ))}
              </View>
            ))}
            {data.projects.map((p, i) => (
              <View key={`p${i}`}>
                <Divider />
                <Text className={`mb-2 text-[15px] font-bold ${INK}`}>{p.name || "Project"}</Text>
                {p.bullets.map((b, j) => (
                  <Field
                    key={j}
                    label={`Bullet ${j + 1}`}
                    value={b}
                    multiline
                    onChange={(v) => edit((d) => (d.projects[i].bullets[j] = v))}
                  />
                ))}
              </View>
            ))}
            {data.skills.map((s, i) => (
              <View key={`s${i}`}>
                <Divider />
                <Field
                  label={s.label || "Skills"}
                  value={s.items}
                  multiline
                  onChange={(v) => edit((d) => (d.skills[i].items = v))}
                />
              </View>
            ))}
            <Text className={`mt-1 text-[12px] ${MUTED}`}>
              You can change everything else (education, extra sections, order) in the full editor
              after choosing a template.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-[#C6C6C8] bg-[#F2F2F7] px-4 pb-6 pt-3 dark:border-[#38383A] dark:bg-black">
        <Button label="Choose a template" onPress={next} />
        <View className="mt-2">
          <Button
            label="Re-check with AI"
            variant="secondary"
            onPress={fullRecheck}
            loading={busy}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
