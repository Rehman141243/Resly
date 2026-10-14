import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "../../constant/icon";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Reveal from "../../components/common/Reveal";
import ScalePress from "../../components/common/ScalePress";

/* ---------- Mock data: replace with API later ---------- */

const QUICK_ACTIONS: { label: string; icon: IconName }[] = [
  { label: "Import", icon: "upload" },
  { label: "Templates", icon: "layout" },
  { label: "Cover letter", icon: "mail" },
];

const RESUMES = [
  { id: "1", title: "Product Designer", edited: "Edited today", score: 92 },
  { id: "2", title: "Frontend Developer", edited: "Edited 3 days ago", score: 84 },
  { id: "3", title: "Marketing Lead", edited: "Edited last week", score: 71 },
];

const TIPS: { id: string; title: string; text: string; icon: IconName }[] = [
  { id: "1", title: "Add measurable results", text: "Numbers make your impact clear to recruiters.", icon: "trending-up" },
  { id: "2", title: "Keep it to one page", text: "Under 10 years of experience? One page is enough.", icon: "file-text" },
  { id: "3", title: "Match the job keywords", text: "Helps your resume pass ATS screening.", icon: "search" },
];

/* ---------- Hero illustration: resume being written ---------- */

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
            useNativeDriver: false, // animating width
          })
        )
      ),
      Animated.spring(badge, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [lines, badge]);

  return (
    <View style={{ transform: [{ rotate: "-5deg" }] }}>
      <View className="h-36 w-28 rounded-xl bg-white p-3">
        <View className="mb-3 flex-row items-center">
          <View className="h-6 w-6 rounded-full bg-brand" />
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
        className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-brand"
        style={{ opacity: badge, transform: [{ scale: badge }] }}
      >
        <Text className="text-sm text-white">✦</Text>
      </Animated.View>
    </View>
  );
}

/* ---------- Screen ---------- */

function scoreStyle(score: number) {
  if (score >= 85) return { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" };
  if (score >= 75) return { bg: "bg-brand/10 dark:bg-brand-dark/20", text: "text-brand dark:text-brand-dark" };
  return { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();
  const { user } = useAuth() as { user?: { name?: string } | null };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <View className="flex-1 bg-[#F4F7FC] dark:bg-canvas-dark">
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      >
        {/* Large title */}
        <Reveal index={0}>
          <View className="flex-row items-center justify-between px-6">
            <View>
              <Text className="text-[34px] font-bold tracking-tight text-ink dark:text-ink-dark">Resumes</Text>
              <Text className="mt-1 text-base text-muted dark:text-muted-dark">
                Hi {firstName}, {RESUMES.length} saved, 1 needs review
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
              <Text className="text-base font-semibold text-white">{firstName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </Reveal>

        {/* Hero */}
        <Reveal index={1}>
          <View className="mx-6 mt-6 flex-row items-center overflow-hidden rounded-[28px] bg-[#1B2559] p-6 dark:bg-[#2C2C2E]">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold leading-8 text-white">Write your resume with AI</Text>
              <Text className="mt-2 text-sm leading-5 text-white/60">
                Answer a few questions and get a finished draft in a minute.
              </Text>
              <ScalePress className="mt-5 self-start rounded-full bg-brand px-5 py-3">
                <Text className="text-base font-semibold text-white">Start with AI</Text>
              </ScalePress>
            </View>
            <WritingPaper />
          </View>
        </Reveal>

        {/* Quick actions */}
        <Reveal index={2}>
          <View className="mt-4 flex-row px-6">
            {QUICK_ACTIONS.map((a, i) => (
              <View key={a.label} className={i === 0 ? "flex-1" : "ml-3 flex-1"}>
                <ScalePress className="items-center rounded-[20px] bg-surface py-4 dark:bg-surface-dark">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/20">
                    <Icon name={a.icon} size={18} color={colors.brand} />
                  </View>
                  <Text className="mt-2 text-sm font-medium text-ink dark:text-ink-dark">{a.label}</Text>
                </ScalePress>
              </View>
            ))}
          </View>
        </Reveal>

        {/* Recent */}
        <Reveal index={3}>
          <View className="mt-8 flex-row items-end justify-between px-6">
            <Text className="text-xl font-bold text-ink dark:text-ink-dark">Recent</Text>
            <Text className="text-base text-brand dark:text-brand-dark">See all</Text>
          </View>

          <View className="mx-6 mt-3 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            {RESUMES.map((r, i) => {
              const s = scoreStyle(r.score);
              return (
                <View key={r.id}>
                  <ScalePress scaleTo={0.985} className="flex-row items-center px-4 py-3.5">
                    <View className="h-11 w-9 justify-center rounded-md border border-line bg-[#F4F7FC] px-1.5 dark:border-line-dark dark:bg-canvas-dark">
                      <View className="mb-1 h-0.5 rounded bg-brand dark:bg-brand-dark" />
                      <View className="mb-1 h-0.5 rounded bg-line dark:bg-line-dark" />
                      <View className="h-0.5 w-1/2 rounded bg-line dark:bg-line-dark" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-ink dark:text-ink-dark">{r.title}</Text>
                      <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">{r.edited}</Text>
                    </View>

                    <View className={`rounded-full px-2.5 py-1 ${s.bg}`}>
                      <Text className={`text-sm font-semibold ${s.text}`}>{r.score}</Text>
                    </View>
                  </ScalePress>
                  {i < RESUMES.length - 1 ? (
                    <View className="ml-[68px] h-px bg-line dark:bg-line-dark" />
                  ) : null}
                </View>
              );
            })}
          </View>
        </Reveal>

        {/* Tips */}
        <Reveal index={4}>
          <Text className="mt-8 px-6 text-xl font-bold text-ink dark:text-ink-dark">Tips to stand out</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12 }}
          >
            {TIPS.map((t) => (
              <View key={t.id} className="mr-3 w-[230px]">
                <ScalePress className="rounded-[24px] bg-surface p-4 dark:bg-surface-dark">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 dark:bg-brand-dark/20">
                    <Icon name={t.icon} size={20} color={colors.brand} />
                  </View>
                  <Text className="mt-3 text-base font-bold text-ink dark:text-ink-dark">{t.title}</Text>
                  <Text className="mt-1 text-sm leading-5 text-muted dark:text-muted-dark">{t.text}</Text>
                </ScalePress>
              </View>
            ))}
          </ScrollView>
        </Reveal>
      </ScrollView>
    </View>
  );
}