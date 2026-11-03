import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Reveal from "../../components/common/Reveal";
import ScalePress from "../../components/common/ScalePress";
import { useTabBarInset } from "../../components/common/GlassTabBar";
import PenguinName from "../../components/PenguinName";
import { resumeService } from "../../services/resumeService";
import { ResumeListItem } from "../../types/resume";
import { AppStackParamList } from "../../types/navigation";
import Avatar from "../../components/profile/Avatar";

const TIPS: { id: string; title: string; text: string; icon: string }[] = [
  {
    id: "1",
    title: "Add measurable results",
    text: "Numbers make your impact clear to recruiters.",
    icon: "trending-up",
  },
  {
    id: "2",
    title: "Keep it to one page",
    text: "Under 10 years of experience? One page is enough.",
    icon: "document-text-outline",
  },
  {
    id: "3",
    title: "Match the job keywords",
    text: "Helps your resume pass ATS screening.",
    icon: "search",
  },
];

const BLUE = "#0A84FF";
const GREEN = "#30B650";
const ORANGE = "#FF9F0A";

const GLASS =
  "overflow-hidden rounded-[22px] border-[0.5px] border-white/70 bg-white/60 dark:border-white/10 dark:bg-white/10";

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Edited today";
  if (days === 1) return "Edited yesterday";
  if (days < 7) return `Edited ${days} days ago`;
  if (days < 14) return "Edited last week";
  return `Edited ${new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

const prettyTemplate = (id: string) =>
  (id ?? "").replace(/[-_]/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

function Glow({ color, size, style }: { color: string; size: number; style: object }) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {[1, 0.78, 0.58, 0.4, 0.24].map((s) => (
        <View
          key={s}
          style={{
            position: "absolute",
            width: size * s,
            height: size * s,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.07,
          }}
        />
      ))}
    </View>
  );
}

const PAPER_LINES = [0.9, 0.62, 1, 0.78, 0.5];

function WritingPaper() {
  const lines = useRef(PAPER_LINES.map(() => new Animated.Value(0))).current;
  const badge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.stagger(
        170,
        lines.map((l) =>
          Animated.timing(l, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ),
      ),
      Animated.spring(badge, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [lines, badge]);

  return (
    <View style={{ transform: [{ rotate: "-5deg" }] }}>
      <View
        className="h-[118px] w-[88px] rounded-xl bg-white p-3"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View className="mb-3 flex-row items-center">
          <View className="h-5 w-5 rounded-full bg-brand" />
          <View className="ml-2 h-1.5 flex-1 rounded-full bg-[#1B2559]" />
        </View>
        {lines.map((l, i) => (
          <Animated.View
            key={i}
            className="mb-2 h-1.5 rounded-full bg-[#DCE6F5]"
            style={{
              width: l.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", `${PAPER_LINES[i] * 100}%`],
              }),
            }}
          />
        ))}
      </View>

      <Animated.View
        className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-brand"
        style={{ opacity: badge, transform: [{ scale: badge }] }}
      >
        <Text className="text-xs text-white">✦</Text>
      </Animated.View>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-2.5 mt-7 flex-row items-end justify-between px-6">
      <Text className="text-[22px] font-bold tracking-tight text-ink dark:text-ink-dark">
        {title}
      </Text>
      {action ? (
        <ScalePress onPress={onAction}>
          <Text className="text-[16px] text-brand dark:text-brand-dark">{action}</Text>
        </ScalePress>
      ) : null}
    </View>
  );
}

function ListRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: string;
  color: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      <ScalePress scaleTo={0.985} onPress={onPress} className="flex-row items-center px-4 py-3">
        <View
          className="h-[34px] w-[34px] items-center justify-center rounded-[9px]"
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon} size={19} color="#FFFFFF" />
        </View>
        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-[17px] text-ink dark:text-ink-dark">
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} className="mt-0.5 text-[13px] text-muted dark:text-muted-dark">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.muted} />
      </ScalePress>
      {!last ? <View className="ml-[58px] h-[0.5px] bg-black/10 dark:bg-white/15" /> : null}
    </>
  );
}

export default function HomeScreen() {
  const tabInset = useTabBarInset();
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const toast = useToast();

  const email = user?.email ?? "";
  const fullName = user?.user_metadata?.full_name?.trim() || email.split("@")[0] || "";

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const list = await resumeService.list();
          if (active) setResumes(list);
        } catch {
          if (active) setResumes([]);
        } finally {
          if (active) setResumesLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const recent = useMemo(
    () =>
      [...resumes]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3),
    [resumes],
  );

  const openPreview = (r: ResumeListItem) =>
    navigation.navigate("ResumePreview", { resumeId: r.id, title: r.title });

  const goResumesTab = () => navigation.navigate("Tabs", { screen: "Resumes" });
  const goTemplatesTab = () => navigation.navigate("Tabs", { screen: "Templates" });

  return (
    <View className="flex-1 bg-[#F4F7FC] dark:bg-canvas-dark">
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <Glow color={colors.brand} size={340} style={{ top: -90, right: -110 }} />
      <Glow color="#A78BFA" size={300} style={{ top: 460, left: -140 }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabInset + 8 }}
      >
      
        <PenguinName name={fullName} size={40} />

        <Reveal index={1}>
          <View
            className={`mx-5 mt-5 flex-row items-center p-5 ${GLASS}`}
            style={{ borderRadius: 28 }}
          >
            <View className="flex-1 pr-3">
              <Text className="text-[24px] font-bold leading-[30px] tracking-tight text-ink dark:text-ink-dark">
                Write your resume with AI
              </Text>
              <Text className="mt-1.5 text-[14px] leading-5 text-muted dark:text-muted-dark">
                Answer a few questions and get a finished draft in a minute.
              </Text>
              <ScalePress
                className="mt-4 self-start rounded-full bg-brand px-5 py-2.5"
                onPress={() => navigation.navigate("ResumeAts")}
                // onPress={() => toast.success("AI draft started")}
              >
                <Text className="text-[15px] font-semibold text-white">Start with AI</Text>
              </ScalePress>
            </View>
            <WritingPaper />
          </View>
        </Reveal>

        <Reveal index={2}>
          <SectionHeader title="Tools" />
          <View className={`mx-5 ${GLASS}`}>
            <ListRow
              icon="shield-checkmark"
              color={GREEN}
              title="Check your resume"
              subtitle="ATS score, grammar fixes and tips"
              onPress={() => navigation.navigate("ResumeAts")}
            />
            <ListRow
              icon="cloud-upload"
              color={BLUE}
              title="Import resume"
              subtitle="Import PDF from exsiting resume is coming soon"
              onPress={() => toast.success("Import PDF from exsiting resume is coming soon")}
              // onPress={() => navigation.navigate("ResumeImport")}
            />
            <ListRow
              icon="mail"
              color={ORANGE}
              title="Cover letter"
              subtitle="Coming soon"
              onPress={() => toast.success("Cover letter is coming soon")}
              last
            />
          </View>
        </Reveal>

        <Reveal index={3}>
          <SectionHeader
            title="Recent"
            action={resumes.length > 0 ? "See all" : undefined}
            onAction={goResumesTab}
          />
          <View className={`mx-5 ${GLASS}`}>
            {resumesLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : recent.length === 0 ? (
              <ScalePress onPress={goTemplatesTab} className="items-center px-6 py-8">
                <Text className="text-[17px] font-semibold text-ink dark:text-ink-dark">
                  No resumes yet
                </Text>
                <Text className="mt-1 text-center text-[14px] text-muted dark:text-muted-dark">
                  Tap to pick a template and create your first one.
                </Text>
              </ScalePress>
            ) : (
              recent.map((r, i) => (
                <ListRow
                  key={r.id}
                  icon="document-text"
                  color={colors.brand}
                  title={r.title}
                  subtitle={`${prettyTemplate(r.template_id)} · ${timeAgo(r.updated_at)}`}
                  onPress={() => openPreview(r)}
                  last={i === recent.length - 1}
                />
              ))
            )}
          </View>
        </Reveal>

        <Reveal index={4}>
          <SectionHeader title="Tips to stand out" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={232}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {TIPS.map((t) => (
              <View key={t.id} className="mr-3 w-[220px]">
                <View className={`p-4 ${GLASS}`}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/20">
                    <Ionicons name={t.icon} size={19} color={colors.brand} />
                  </View>
                  <Text className="mt-3 text-[16px] font-semibold text-ink dark:text-ink-dark">
                    {t.title}
                  </Text>
                  <Text className="mt-1 text-[14px] leading-5 text-muted dark:text-muted-dark">
                    {t.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Reveal>
      </ScrollView>
    </View>
  );
}
