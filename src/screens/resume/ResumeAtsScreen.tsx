import { ReactNode, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { pick, types } from "@react-native-documents/picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppStackParamList } from "../../types/navigation";
import { AtsResult, analyzeAts } from "../../services/atsService";
import { getErrorMessage } from "../../services/apiClient";
import { Button, NavBar, useResumeColors } from "../../components/resume/ResumeUI";
import ResumeAnalyzing from "../../components/resume/AnalyzingPenguin";
import { showInterstitial } from "../../services/rewardedAds";
import { adsService } from "../../services/adsService";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeAts">;
type PickedFile = { uri: string; name: string; size?: number | null };

const PREVIEW_LOADING = false;

const INK = "text-ink dark:text-ink-dark";
const MUTED = "text-muted dark:text-muted-dark";
const MAX_BYTES = 5 * 1024 * 1024;

const scoreColor = (n: number) => (n >= 80 ? "#34C759" : n >= 60 ? "#FF9500" : "#FF3B30");

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  const c = useResumeColors();
  return (
    <View className="mt-5">
      <View className="mb-2 flex-row items-center px-1">
        <Ionicons name={icon} size={18} color={c.brand} />
        <Text className={`ml-2 text-[18px] font-bold ${INK}`}>{title}</Text>
      </View>
      <View className="overflow-hidden rounded-[14px] bg-white p-4 dark:bg-[#1C1C1E]">
        {children}
      </View>
    </View>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View className="mb-3">
      <View className="mb-1 flex-row justify-between">
        <Text className={`text-[14px] ${INK}`}>{label}</Text>
        <Text className={`text-[14px] font-semibold ${INK}`}>{value}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <View
          style={{ width: `${value}%`, backgroundColor: scoreColor(value) }}
          className="h-2 rounded-full"
        />
      </View>
    </View>
  );
}

const Divider = () => <View className="my-3 h-[0.5px] bg-[#C6C6C8] dark:bg-[#38383A]" />;

function UploadCard({ file, onPress }: { file: PickedFile | null; onPress: () => void }) {
  const c = useResumeColors();
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-[14px] border-[1.5px] border-dashed border-[#C6C6C8] bg-white px-4 py-8 active:opacity-70 dark:border-[#38383A] dark:bg-[#1C1C1E]"
    >
      <Ionicons name={file ? "document-text" : "cloud-upload-outline"} size={40} color={c.brand} />
      <Text className={`mt-3 text-center text-[16px] font-semibold ${INK}`} numberOfLines={2}>
        {file ? file.name : "Choose your resume PDF"}
      </Text>
      <Text className={`mt-1 text-[13px] ${MUTED}`}>
        {file ? "Tap to change" : "PDF only, max 5 MB"}
      </Text>
    </Pressable>
  );
}

