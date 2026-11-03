import { memo, useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTabBarInset } from "../../components/common/GlassTabBar";
import { Button, CenterState, useResumeColors } from "../../components/resume/ResumeUI";
import { apiError, resumeService } from "../../services/resumeService";
import { downloadResume } from "../../services/downloadResume";
import { ResumeListItem } from "../../types/resume";
import { AppStackParamList } from "../../types/navigation";

const INK = "text-ink dark:text-ink-dark";
const MUTED = "text-muted dark:text-muted-dark";

const MENU_W = 208;
const MENU_ROW_H = 44;
const MENU_H = 4 * MENU_ROW_H + 12 + 9;

const PALETTE = [
  { light: "#DCE9F2", dark: "#1B2A33", btn: "#46697F" },
  { light: "#DDDFF5", dark: "#232540", btn: "#5E6396" },
  { light: "#F7E3DC", dark: "#33241F", btn: "#B5705E" },
  { light: "#E0F0E3", dark: "#1D2E24", btn: "#4F8A63" },
];
const PANEL = { light: "#F1F6FA", dark: "#0F1A21" };
const PANEL_ACCENT = "#46697F";

type MenuState = { item: ResumeListItem; x: number; y: number } | null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const prettyTemplate = (id: string) =>
  id.replace(/[-_]/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning 👋" : h < 18 ? "Good afternoon 👋" : "Good evening 👋";
};

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const c = useResumeColors();
  return (
    <Pressable
      onPress={onPress}
      style={{ height: MENU_ROW_H }}
      className="flex-row items-center rounded-xl px-3 active:bg-canvas/60 dark:active:bg-white/10"
    >
      <Ionicons name={icon} size={18} color={destructive ? c.error : c.muted} />
      <Text
        className={`ml-3 text-[15px] ${destructive ? "text-[#EF4444] dark:text-[#FF453A]" : INK}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const MenuSep = () => <View className="mx-3 my-1 h-px bg-line dark:bg-line-dark" />;

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="mr-3 flex-row items-center rounded-full bg-white py-2 pl-2 pr-5 dark:bg-[#1C1C1E]">
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: "#DCE9F2" }}
      >
        <Ionicons name={icon} size={20} color={PANEL_ACCENT} />
      </View>
      <View className="ml-2.5">
        <Text className={`text-[12px] ${MUTED}`}>{label}</Text>
        <Text className={`text-[15px] font-semibold ${INK}`}>{value}</Text>
      </View>
    </View>
  );
}

const ResumeCard = memo(function ResumeCard({
  item,
  index,
  dark,
  onOpen,
  onMenu,
}: {
  item: ResumeListItem;
  index: number;
  dark: boolean;
  onOpen: (r: ResumeListItem) => void;
  onMenu: (r: ResumeListItem, pageY: number) => void;
}) {
  const c = useResumeColors();
  const p = PALETTE[index % PALETTE.length];

  return (
    <Pressable
      onPress={() => onOpen(item)}
      className="mb-4 rounded-[28px] p-4 active:opacity-80"
      style={{ backgroundColor: dark ? p.dark : p.light }}
    >
      <View className="flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#2C2C2E]">
          <Ionicons name="document-text-outline" size={24} color={p.btn} />
        </View>

        <View className="ml-3 mr-2 flex-1">
          <Text numberOfLines={1} className={`text-[19px] font-semibold ${INK}`}>
            {item.title}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="time-outline" size={14} color={c.muted} />
            <Text className={`ml-1 text-[13px] ${MUTED}`}>{formatDate(item.updated_at)}</Text>
          </View>
        </View>

        <Pressable
          onPress={(e) => onMenu(item, e.nativeEvent.pageY)}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: p.btn }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="my-3 h-px bg-black/10 dark:bg-white/10" />

      <View className="flex-row items-center justify-between">
        <Text numberOfLines={1} className={`flex-1 text-[13px] ${INK}`}>
          {prettyTemplate(item.template_id)}
        </Text>
        <Text className={`text-[13px] ${MUTED}`}>Tap to edit</Text>
      </View>
    </Pressable>
  );
});

export default function ResumeListScreen() {
  const dark = useColorScheme() === "dark";
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const tabInset = useTabBarInset();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [items, setItems] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      setItems(await resumeService.list());
    } catch (e) {
      setError(apiError(e, "Couldn't load your resumes."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const goTemplates = useCallback(
    () => navigation.navigate("Tabs", { screen: "Templates" }),
    [navigation],
  );
  const edit = useCallback(
    (r: ResumeListItem) => navigation.navigate("ResumeEditor", { resumeId: r.id }),
    [navigation],
  );
  const preview = useCallback(
    (r: ResumeListItem) => navigation.navigate("ResumePreview", { resumeId: r.id, title: r.title }),
    [navigation],
  );

  const confirmDelete = useCallback((r: ResumeListItem) => {
    Alert.alert("Delete resume?", `“${r.title}” will be deleted permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await resumeService.remove(r.id);
            setItems((prev) => prev.filter((x) => x.id !== r.id));
          } catch (e) {
            Alert.alert("Couldn't delete", apiError(e));
          }
        },
      },
    ]);
  }, []);

  const openMenu = useCallback(
    (item: ResumeListItem, pageY: number) => {
      const openUp = pageY + MENU_H + 24 > screenH - tabInset;
      const y = openUp ? pageY - MENU_H - 8 : pageY + 12;
      setMenu({ item, x: screenW - MENU_W - 20, y });
    },
    [screenW, screenH, tabInset],
  );

  const run = (fn: (r: ResumeListItem) => void) => {
    const r = menu?.item;
    setMenu(null);
    if (r) setTimeout(() => fn(r), 150);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: ResumeListItem; index: number }) => (
      <ResumeCard item={item} index={index} dark={dark} onOpen={edit} onMenu={openMenu} />
    ),
    [dark, edit, openMenu],
  );

  const stats = useMemo(() => {
    const templates = new Set(items.map((i) => i.template_id)).size;
    const latest = items.reduce<string | null>(
      (acc, i) => (!acc || new Date(i.updated_at) > new Date(acc) ? i.updated_at : acc),
      null,
    );
    return { templates, latest: latest ? formatDate(latest) : "—" };
  }, [items]);

  const emptyState = (
    <View className="items-center px-8 pt-16">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-[#DCE9F2] dark:bg-[#1B2A33]">
        <Ionicons name="document-text-outline" size={34} color={PANEL_ACCENT} />
      </View>
      <Text className={`mb-1.5 text-[20px] font-semibold ${INK}`}>No resumes yet</Text>
      <Text className={`mb-6 text-center text-[15px] leading-[21px] ${MUTED}`}>
        Pick a template and build your first resume in a few minutes.
      </Text>
      <Button label="Browse templates" onPress={goTemplates} style={{ paddingHorizontal: 28 }} />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: dark ? PANEL.dark : PANEL.light }}
      edges={["top"]}
    >
      <View className="px-5 pb-6 pt-3">
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className={`text-[14px] ${MUTED}`}>{greeting()}</Text>
            <Text className={`text-[22px] font-semibold ${INK}`}>My resumes</Text>
          </View>
          <Pressable
            onPress={goTemplates}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-[#1C1C1E]"
          >
            <Ionicons name="add" size={26} color={PANEL_ACCENT} />
          </Pressable>
        </View>

        <View className="mt-5 flex-row items-end">
          <Text className={`text-[52px] font-bold leading-[58px] ${INK}`}>{items.length}</Text>
          <Text className={`mb-2.5 ml-2 text-[18px] ${MUTED}`}>
            {items.length === 1 ? "resume" : "resumes"}
          </Text>
        </View>

        <View className="mt-4 flex-row">
          <StatChip icon="copy-outline" label="Templates" value={String(stats.templates)} />
          <StatChip icon="time-outline" label="Last edit" value={stats.latest} />
        </View>
      </View>

      <View className="flex-1 rounded-t-[32px] bg-white px-5 pt-6 dark:bg-black">
        <Text className={`mb-4 text-[20px] font-semibold ${INK}`}>Your resumes</Text>

        {loading ? (
          <CenterState loading />
        ) : error ? (
          <CenterState message={error} onRetry={() => load()} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(r) => r.id}
            renderItem={renderItem}
            ListEmptyComponent={emptyState}
            initialNumToRender={6}
            windowSize={7}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            contentContainerStyle={{ paddingBottom: tabInset + 16, flexGrow: 1 }}
          />
        )}
      </View>

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable className="flex-1 bg-black/10" onPress={() => setMenu(null)}>
          {menu ? (
            <View
              className="absolute rounded-2xl border border-line bg-surface p-1.5 dark:border-line-dark dark:bg-surface-dark"
              style={{
                top: menu.y,
                left: menu.x,
                width: MENU_W,
                shadowColor: "#1B2559",
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <MenuItem icon="create-outline" label="Edit" onPress={() => run(edit)} />
              <MenuItem icon="eye-outline" label="Preview" onPress={() => run(preview)} />
              <MenuItem
                icon="download-outline"
                label="Download PDF"
                onPress={() => run((r) => downloadResume(r.id, r.title))}
              />
              <MenuSep />
              <MenuItem
                icon="trash-outline"
                label="Delete"
                destructive
                onPress={() => run(confirmDelete)}
              />
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
