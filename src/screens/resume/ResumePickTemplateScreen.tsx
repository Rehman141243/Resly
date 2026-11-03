import { memo, useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CenterState, NavBar, useResumeColors } from "../../components/resume/ResumeUI";
import TemplateThumb from "../../components/resume/TemplateThumb";

import { apiError, resumeService } from "../../services/resumeService";
import { TemplateInfo } from "../../types/resume";
import { AppStackParamList } from "../../types/navigation";
import TemplateBadges from "../../components/resume/TemplateBadge";
import { useTemplateGate } from "../../components/ads/useTemplateGate";
import { adsNeeded, useAccess } from "../../context/AccessContext";

type Props = NativeStackScreenProps<AppStackParamList, "ResumePickTemplate">;
const H_PAD = 20;
const GAP = 16;

const Card = memo(function Card({
  item,
  width,
  locked,
  watched,
  required,
  onOpen,
}: {
  item: TemplateInfo;
  width: number;
  locked: boolean;
  watched: number;
  required: number;
  onOpen: (t: TemplateInfo) => void;
}) {
  const c = useResumeColors();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onOpen(item)}
      style={{ width, opacity: item.adUnlockable ? 1 : 0.55 }}
    >
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: c.sep,
          backgroundColor: "#fff",
        }}
      >
        <TemplateThumb id={item.id} width={width} />
        <TemplateBadges item={item} locked={locked} watched={watched} required={required} />
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 16, fontWeight: "600", marginTop: 12, color: c.ink }}
      >
        {item.name}
      </Text>
      <Text
        numberOfLines={2}
        style={{ fontSize: 13, lineHeight: 18, marginTop: 3, color: c.muted }}
      >
        {item.description}
      </Text>
    </TouchableOpacity>
  );
});

export default function ResumePickTemplateScreen({ navigation, route }: Props) {
  const c = useResumeColors();
  const { data, title } = route.params;
  const { width: screenW } = useWindowDimensions();
  const { access, canUse, watched } = useAccess();

  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardW = Math.floor((screenW - H_PAD * 2 - GAP) / 2);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await resumeService.listTemplates());
    } catch (e) {
      setError(apiError(e, "Couldn't load templates."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const goEdit = useCallback(
    (t: TemplateInfo) => {
      navigation.navigate("ResumeEditor", { templateId: t.id, initialData: data, title });
    },
    [navigation, data, title],
  );
  const { gate, sheet } = useTemplateGate(goEdit);
  const required = adsNeeded(access);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
      <NavBar title="Choose template" onBack={() => navigation.goBack()} />
      <FlatList
        data={loading || error ? [] : templates}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <Card
            item={item}
            width={cardW}
            locked={!canUse(item)}
            watched={watched(item.id)}
            required={required}
            onOpen={gate}
          />
        )}
        extraData={access}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: H_PAD, columnGap: GAP }}
        ItemSeparatorComponent={() => <View style={{ height: 26 }} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 20 }}>
            <Text style={{ fontSize: 15, color: c.muted }}>
              Your details will be filled in automatically. You can still edit everything next.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <CenterState loading />
          ) : (
            <CenterState message={error ?? "No templates available."} onRetry={load} />
          )
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
      />
      {sheet}
    </SafeAreaView>
  );
}