export default function ResumeAtsScreen({ navigation }: Props) {
  const c = useResumeColors();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const pending = useRef<AtsResult | null>(null);

  const choose = async () => {
    try {
      const [f] = await pick({ type: [types.pdf] });
      if (!f) return;
      if (f.size && f.size > MAX_BYTES) {
        Alert.alert("File too large", "PDF must be under 5 MB.");
        return;
      }
      setFile({ uri: f.uri, name: f.name ?? "resume.pdf", size: f.size });
    } catch (e: any) {
      if (!/cancel/i.test(String(e?.code ?? e?.message))) {
        Alert.alert("Couldn't open file", String(e?.message ?? e));
      }
    }
  };

  const run = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const analysisResult = await analyzeAts(file, stack.trim());
      setResult(analysisResult);

      try {
        const access = await adsService.access();

        if (access.showAds) {
          await showInterstitial();
        }
      } catch {}
    } catch (e: any) {
      Alert.alert("Analysis failed", getErrorMessage(e, e?.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const onAnalyzed = () => {
    setResult(pending.current);
    pending.current = null;
    setLoading(false);
    setApiDone(false);
  };

  const reset = () => {
    setResult(null);
    setFile(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={["top", "bottom"]}>
      <NavBar title="ATS Check" onBack={() => navigation.goBack()} />

      {loading || PREVIEW_LOADING ? (
        <ResumeAnalyzing done={apiDone} onComplete={onAnalyzed} />
      ) : !result ? (
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text className={`mb-1 mt-2 px-1 text-[28px] font-bold ${INK}`}>Check your resume</Text>
          <Text className={`mb-5 px-1 text-[15px] leading-[21px] ${MUTED}`}>
            Upload your PDF to get an ATS score out of 100, grammar fixes and improvements for your
            stack.
          </Text>

          <UploadCard file={file} onPress={choose} />

          <Text className={`mb-1.5 ml-1 mt-6 text-[13px] uppercase tracking-[0.3px] ${MUTED}`}>
            Target stack or role (optional)
          </Text>
          <View className="rounded-xl bg-white px-4 dark:bg-[#1C1C1E]">
            <TextInput
              value={stack}
              onChangeText={setStack}
              maxLength={200}
              placeholder="e.g. React Native, Node.js, MERN"
              placeholderTextColor={c.placeholder}
              className={`py-3.5 text-[16px] ${INK}`}
            />
          </View>
          <Text className={`ml-1 mt-2 text-[13px] ${MUTED}`}>
            Leave it empty and we'll detect your stack from the resume.
          </Text>

          <View className="mt-8">
            <Button label="Analyze resume" onPress={run} disabled={!file} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center rounded-[14px] bg-white px-4 py-6 dark:bg-[#1C1C1E]">
            <View
              className="h-[140px] w-[140px] items-center justify-center rounded-full"
              style={{ borderWidth: 10, borderColor: scoreColor(result.score) }}
            >
              <Text style={{ fontSize: 44, fontWeight: "700", color: scoreColor(result.score) }}>
                {result.score}
              </Text>
              <Text className={`text-[13px] ${MUTED}`}>out of 100</Text>
            </View>
            <Text className={`mt-4 text-[22px] font-bold ${INK}`}>{result.verdict}</Text>
            <Text className={`mt-2 text-center text-[15px] leading-[21px] ${MUTED}`}>
              {result.ai.summary}
            </Text>
            {result.ai.detectedStack.length > 0 ? (
              <View className="mt-4 flex-row flex-wrap justify-center">
                {result.ai.detectedStack.map((s) => (
                  <View
                    key={s}
                    className="m-1 rounded-full bg-brand/10 px-3 py-1 dark:bg-brand-dark/20"
                  >
                    <Text className="text-[13px] font-semibold text-brand dark:text-brand-dark">
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Section title="Score breakdown" icon="stats-chart-outline">
            <Bar label="ATS readability" value={result.breakdown.ats} />
            <Bar label="Grammar" value={result.breakdown.grammar} />
            <Bar label="Impact & results" value={result.breakdown.impact} />
            <Bar label="Stack fit" value={result.breakdown.stackFit} />
            <Bar label="Clarity" value={result.breakdown.clarity} />
          </Section>

          {result.ai.strengths.length > 0 ? (
            <Section title="What's good" icon="thumbs-up-outline">
              {result.ai.strengths.map((s, i) => (
                <View key={i} className="mb-2 flex-row">
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#34C759"
                    style={{ marginTop: 1 }}
                  />
                  <Text className={`ml-2 flex-1 text-[15px] leading-[21px] ${INK}`}>{s}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          <Section title="ATS checks" icon="shield-checkmark-outline">
            {result.checks.map((k, i) => (
              <View key={k.id}>
                {i > 0 ? <Divider /> : null}
                <View className="flex-row items-start">
                  <Ionicons
                    name={k.passed ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={k.passed ? "#34C759" : "#FF3B30"}
                    style={{ marginTop: 1 }}
                  />
                  <View className="ml-2 flex-1">
                    <View className="flex-row justify-between">
                      <Text className={`flex-1 text-[15px] font-semibold ${INK}`}>{k.label}</Text>
                      <Text className={`text-[13px] ${MUTED}`}>
                        {k.points}/{k.max}
                      </Text>
                    </View>
                    {!k.passed ? (
                      <Text className={`mt-0.5 text-[13px] leading-[18px] ${MUTED}`}>{k.tip}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </Section>

          {result.ai.mistakes.length > 0 ? (
            <Section title="Mistakes to fix" icon="alert-circle-outline">
              {result.ai.mistakes.map((m, i) => (
                <View key={i}>
                  {i > 0 ? <Divider /> : null}
                  <Text className={`text-[12px] font-semibold uppercase ${MUTED}`}>
                    {m.section}
                  </Text>
                  <Text className={`mt-1 text-[15px] leading-[21px] ${INK}`}>{m.issue}</Text>
                  <Text className="mt-1 text-[14px] leading-[20px] text-brand dark:text-brand-dark">
                    Fix: {m.fix}
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}

          {result.ai.grammar.length > 0 ? (
            <Section title="Grammar & wording" icon="create-outline">
              {result.ai.grammar.map((g, i) => (
                <View key={i}>
                  {i > 0 ? <Divider /> : null}
                  <Text className="text-[14px] leading-[20px] text-[#EF4444] dark:text-[#FF453A]">
                    {g.original}
                  </Text>
                  <Text className="mt-1 text-[14px] leading-[20px] text-[#248A3D] dark:text-[#30D158]">
                    {g.suggestion}
                  </Text>
                  <Text className={`mt-1 text-[13px] ${MUTED}`}>{g.reason}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          {result.ai.rewrites.length > 0 ? (
            <Section title="Better bullet points" icon="sparkles-outline">
              {result.ai.rewrites.map((r, i) => (
                <View key={i}>
                  {i > 0 ? <Divider /> : null}
                  <Text className={`text-[13px] ${MUTED}`}>Before</Text>
                  <Text className={`mb-2 text-[14px] leading-[20px] ${INK}`}>{r.original}</Text>
                  <Text className={`text-[13px] ${MUTED}`}>After</Text>
                  <Text className={`text-[14px] font-semibold leading-[20px] ${INK}`}>
                    {r.improved}
                  </Text>
                  <Text className={`mt-1 text-[13px] ${MUTED}`}>{r.why}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          {result.ai.stackTips.length > 0 ? (
            <Section title="Tips for your stack" icon="code-slash-outline">
              {result.ai.stackTips.map((t, i) => (
                <View key={i} className="mb-2 flex-row">
                  <Ionicons
                    name="arrow-forward-circle"
                    size={18}
                    color={c.brand}
                    style={{ marginTop: 1 }}
                  />
                  <Text className={`ml-2 flex-1 text-[15px] leading-[21px] ${INK}`}>{t}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          {result.ai.missingKeywords.length > 0 ? (
            <Section title="Missing keywords" icon="key-outline">
              <View className="flex-row flex-wrap">
                {result.ai.missingKeywords.map((k) => (
                  <View
                    key={k}
                    className="m-1 rounded-full bg-black/5 px-3 py-1.5 dark:bg-white/10"
                  >
                    <Text className={`text-[13px] ${INK}`}>{k}</Text>
                  </View>
                ))}
              </View>
              <Text className={`mt-2 text-[12px] ${MUTED}`}>
                Add only the ones you really know.
              </Text>
            </Section>
          ) : null}

          <Text className={`mt-5 px-1 text-center text-[12px] leading-[17px] ${MUTED}`}>
            This is an estimate based on common ATS rules, not the score of a specific ATS like
            Workday or Greenhouse.
          </Text>

          <View className="mt-5">
            <Button label="Check another resume" variant="secondary" onPress={reset} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
