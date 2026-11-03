import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types/navigation";
import { StartMode } from "../../types/resume";
import { apiCode, apiError, resumeService } from "../../services/resumeService";

import { Button, Caption, Group, NavBar, useResumeColors } from "../../components/resume/ResumeUI";
import TemplateThumb from "../../components/resume/TemplateThumb";
import AnalyzingPenguin from "../../components/resume/AnalyzingPenguin";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeStart">;
type Mode = StartMode | "ai";

const OPTIONS: { mode: Mode; title: string; subtitle: string }[] = [
  {
    mode: "ai",
    title: "Write it with AI",
    subtitle: "Tell us your role and experience. AI drafts it, you edit.",
  },
  {
    mode: "blank",
    title: "Start from scratch",
    subtitle: "Empty fields. You fill everything yourself.",
  },
  { mode: "sample", title: "Use sample content", subtitle: "A filled-in example you can edit." },
  {
    mode: "profile",
    title: "Use my profile",
    subtitle: "Name, email and profile photo from your account.",
  },
];

export default function ResumeStartScreen({ navigation, route }: Props) {
  const { templateId } = route.params;
  const c = useResumeColors();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>("ai");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("My resume");
  const [titleTouched, setTitleTouched] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [years, setYears] = useState(1);
  const [skills, setSkills] = useState("");
  const [degree, setDegree] = useState("");
  const [jobErr, setJobErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    resumeService
      .templateData(templateId)
      .then((t) => {
        setName(t.name);
        setTitle((old) => (titleTouched ? old : `${t.name} resume`));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (busyRef.current) e.preventDefault();
      }),
    [navigation],
  );

  const thumbW = Math.min(Math.round(width * 0.5), 220);

  const setBusyBoth = (v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  };

  const onGenerateError = (e: unknown) => {
    if (apiCode(e) === "TEMPLATE_LOCKED") {
      Alert.alert(
        "Template locked",
        "Watch the ads for this template in the Templates tab first.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
    if (apiCode(e) === "AI_UNAVAILABLE") {
      Alert.alert(
        "AI is busy",
        "The AI writer is not available right now. Please try again in a few minutes.",
      );
      return;
    }
    Alert.alert("Couldn't write the resume", apiError(e, "Please try again."));
  };

  const generate = async () => {
    const role = jobTitle.trim();
    if (role.length < 2) {
      setJobErr("Enter the job title you are applying for.");
      return;
    }
    setJobErr(null);
    setBusyBoth(true);
    try {
      const r = await resumeService.generate({
        templateId,
        title: titleTouched ? title.trim() || undefined : undefined,
        jobTitle: role,
        yearsOfExperience: years,
        skills: skills.trim() || undefined,
        degree: degree.trim() || undefined,
      });
      setBusyBoth(false);
      navigation.replace("ResumeEditor", { resumeId: r.id, aiDraft: true });
    } catch (e) {
      setBusyBoth(false);
      onGenerateError(e);
    }
  };

  const onContinue = () => {
    if (mode === "ai") return generate();
    navigation.navigate("ResumeEditor", { templateId, mode, title: title.trim() || "My resume" });
  };

  if (busy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
        <AnalyzingPenguin />
      </SafeAreaView>
    );
  }

  const input = {
    fontSize: 17,
    color: c.ink,
    paddingHorizontal: 16,
    paddingVertical: 14,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
      <NavBar
        title={name || "New resume"}
        onBack={() => navigation.goBack()}
        backLabel="Templates"
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginTop: 8, marginBottom: 28 }}>
          <View
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: c.dark ? 0 : 0.18,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <TemplateThumb id={templateId} width={thumbW} />
          </View>
        </View>

        <Caption>How do you want to start?</Caption>
        <Group style={{ marginBottom: 24 }}>
          {OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.mode}
              activeOpacity={0.6}
              onPress={() => setMode(o.mode)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 17, color: c.ink }}>{o.title}</Text>
                <Text style={{ fontSize: 13, marginTop: 2, color: c.muted }}>{o.subtitle}</Text>
              </View>
              <View style={{ width: 24, alignItems: "flex-end" }}>
                {mode === o.mode ? (
                  <Text style={{ fontSize: 22, fontWeight: "700", color: c.brand }}>✓</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </Group>

        {mode === "ai" ? (
          <>
            <Caption>Job title</Caption>
            <Group style={{ marginBottom: jobErr ? 6 : 20 }}>
              <TextInput
                value={jobTitle}
                onChangeText={(v) => {
                  setJobTitle(v);
                  if (jobErr) setJobErr(null);
                }}
                maxLength={80}
                placeholder="e.g. React Native Developer"
                placeholderTextColor={c.placeholder}
                style={input}
              />
            </Group>
            {jobErr ? (
              <Text style={{ color: "#EF4444", fontSize: 13, marginLeft: 4, marginBottom: 20 }}>
                {jobErr}
              </Text>
            ) : null}

            <Caption>Years of experience</Caption>
            <Group style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ flex: 1, fontSize: 17, color: c.ink }}>
                  {years === 0
                    ? "Fresher (no experience)"
                    : years === 1
                      ? "1 year"
                      : `${years} years`}
                </Text>
                <Pressable
                  onPress={() => setYears((y) => Math.max(0, y - 1))}
                  hitSlop={8}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: c.sep,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22, color: c.ink, marginTop: -2 }}>−</Text>
                </Pressable>
                <Pressable
                  onPress={() => setYears((y) => Math.min(40, y + 1))}
                  hitSlop={8}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: c.sep,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 10,
                  }}
                >
                  <Text style={{ fontSize: 22, color: c.ink, marginTop: -2 }}>+</Text>
                </Pressable>
              </View>
            </Group>

            <Caption>Key skills (optional)</Caption>
            <Group style={{ marginBottom: 20 }}>
              <TextInput
                value={skills}
                onChangeText={setSkills}
                maxLength={300}
                placeholder="React Native, TypeScript, Redux"
                placeholderTextColor={c.placeholder}
                style={input}
              />
            </Group>

            <Caption>Degree (optional)</Caption>
            <Group style={{ marginBottom: 12 }}>
              <TextInput
                value={degree}
                onChangeText={setDegree}
                maxLength={120}
                placeholder="BS Computer Science"
                placeholderTextColor={c.placeholder}
                style={input}
              />
            </Group>

            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
                color: c.muted,
                marginHorizontal: 4,
                marginBottom: 24,
              }}
            >
              The AI writes a draft with example numbers and placeholder names. Review it and
              replace anything that is not true for you before you send it to anyone.
            </Text>
          </>
        ) : null}

        <Caption>Resume name</Caption>
        <Group>
          <TextInput
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setTitleTouched(true);
            }}
            maxLength={120}
            placeholder="My resume"
            placeholderTextColor={c.placeholder}
            style={input}
          />
        </Group>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Button label={mode === "ai" ? "Generate resume" : "Continue"} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
