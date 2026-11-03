import { memo, useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useTabBarInset } from "../../components/common/GlassTabBar";
import { CenterState, useResumeColors } from "../../components/resume/ResumeUI";
import TemplateThumb from "../../components/resume/TemplateThumb";
import { apiError, resumeService } from "../../services/resumeService";
import { TemplateInfo } from "../../types/resume";
import { AppStackParamList } from "../../types/navigation";
import TemplateBadges from "../../components/resume/TemplateBadge";
import { useTemplateGate } from "../../components/ads/useTemplateGate";
import { adsNeeded, useAccess } from "../../context/AccessContext";

const H_PAD = 20;
const GAP = 16;

const RowSeparator = () => <View style={{ height: 26 }} />;

const TemplateCard = memo(function TemplateCard({
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
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: c.dark ? 0 : 0.16,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <View
          style={{
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 0.5,
            borderColor: c.sep,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TemplateThumb id={item.id} width={width} />
          <TemplateBadges item={item} locked={locked} watched={watched} required={required} />
        </View>
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

export default function ResumeTemplatesScreen() {
  const c = useResumeColors();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const { width: screenW } = useWindowDimensions();
  const tabInset = useTabBarInset();
  const { access, canUse, watched } = useAccess();

  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardW = Math.floor((screenW - H_PAD * 2 - GAP) / 2);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setTemplates(await resumeService.listTemplates());
    } catch (e) {
      setError(apiError(e, "Couldn't load templates."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goStart = useCallback(
    (t: TemplateInfo) => navigation.navigate("ResumeStart", { templateId: t.id }),
    [navigation],
  );
  const { gate, sheet } = useTemplateGate(goStart);

  const required = adsNeeded(access);
  const renderItem = useCallback(
    ({ item }: { item: TemplateInfo }) => (
      <TemplateCard
        item={item}
        width={cardW}
        locked={!canUse(item)}
        watched={watched(item.id)}
        required={required}
        onOpen={gate}
      />
    ),
    [cardW, gate, canUse, watched, required],
  );

  const empty = loading ? (
    <CenterState loading />
  ) : error ? (
    <CenterState message={error} onRetry={() => load()} />
  ) : (
    <CenterState message="No templates available right now." onRetry={() => load()} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <FlatList
        data={loading || error ? [] : templates}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        extraData={access}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: H_PAD, columnGap: GAP }}
        ItemSeparatorComponent={RowSeparator}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 20 }}>
            <Text style={{ fontSize: 34, fontWeight: "700", letterSpacing: 0.37, color: c.ink }}>
              Templates
            </Text>
            <Text style={{ fontSize: 15, marginTop: 2, color: c.muted }}>
              Watch 3 ads to unlock a template. Greyed ones are locked.
            </Text>
          </View>
        }
        ListEmptyComponent={empty}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabInset + 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      />
      {sheet}
    </SafeAreaView>
  );
}
