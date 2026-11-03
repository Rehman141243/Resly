import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { pick, types } from "@react-native-documents/picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppStackParamList } from "../../types/navigation";
import { importResume } from "../../services/importService";
import { getErrorMessage } from "../../services/apiClient";
import { Button, NavBar, useResumeColors } from "../../components/resume/ResumeUI";
import AnalyzingPenguin from "../../components/resume/AnalyzingPenguin";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeImport">;
type PickedFile = { uri: string; name: string; size?: number | null };

const INK = "text-ink dark:text-ink-dark";
const MUTED = "text-muted dark:text-muted-dark";
const MAX_BYTES = 5 * 1024 * 1024;

export default function ResumeImportScreen({ navigation }: Props) {
  const c = useResumeColors();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);

  const choose = async () => {
    try {
      const [f] = await pick({ type: [types.pdf] });
      if (!f) return;
      if (f.size && f.size > MAX_BYTES)
        return Alert.alert("File too large", "PDF must be under 5 MB.");
      setFile({ uri: f.uri, name: f.name ?? "resume.pdf", size: f.size });
    } catch (e: any) {
      if (!/cancel/i.test(String(e?.code ?? e?.message)))
        Alert.alert("Couldn't open file", String(e?.message ?? e));
    }
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const r = await importResume(file, stack.trim());
      navigation.replace("ResumeImprove", {
        data: r.data,
        result: r.result,
        stack: stack.trim(),
        source: r.source,
        fileName: file.name,
      });
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Import failed", getErrorMessage(e, e?.message || "Please try again."));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={["top", "bottom"]}>
      <NavBar title="Import resume" onBack={() => navigation.goBack()} />
      {loading ? (
        <AnalyzingPenguin />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text className={`mb-1 mt-2 px-1 text-[28px] font-bold ${INK}`}>Import your resume</Text>
          <Text className={`mb-5 px-1 text-[15px] leading-[21px] ${MUTED}`}>
            We read your PDF, score it for ATS, and suggest changes you can apply with one tap. Then
            pick a template.
          </Text>

          <Pressable
            onPress={choose}
            className="items-center rounded-[14px] border-[1.5px] border-dashed border-[#C6C6C8] bg-white px-4 py-8 active:opacity-70 dark:border-[#38383A] dark:bg-[#1C1C1E]"
          >
            <Ionicons
              name={file ? "document-text" : "cloud-upload-outline"}
              size={40}
              color={c.brand}
            />
            <Text className={`mt-3 text-center text-[16px] font-semibold ${INK}`} numberOfLines={2}>
              {file ? file.name : "Choose your resume PDF"}
            </Text>
            <Text className={`mt-1 text-[13px] ${MUTED}`}>
              {file ? "Tap to change" : "PDF only, max 5 MB"}
            </Text>
          </Pressable>

          <Text className={`mb-1.5 ml-1 mt-6 text-[13px] uppercase tracking-[0.3px] ${MUTED}`}>
            Target stack or role (optional)
          </Text>
          <View className="rounded-xl bg-white px-4 dark:bg-[#1C1C1E]">
            <TextInput
              value={stack}
              onChangeText={setStack}
              maxLength={200}
              placeholder="e.g. React Native, Node.js"
              placeholderTextColor={c.placeholder}
              className={`py-3.5 text-[16px] ${INK}`}
            />
          </View>

          <View className="mt-8">
            <Button label="Import & analyze" onPress={run} disabled={!file} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
